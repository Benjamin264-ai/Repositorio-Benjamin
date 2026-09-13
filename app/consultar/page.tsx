'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { useBarcodeScanner } from '@/lib/useBarcodeScanner'
import { ArrowLeft, Camera, ImageIcon } from 'lucide-react'

type ProductoInfo = {
  nombre: string
  precio: number
  descripcion: string | null
  foto_url: string | null
  stock: number
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function ConsultarPage() {
  const { profile } = useProfile()
  const [producto, setProducto] = useState<ProductoInfo | null>(null)
  const [errorBusqueda, setErrorBusqueda] = useState('')

  const buscarProducto = async (codigo: string) => {
    if (!profile?.tienda_id) {
      setErrorBusqueda('No se pudo identificar tu tienda')
      return
    }

    const query = ES_UUID.test(codigo)
      ? supabase
          .from('productos')
          .select('id, nombre, precio, descripcion, foto_url')
          .eq('id', codigo)
          .maybeSingle()
      : supabase
          .from('productos')
          .select('id, nombre, precio, descripcion, foto_url')
          .eq('codigo_barras', codigo)
          .maybeSingle()

    const { data: prod, error: errorProd } = await query

    if (errorProd || !prod) {
      setErrorBusqueda('Producto no encontrado (revisa si ya fue registrado en el catálogo)')
      setProducto(null)
      return
    }

    const { data: inv } = await supabase
      .from('inventario')
      .select('stock')
      .eq('producto_id', prod.id)
      .eq('tienda_id', profile.tienda_id)
      .maybeSingle()

    setErrorBusqueda('')
    setProducto({
      nombre: prod.nombre,
      precio: prod.precio,
      descripcion: prod.descripcion,
      foto_url: prod.foto_url,
      stock: inv?.stock ?? 0,
    })
  }

  const { videoRef, scanning, error, usaNativo, start, stop } = useBarcodeScanner(buscarProducto)

  const iniciarEscaneo = () => {
    setProducto(null)
    setErrorBusqueda('')
    start('reader')
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
            onClick={iniciarEscaneo}
            className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-3 rounded-lg font-medium mb-4"
          >
            <Camera className="w-5 h-5" /> Escanear
          </button>
        )}

        {scanning && (
          <button
            onClick={stop}
            className="w-full bg-gray-600 text-white py-3 rounded-lg font-medium mb-4"
          >
            Cancelar
          </button>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`w-full rounded-lg mb-2 ${scanning && usaNativo ? 'block' : 'hidden'}`}
        />
        <div id="reader" className={scanning && !usaNativo ? 'mb-4' : 'hidden'}></div>

        {(error || errorBusqueda) && (
          <p className="text-red-700 bg-red-100 rounded-lg px-3 py-2 text-sm">
            {error || errorBusqueda}
          </p>
        )}

        {producto && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {producto.foto_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={producto.foto_url}
                alt={producto.nombre}
                className="w-full max-h-56 object-contain bg-gray-50"
              />
            ) : (
              <div className="w-full h-32 bg-gray-50 flex items-center justify-center text-gray-300">
                <ImageIcon className="w-8 h-8" />
              </div>
            )}
            <div className="p-4">
              <h2 className="text-lg font-bold text-gray-800">{producto.nombre}</h2>
              <p className="text-2xl text-red-800 font-bold">S/ {producto.precio.toFixed(2)}</p>
              {producto.descripcion && (
                <p className="text-sm text-gray-600 mt-1">{producto.descripcion}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">Stock en tu tienda: {producto.stock}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
