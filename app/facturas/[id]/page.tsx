'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowLeft, Pencil, ImageIcon } from 'lucide-react'

type Factura = {
  ruc: string
  monto: number
  descripcion: string
  foto_url: string | null
}

export default function VerFacturaPage() {
  const params = useParams()
  const id = params.id as string
  const [factura, setFactura] = useState<Factura | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFactura = async () => {
      const { data, error } = await supabase
        .from('facturas_pendientes')
        .select('ruc, monto, descripcion, foto_url')
        .eq('id', id)
        .single()
      if (!error && data) setFactura(data)
      setLoading(false)
    }
    fetchFactura()
  }, [id])

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50">Cargando...</div>
  }

  if (!factura) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        No se encontró la factura.
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <div className="flex items-center justify-between mb-4">
          <Link href="/facturas" className="flex items-center gap-1 text-red-800 text-sm">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>
          <Link
            href={`/facturas/${id}/editar`}
            className="flex items-center gap-1 text-red-800 text-sm font-medium"
          >
            <Pencil className="w-4 h-4" /> Editar
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {factura.foto_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={factura.foto_url}
              alt="Factura"
              className="w-full max-h-80 object-contain bg-gray-50"
            />
          ) : (
            <div className="w-full h-40 bg-gray-50 flex flex-col items-center justify-center text-gray-300 gap-1">
              <ImageIcon className="w-8 h-8" />
              <span className="text-xs">Sin foto adjunta</span>
            </div>
          )}

          <div className="p-5 space-y-3">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">RUC</p>
              <p className="font-semibold text-gray-800">{factura.ruc}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Monto</p>
              <p className="text-2xl font-bold text-red-800">S/ {factura.monto.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wide">Descripción</p>
              <p className="text-gray-800">{factura.descripcion}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
