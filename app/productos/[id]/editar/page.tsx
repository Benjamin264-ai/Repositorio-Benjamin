'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft } from 'lucide-react'

export default function EditarProductoPage() {
  const { profile, loading: loadingProfile } = useProfile()
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [stock, setStock] = useState('')
  const [stockMinimo, setStockMinimo] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Si no es admin, lo saca de esta pantalla
  useEffect(() => {
    if (!loadingProfile && profile && profile.rol !== 'admin') {
      router.push('/productos')
    }
  }, [loadingProfile, profile, router])

  useEffect(() => {
    const fetchProducto = async () => {
      const { data, error } = await supabase
        .from('productos')
        .select('nombre, precio, stock, stock_minimo')
        .eq('id', id)
        .single()

      if (!error && data) {
        setNombre(data.nombre)
        setPrecio(String(data.precio))
        setStock(String(data.stock))
        setStockMinimo(String(data.stock_minimo))
      }
      setLoading(false)
    }
    fetchProducto()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await supabase
      .from('productos')
      .update({
        nombre,
        precio: parseFloat(precio),
        stock: parseInt(stock, 10),
        stock_minimo: parseInt(stockMinimo, 10),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/productos')
  }

  if (loadingProfile || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-teal-50">
        Cargando...
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-teal-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/productos" className="flex items-center gap-1 text-teal-700 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Editar producto</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl shadow-sm">
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Precio (S/)</label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
            <input
              type="number"
              min="0"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Stock mínimo</label>
            <input
              type="number"
              min="0"
              value={stockMinimo}
              onChange={(e) => setStockMinimo(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-black"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-teal-700 text-white py-3 rounded-lg font-medium disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
        </form>
      </div>
    </div>
  )
}
