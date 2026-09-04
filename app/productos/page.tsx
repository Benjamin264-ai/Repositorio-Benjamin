'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, ScanLine, Keyboard } from 'lucide-react'

type Modo = 'elegir' | 'escanear' | 'manual'

export default function NuevoProductoPage() {
  const { profile } = useProfile()
  const router = useRouter()
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const [modo, setModo] = useState<Modo>('elegir')
  const [scanning, setScanning] = useState(false)
  const [codigoBarras, setCodigoBarras] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Se dispara DESPUÉS de que React ya dibujó el div del lector,
  // así la cámara siempre encuentra dónde mostrarse.
  useEffect(() => {
    if (modo !== 'escanear' || codigoBarras) return

    let cancelado = false

    // Verifica repetidamente (cada 50ms, hasta 20 veces = 1 segundo) si la casilla
    // ya existe en pantalla, en vez de asumir un tiempo fijo de espera.
    const esperarElemento = (id: string, intentos = 20): Promise<boolean> =>
      new Promise((resolve) => {
        const check = (restantes: number) => {
          if (document.getElementById(id)) {
            resolve(true)
            return
          }
          if (restantes <= 0) {
            resolve(false)
            return
          }
          setTimeout(() => check(restantes - 1), 50)
        }
        check(intentos)
      })

    const iniciar = async () => {
      setScanning(true)
      setError('')

      const existe = await esperarElemento('reader-nuevo-producto')
      if (cancelado) return

      if (!existe) {
        setError('No se pudo preparar la cámara. Cierra esta pantalla e inténtalo de nuevo.')
        setScanning(false)
        return
      }

      try {
        const scanner = new Html5Qrcode('reader-nuevo-producto')
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 250 },
          async (decodedText) => {
            if (cancelado) return
            try {
              await scanner.stop()
            } catch {
              // La cámara puede fallar al cerrar si ya se limpió sola; no es grave, seguimos.
            }
            setScanning(false)
            setCodigoBarras(decodedText)
          },
          () => {}
        )
      } catch (err) {
        if (!cancelado) {
          const mensaje = err instanceof Error ? err.message : String(err)
          setError(`No se pudo acceder a la cámara: ${mensaje}`)
          setScanning(false)
        }
      }
    }

    iniciar()

    return () => {
      cancelado = true
      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {})
        scannerRef.current = null
      }
    }
  }, [modo, codigoBarras])

  const cancelarEscaneo = () => {
    setModo('elegir')
    setScanning(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!profile?.tienda_id) {
      setError('No se pudo identificar tu tienda. Contacta al admin.')
      return
    }

    setLoading(true)

    let existente: { id: string } | null = null
    if (codigoBarras) {
      const { data } = await supabase
        .from('productos')
        .select('id')
        .eq('codigo_barras', codigoBarras)
        .maybeSingle()
      existente = data
    }
    if (!existente) {
      const { data } = await supabase
        .from('productos')
        .select('id')
        .ilike('nombre', nombre.trim())
        .maybeSingle()
      existente = data
    }

    let productoId = existente?.id

    if (!productoId) {
      const { data: nuevo, error: errorProducto } = await supabase
        .from('productos')
        .insert({
          nombre: nombre.trim(),
          precio: parseFloat(precio),
          codigo_barras: codigoBarras || null,
        })
        .select('id')
        .single()

      if (errorProducto || !nuevo) {
        setLoading(false)
        setError(errorProducto?.message ?? 'No se pudo crear el producto')
        return
      }
      productoId = nuevo.id
    }

    const { error: errorInventario } = await supabase.from('inventario').upsert(
      {
        producto_id: productoId,
        tienda_id: profile.tienda_id,
      },
      { onConflict: 'producto_id,tienda_id', ignoreDuplicates: true }
    )

    setLoading(false)

    if (errorInventario) {
      setError(errorInventario.message)
      return
    }

    router.push('/productos')
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/productos" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-1">Agregar producto</h1>
        <p className="text-sm text-gray-500 mb-4">
          El stock se registra después, desde la lista de Productos.
        </p>

        {/* El error ahora se muestra SIEMPRE que exista, sin importar la pantalla en la que estés */}
        {error && (
          <p className="text-red-700 bg-red-100 rounded-lg px-3 py-2 text-sm mb-4">{error}</p>
        )}

        {modo === 'elegir' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setCodigoBarras('')
                setError('')
                setModo('escanear')
              }}
              className="flex flex-col items-center gap-2 bg-white p-5 rounded-xl shadow-sm border-2 border-transparent hover:border-red-800"
            >
              <ScanLine className="w-7 h-7 text-red-800" />
              <span className="text-sm font-medium text-gray-800">Escanear código</span>
            </button>
            <button
              onClick={() => setModo('manual')}
              className="flex flex-col items-center gap-2 bg-white p-5 rounded-xl shadow-sm border-2 border-transparent hover:border-red-800"
            >
              <Keyboard className="w-7 h-7 text-red-800" />
              <span className="text-sm font-medium text-gray-800">Ingresar manual</span>
            </button>
          </div>
        )}

        {modo === 'escanear' && !codigoBarras && (
          <div className="mb-4">
            <button
              onClick={cancelarEscaneo}
              className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium mb-3"
            >
              Cancelar
            </button>
            {/* Este div SIEMPRE existe apenas entras a modo "escanear", antes de llamar a la cámara */}
            <div id="reader-nuevo-producto"></div>
            {scanning && (
              <p className="text-center text-sm text-gray-500 mt-2">Apunta al código...</p>
            )}
          </div>
        )}

        {(modo === 'manual' || (modo === 'escanear' && codigoBarras)) && (
          <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl shadow-sm mt-4">
            {codigoBarras && (
              <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <p className="text-xs text-red-700 font-medium">Código escaneado:</p>
                <p className="text-sm text-gray-800 font-mono break-all">{codigoBarras}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Precio (S/) — solo aplica si es un producto nuevo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={precio}
                onChange={(e) => setPrecio(e.target.value)}
                required
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-800 text-white py-3 rounded-lg font-medium disabled:opacity-60"
            >
              {loading ? 'Guardando...' : 'Guardar producto'}
            </button>

            <button
              type="button"
              onClick={() => {
                setModo('elegir')
                setCodigoBarras('')
                setNombre('')
                setPrecio('')
                setError('')
              }}
              className="w-full text-sm text-gray-500"
            >
              Empezar de nuevo
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
