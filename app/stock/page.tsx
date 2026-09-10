'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, ChevronRight } from 'lucide-react'

type ProductoConStock = {
  id: string
  nombre: string
  stock: number
  stock_minimo: number
}

export default function StockPage() {
  const { profile, loading: loadingProfile } = useProfile()
  const [productos, setProductos] = useState<ProductoConStock[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductos = async () => {
      if (!profile?.tienda_id) return
      const { data, error } = await supabase
        .from('inventario')
        .select('stock, stock_minimo, productos(id, nombre)')
        .eq('tienda_id', profile.tienda_id)

      if (!error && data) {
        const lista = data
          .map((row: any) => ({
            id: row.productos.id,
            nombre: row.productos.nombre,
            stock: row.stock,
            stock_minimo: row.stock_minimo,
          }))
          .sort((a, b) => a.nombre.localeCompare(b.nombre))
        setProductos(lista)
      }
      setLoading(false)
    }
    if (profile) fetchProductos()
  }, [profile])

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-1">Stock</h1>
        <p className="text-sm text-gray-500 mb-4">
          Toca un producto para ver su historial de movimientos.
        </p>

        {(loadingProfile || loading) && <p className="text-gray-500">Cargando...</p>}

        <div className="space-y-2">
          {productos.map((p) => (
            <Link
              key={p.id}
              href={`/stock/${p.id}`}
              className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm"
            >
              <span className="font-medium text-gray-800">{p.nombre}</span>
              <div className="flex items-center gap-2">
                <span
                  className={
                    p.stock <= p.stock_minimo
                      ? 'text-red-600 font-bold'
                      : 'font-semibold text-gray-800'
                  }
                >
                  {p.stock}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            </Link>
          ))}

          {!loading && productos.length === 0 && (
            <p className="text-gray-500 text-sm">No hay productos registrados en tu tienda.</p>
          )}
        </div>
      </div>
    </div>
  )
}
