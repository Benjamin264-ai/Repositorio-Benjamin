'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { Plus, ArrowLeft, ImageIcon } from 'lucide-react'

type Factura = {
  id: string
  ruc: string
  monto: number
  descripcion: string
  foto_url: string | null
}

export default function FacturasPage() {
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFacturas = async () => {
      const { data, error } = await supabase
        .from('facturas_pendientes')
        .select('id, ruc, monto, descripcion, foto_url')
        .order('created_at', { ascending: false })

      if (!error && data) setFacturas(data)
      setLoading(false)
    }
    fetchFacturas()
  }, [])

  const totalPendiente = facturas.reduce((sum, f) => sum + f.monto, 0)

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/" className="flex items-center gap-1 text-red-800 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link
            href="/facturas/nueva"
            className="flex items-center gap-1 bg-red-800 text-white text-sm font-medium px-3 py-2 rounded-lg"
          >
            <Plus className="w-4 h-4" /> Agregar
          </Link>
        </div>

        <h1 className="text-xl font-bold text-gray-800 mb-1">Facturas pendientes</h1>
        {!loading && facturas.length > 0 && (
          <p className="text-sm text-gray-600 mb-4">
            Total pendiente:{' '}
            <span className="font-bold text-red-800">S/ {totalPendiente.toFixed(2)}</span>
          </p>
        )}

        {loading && <p className="text-gray-500">Cargando...</p>}

        <div className="space-y-3">
          {facturas.map((f) => (
            <Link
              key={f.id}
              href={`/facturas/${f.id}`}
              className="bg-white p-4 rounded-xl shadow-sm flex gap-3"
            >
              {f.foto_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.foto_url}
                  alt="Factura"
                  className="w-16 h-16 object-cover rounded-lg border shrink-0"
                />
              ) : (
                <div className="w-16 h-16 rounded-lg border bg-gray-50 flex items-center justify-center shrink-0">
                  <ImageIcon className="w-6 h-6 text-gray-300" />
                </div>
              )}

              <div>
                <p className="font-semibold text-gray-800">RUC: {f.ruc}</p>
                <p className="text-sm text-gray-600">{f.descripcion}</p>
                <p className="text-lg font-bold text-red-800 mt-1">S/ {f.monto.toFixed(2)}</p>
              </div>
            </Link>
          ))}

          {!loading && facturas.length === 0 && (
            <p className="text-gray-500 text-sm">No hay facturas pendientes registradas.</p>
          )}
        </div>
      </div>
    </div>
  )
}
