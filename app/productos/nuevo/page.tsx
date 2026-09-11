'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { useBarcodeScanner } from '@/lib/useBarcodeScanner'
import { ArrowLeft, ScanLine, Keyboard, ImagePlus } from 'lucide-react'

type Modo = 'elegir' | 'escanear' | 'manual'

export default function NuevoProductoPage() {
  const { profile } = useProfile()
  const router = useRouter()

  const [modo, setModo] = useState<Modo>('elegir')
  const [codigoBarras, setCodigoBarras] = useState('')
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const alDetectar = (codigo: string) => {
    setCodigoBarras(codigo)
  }

  const { videoRef, scanning, error: errorCamara, usaNativo, start, stop } =
    useBarcodeScanner(alDetectar)

  const iniciarEscaneo = () => {
    setCodigoBarras('')
    setError('')
    setModo('escanear')
    start('reader-nuevo-producto')
  }

  const cancelarEscaneo = () => {
    stop()
    setModo('elegir')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!profile?.tienda_id) {
      setError('No se pudo identificar tu tienda. Contacta al admin.')
      return
    }

    setLoading(true)

    let fotoUrl: string | null = null
    if (foto) {
      const extension = foto.name.split('.').pop()
      const nombreArchivo = `${crypto.randomUUID()}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('productos-fotos')
        .upload(nombreArchivo, foto)

      if (errorSubida) {
        setLoading(false)
        setError('No se pudo subir la foto: ' + errorSubida.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from('productos-fotos')
        .getPublicUrl(nombreArchivo)

      fotoUrl = urlData.publicUrl
    }

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
          descripcion: descripcion.trim() || null,
          codigo_barras: codigoBarras || null,
          foto_url: fotoUrl,
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

        {(error || errorCamara) && (
          <p className="text-red-700 bg-red-100 rounded-lg px-3 py-2 text-sm mb-4">
            {error || errorCamara}
          </p>
        )}

        {modo === 'elegir' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={iniciarEscaneo}
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
            <video
              ref={videoRef}
              playsInline
              muted
              className={`w-full rounded-lg ${scanning && usaNativo ? 'block' : 'hidden'}`}
            />
            <div
              id="reader-nuevo-producto"
              className={scanning && !usaNativo ? 'block' : 'hidden'}
            ></div>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Descripción (opcional)
              </label>
              <textarea
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                rows={2}
                className="w-full border rounded-lg px-3 py-2 text-black"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Foto <span className="text-gray-400 font-normal">(opcional)</span>
              </label>
              <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-red-800">
                <ImagePlus className="w-5 h-5 text-red-800" />
                <span className="text-sm text-gray-600">
                  {foto ? foto.name : 'Toca para elegir una foto'}
                </span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null
                    setFoto(file)
                    setPreviewUrl(file ? URL.createObjectURL(file) : '')
                  }}
                  className="hidden"
                />
              </label>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="mt-2 w-full max-h-40 object-contain rounded-lg border"
                />
              )}
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
                setDescripcion('')
                setFoto(null)
                setPreviewUrl('')
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
