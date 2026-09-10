'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { Plus, Pencil, ArrowLeft, Printer, Minus } from 'lucide-react'

type ProductoConStock = {
  id: string
  nombre: string
  precio: number
  stock: number
  stock_minimo: number
  inventario_id: string
}

export default function ProductosPage() {
  const { profile, loading: loadingProfile } = useProfile()
  const [productos, setProductos] = useState<ProductoConStock[]>([])
  const [loading, setLoading] = useState(true)

  const fetchProductos = async () => {
    if (!profile?.tienda_id) return

    const { data, error } = await supabase
      .from('inventario')
      .select('id, stock, stock_minimo, productos(id, nombre, precio)')
      .eq('tienda_id', profile.tienda_id)

    if (!error && data) {
      const lista = data
        .map((row: any) => ({
          id: row.productos.id,
          nombre: row.productos.nombre,
          precio: row.productos.precio,
          stock: row.stock,
          stock_minimo: row.stock_minimo,
          inventario_id: row.id,
        }))
        .sort((a, b) => a.nombre.localeCompare(b.nombre))
      setProductos(lista)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (profile) fetchProductos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const ajustarStock = async (
    inventarioId: string,
    productoId: string,
    delta: number,
    stockActual: number
  ) => {
    const nuevoStock = Math.max(0, stockActual + delta)

    setProductos((prev) =>
      prev.map((p) => (p.inventario_id === inventarioId ? { ...p, stock: nuevoStock } : p))
    )

    await supabase
      .from('inventario')
      .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
      .eq('id', inventarioId)

    if (profile?.tienda_id) {
      await supabase.from('movimientos_stock').insert({
        producto_id: productoId,
        tienda_id: profile.tienda_id,
        tipo: 'ajuste',
        cantidad: Math.abs(delta),
        nota: delta > 0 ? 'Ajuste manual (+1)' : 'Ajuste manual (-1)',
        usuario_id: profile.id,
      })
    }
  }

  const esAdmin = profile?.rol === 'admin'

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-1 text-red-800 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <div className="flex gap-2">
            <Link
              href="/productos/imprimir-qr"
              className="flex items-center gap-1 bg-white border border-red-800 text-red-800 text-sm font-medium px-3 py-2 rounded-lg"
            >
              <Printer className="w-4 h-4" /> QR
            </Link>
            <Link
              href="/productos/nuevo"
              className="flex items-center gap-1 bg-red-800 text-white text-sm font-medium px-3 py-2 rounded-lg"
            >
              <Plus className="w-4 h-4" /> Agregar
            </Link>
          </div>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Productos</h1>

        {(loadingProfile || loading) && <p className="text-gray-500">Cargando...</p>}

        <div className="space-y-3">
          {productos.map((p) => (
            <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-gray-800">{p.nombre}</p>
                  <p className="text-sm text-gray-500">S/ {p.precio.toFixed(2)}</p>
                </div>
                {esAdmin && (
                  <Link
                    href={`/productos/${p.id}/editar`}
                    className="text-red-800 p-2 hover:bg-red-50 rounded-lg"
                  >
                    <Pencil className="w-4 h-4" />
                  </Link>
                )}
              </div>

              <div className="flex items-center justify-between mt-3 pt-3 border-t">
                <span className="text-sm text-gray-600">
                  Stock:{' '}
                  <span
                    className={
                      p.stock <= p.stock_minimo
                        ? 'text-red-600 font-bold'
                        : 'font-semibold text-gray-800'
                    }
                  >
                    {p.stock}
                  </span>
                  {p.stock <= p.stock_minimo && (
                    <span className="text-red-600 text-xs"> · Bajo</span>
                  )}
                </span>

                {/* Solo el admin puede ajustar el stock; los demás solo lo ven */}
                {esAdmin && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => ajustarStock(p.inventario_id, p.id, -1, p.stock)}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => ajustarStock(p.inventario_id, p.id, 1, p.stock)}
                      className="w-8 h-8 rounded-lg bg-gray-100 text-gray-700 flex items-center justify-center"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}

          {!loading && productos.length === 0 && (
            <p className="text-gray-500 text-sm">Todavía no hay productos en tu tienda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
