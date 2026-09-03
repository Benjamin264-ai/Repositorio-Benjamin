'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, Camera } from 'lucide-react'

type ProductoInfo = {
  nombre: string
  precio: number
  stock: number
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function ConsultarPage() {
  const { profile } = useProfile()
  const [producto, setProducto] = useState<ProductoInfo | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const buscarProducto = async (codigo: string) => {
    if (!profile?.tienda_id) {
      setError('No se pudo identificar tu tienda')
      return
    }

    // Si el texto escaneado tiene forma de UUID, es nuestro QR impreso (busca por id).
    // Si no, asumimos que es el código de barras original de fábrica.
    const query = ES_UUID.test(codigo)
      ? supabase.from('productos').select('id, nombre, precio').eq('id', codigo).maybeSingle()
      : supabase
          .from('productos')
          .select('id, nombre, precio')
          .eq('codigo_barras', codigo)
          .maybeSingle()

    const { data: prod, error: errorProd } = await query

    if (errorProd || !prod) {
      setError('Producto no encontrado (revisa si ya fue registrado en el catálogo)')
      setProducto(null)
      return
    }

    const { data: inv } = await supabase
      .from('inventario')
      .select('stock')
      .eq('producto_id', prod.id)
      .eq('tienda_id', profile.tienda_id)
      .maybeSingle()

    setError('')
    setProducto({
      nombre: prod.nombre,
      precio: prod.precio,
      stock: inv?.stock ?? 0,
    })
  }

  const startScan = async () => {
    setScanning(true)
    setError('')
    setProducto(null)

    const scanner = new Html5Qrcode('reader')
    scannerRef.current = scanner

    try {
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: 250 },
        async (decodedText) => {
          await buscarProducto(decodedText)
          await scanner.stop()
          setScanning(false)
        },
        () => {}
      )
    } catch {
      setError('No se pudo acceder a la cámara')
      setScanning(false)
    }
  }

  const stopScan = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop()
    }
    setScanning(false)
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <h1 className="text-xl font-bold text-gray-800 mb-4">Consultar precio</h1>

        {!scanning && (
          <button
            onClick={startScan}
            className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-3 rounded-lg font-medium mb-4"
          >
            <Camera className="w-5 h-5" /> Escanear
          </button>
        )}

        {scanning && (
          <button
            onClick={stopScan}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium mb-4"
          >
            Cancelar
          </button>
        )}

        <div id="reader" className="mb-4"></div>

        {error && <p className="text-red-700 bg-red-100 rounded-lg px-3 py-2 text-sm">{error}</p>}

        {producto && (
          <div className="bg-white p-4 rounded-lg shadow-sm">
            <h2 className="text-lg font-bold text-gray-800">{producto.nombre}</h2>
            <p className="text-2xl text-red-800 font-bold">S/ {producto.precio.toFixed(2)}</p>
            <p className="text-sm text-gray-600">Stock en tu tienda: {producto.stock}</p>
          </div>
        )}
      </div>
    </div>
  )
}
