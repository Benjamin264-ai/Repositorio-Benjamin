'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { Html5Qrcode } from 'html5-qrcode'
import { supabase } from '@/lib/supabase'
import { ArrowLeft } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
}

export default function ConsultarPage() {
  const [producto, setProducto] = useState<Producto | null>(null)
  const [scanning, setScanning] = useState(false)
  const [error, setError] = useState('')
  const scannerRef = useRef<Html5Qrcode | null>(null)

  const buscarProducto = async (id: string) => {
    const { data, error } = await supabase
      .from('productos')
      .select('id, nombre, precio, stock')
      .eq('id', id)
      .single()

    if (error || !data) {
      setError('Producto no encontrado')
      setProducto(null)
      return
    }

    setError('')
    setProducto(data)
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
            className="w-full bg-red-800 text-white py-3 rounded-lg font-medium mb-4"
          >
            📷 Escanear QR
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
            <p className="text-2xl text-red-800 font-bold">
              S/ {producto.precio.toFixed(2)}
            </p>
            <p className="text-sm text-gray-600">
              Stock disponible: {producto.stock}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}