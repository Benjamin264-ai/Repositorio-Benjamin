'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Trash2 } from 'lucide-react'

export default function EditarFacturaPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string

  const [ruc, setRuc] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const fetchFactura = async () => {
      const { data, error } = await supabase
        .from('facturas_pendientes')
        .select('ruc, monto, descripcion')
        .eq('id', id)
        .single()

      if (!error && data) {
        setRuc(data.ruc)
        setMonto(String(data.monto))
        setDescripcion(data.descripcion)
      }
      setLoading(false)
    }
    fetchFactura()
  }, [id])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    const { error } = await supabase
      .from('facturas_pendientes')
      .update({
        ruc: ruc.trim(),
        monto: parseFloat(monto),
        descripcion: descripcion.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    setSaving(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/facturas')
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar esta factura? Esto significa que ya está pagada o fue un error.')) return
    setSaving(true)
    await supabase.from('facturas_pendientes').delete().eq('id', id)
    setSaving(false)
    router.push('/facturas')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">Cargando...</div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/facturas" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Editar factura</h1>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-5 rounded-xl shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">RUC</label>
            <input
              value={ruc}
              onChange={(e) => setRuc(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monto (S/)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              required
              className="w-full border rounded-lg px-3 py-2 text-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción del artículo
            </label>
            <textarea
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              required
              rows={3}
              className="w-full border rounded-lg px-3 py-2 text-black"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-red-800 text-white py-3 rounded-lg font-medium disabled:opacity-60"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>

          <button
            type="button"
            onClick={handleDelete}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 text-red-700 text-sm py-2"
          >
            <Trash2 className="w-4 h-4" /> Eliminar (ya pagada)
          </button>
        </form>
      </div>
    </div>
  )
}
