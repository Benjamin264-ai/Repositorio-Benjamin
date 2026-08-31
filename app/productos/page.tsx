'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { Plus, Pencil, ArrowLeft } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  precio: number
  stock: number
  stock_minimo: number
}

export default function ProductosPage() {
  const { profile, loading: loadingProfile } = useProfile()
  const [productos, setProductos] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductos = async () => {
      if (!profile?.tienda_id) return
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio, stock, stock_minimo')
        .eq('tienda_id', profile.tienda_id)
        .order('nombre')

      if (!error && data) setProductos(data)
      setLoading(false)
    }

    if (profile) fetchProductos()
  }, [profile])

  const esAdmin = profile?.rol === 'admin'

  return (
    <div className="min-h-screen bg-teal-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-1 text-teal-700 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link
            href="/productos/nuevo"
            className="flex items-center gap-1 bg-teal-700 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Agregar
          </Link>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Productos</h1>

        {(loadingProfile || loading) && <p className="text-gray-500">Cargando...</p>}

        <div className="space-y-3">
          {productos.map((p) => (
            <div
              key={p.id}
              className="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center"
            >
              <div>
                <p className="font-semibold text-gray-800">{p.nombre}</p>
                <p className="text-sm text-gray-500">
                  S/ {p.precio.toFixed(2)} · Stock: {p.stock}
                  {p.stock <= p.stock_minimo && (
                    <span className="text-red-600 font-medium"> · Bajo</span>
                  )}
                </p>
              </div>

              {esAdmin && (
                <Link
                  href={`/productos/${p.id}/editar`}
                  className="text-teal-700 p-2 hover:bg-teal-50 rounded-lg"
                >
                  <Pencil className="w-4 h-4" />
                </Link>
              )}
            </div>
          ))}

          {!loading && productos.length === 0 && (
            <p className="text-gray-500 text-sm">Todavía no hay productos registrados.</p>
          )}
        </div>
      </div>
    </div>
  )
}
