'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { useBarcodeScanner } from '@/lib/useBarcodeScanner'
import { ArrowLeft, Banknote, Smartphone, Camera } from 'lucide-react'

type ProductoVenta = {
  id: string
  nombre: string
  precio: number
  stock: number
  inventarioId: string
}

const ES_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function VenderPage() {
  const { profile } = useProfile()
  const [producto, setProducto] = useState<ProductoVenta | null>(null)
  const [cantidad, setCantidad] = useState(1)
  const [medioPago, setMedioPago] = useState<'efectivo' | 'yape' | null>(null)
  const [errorBusqueda, setErrorBusqueda] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  const buscarProducto = async (codigo: string) => {
    if (!profile?.tienda_id) {
      setErrorBusqueda('No se pudo identificar tu tienda')
      return
    }

    const query = ES_UUID.test(codigo)
      ? supabase.from('productos').select('id, nombre, precio').eq('id', codigo).maybeSingle()
      : supabase
          .from('productos')
          .select('id, nombre, precio')
          .eq('codigo_barras', codigo)
          .maybeSingle()

    const { data: prod, error: errorProd } = await query

    if (errorProd || !prod) {
      setErrorBusqueda('Producto no encontrado (revisa si ya fue registrado en el catálogo)')
      setProducto(null)
      return
    }

    const { data: inv, error: errorInv } = await supabase
      .from('inventario')
      .select('id, stock')
      .eq('producto_id', prod.id)
      .eq('tienda_id', profile.tienda_id)
      .maybeSingle()

    if (errorInv || !inv) {
      setErrorBusqueda('Este producto no tiene stock registrado en tu tienda')
      setProducto(null)
      return
    }

    setErrorBusqueda('')
    setSuccess('')
    setProducto({
      id: prod.id,
      nombre: prod.nombre,
      precio: prod.precio,
      stock: inv.stock,
      inventarioId: inv.id,
    })
    setCantidad(1)
    setMedioPago(null)
  }

  const { videoRef, scanning, error, usaNativo, start, stop } = useBarcodeScanner(buscarProducto)

  const iniciarEscaneo = () => {
    setProducto(null)
    setErrorBusqueda('')
    setSuccess('')
    start('reader-vender')
  }

  const confirmarVenta = async () => {
    if (!producto || !medioPago || !profile) return

    if (cantidad > producto.stock) {
      setErrorBusqueda(`Solo hay ${producto.stock} en stock`)
      return
    }

    setSaving(true)
    setErrorBusqueda('')

    const total = producto.precio * cantidad

    const { error: ventaError } = await supabase.from('ventas').insert({
      producto_id: producto.id,
      tienda_id: profile.tienda_id,
      vendedor_id: profile.id,
      cantidad,
      precio_unitario: producto.precio,
      total,
      medio_pago: medioPago,
    })

    if (ventaError) {
      setSaving(false)
      setErrorBusqueda(ventaError.message)
      return
    }

    const { error: stockError } = await supabase
      .from('inventario')
      .update({
        stock: producto.stock - cantidad,
        updated_at: new Date().toISOString(),
      })
      .eq('id', producto.inventarioId)

    if (stockError) {
      setSaving(false)
      setErrorBusqueda(
        'La venta se registró, pero hubo un problema actualizando el stock: ' + stockError.message
      )
      return
    }

    await supabase.from('movimientos_stock').insert({
      producto_id: producto.id,
      tienda_id: profile.tienda_id,
      tipo: 'salida',
      cantidad,
      nota: 'Venta',
      usuario_id: profile.id,
    })

    setSaving(false)
    setSuccess(`Venta registrada: ${cantidad} x ${producto.nombre} — S/ ${total.toFixed(2)}`)
    setProducto(null)
    setMedioPago(null)
    setCantidad(1)
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Vender</h1>

        {!scanning && !producto && (
          <button
            onClick={iniciarEscaneo}
            className="w-full flex items-center justify-center gap-2 bg-red-800 text-white py-3 rounded-lg font-medium mb-4"
          >
            <Camera className="w-5 h-5" /> Escanear producto
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
        <div id="reader-vender" className={scanning && !usaNativo ? 'mb-4' : 'hidden'}></div>

        {(error || errorBusqueda) && (
          <p className="text-red-700 bg-red-100 rounded-lg px-3 py-2 text-sm mb-4">
            {error || errorBusqueda}
          </p>
        )}

        {success && (
          <p className="text-green-700 bg-green-100 rounded-lg px-3 py-2 text-sm mb-4">
            {success}
          </p>
        )}

        {producto && (
          <div className="bg-white p-5 rounded-xl shadow-sm space-y-4">
            <div>
              <h2 className="text-lg font-bold text-gray-800">{producto.nombre}</h2>
              <p className="text-2xl text-red-800 font-bold">
                S/ {producto.precio.toFixed(2)}
              </p>
              <p className="text-sm text-gray-500">Stock disponible: {producto.stock}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setCantidad((c) => Math.max(1, c - 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold"
                >
                  −
                </button>
                <span className="text-lg font-bold w-10 text-center text-black">{cantidad}</span>
                <button
                  onClick={() => setCantidad((c) => Math.min(producto.stock, c + 1))}
                  className="w-10 h-10 rounded-lg bg-gray-100 text-gray-700 font-bold"
                >
                  +
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Medio de pago</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMedioPago('efectivo')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 ${
                    medioPago === 'efectivo'
                      ? 'border-red-800 bg-red-50 text-red-800'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Banknote className="w-5 h-5" />
                  <span className="text-sm font-medium">Efectivo</span>
                </button>
                <button
                  onClick={() => setMedioPago('yape')}
                  className={`flex flex-col items-center gap-1 py-3 rounded-lg border-2 ${
                    medioPago === 'yape'
                      ? 'border-red-800 bg-red-50 text-red-800'
                      : 'border-gray-200 text-gray-500'
                  }`}
                >
                  <Smartphone className="w-5 h-5" />
                  <span className="text-sm font-medium">Yape</span>
                </button>
              </div>
            </div>

            <div className="border-t pt-3 flex justify-between items-center">
              <span className="text-gray-600">Total</span>
              <span className="text-xl font-bold text-gray-800">
                S/ {(producto.precio * cantidad).toFixed(2)}
              </span>
            </div>

            <button
              onClick={confirmarVenta}
              disabled={!medioPago || saving}
              className="w-full bg-red-800 text-white py-3 rounded-lg font-medium disabled:opacity-50"
            >
              {saving ? 'Guardando...' : 'Confirmar venta'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
