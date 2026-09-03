'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft } from 'lucide-react'

export default function NuevaFacturaPage() {
  const { profile } = useProfile()
  const router = useRouter()

  const [ruc, setRuc] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.from('facturas_pendientes').insert({
      ruc: ruc.trim(),
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      creado_por: profile?.id ?? null,
    })

    setLoading(false)

    if (error) {
      setError(error.message)
      return
    }

    router.push('/facturas')
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/facturas" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Agregar factura pendiente</h1>

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
            disabled={loading}
            className="w-full bg-red-800 text-white py-3 rounded-lg font-medium disabled:opacity-60"
          >
            {loading ? 'Guardando...' : 'Guardar factura'}
          </button>
        </form>
      </div>
    </div>
  )
}
