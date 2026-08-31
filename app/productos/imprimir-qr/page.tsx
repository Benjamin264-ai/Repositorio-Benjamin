'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import QRCode from 'qrcode'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, Printer } from 'lucide-react'

type Producto = {
  id: string
  nombre: string
  precio: number
}

export default function ImprimirQRPage() {
  const { profile } = useProfile()
  const [productos, setProductos] = useState<Producto[]>([])
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [qrs, setQrs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProductos = async () => {
      if (!profile?.tienda_id) return
      const { data, error } = await supabase
        .from('productos')
        .select('id, nombre, precio')
        .eq('tienda_id', profile.tienda_id)
        .order('nombre')

      if (!error && data) {
        setProductos(data)
        setSeleccionados(new Set(data.map((p) => p.id)))
      }
      setLoading(false)
    }
    if (profile) fetchProductos()
  }, [profile])

  useEffect(() => {
    const generarQRs = async () => {
      const nuevos: Record<string, string> = {}
      for (const p of productos) {
        if (!qrs[p.id]) {
          nuevos[p.id] = await QRCode.toDataURL(p.id, { width: 200, margin: 1 })
        }
      }
      if (Object.keys(nuevos).length > 0) {
        setQrs((prev) => ({ ...prev, ...nuevos }))
      }
    }
    if (productos.length > 0) generarQRs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productos])

  const toggle = (id: string) => {
    setSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleTodos = () => {
    if (seleccionados.size === productos.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(productos.map((p) => p.id)))
    }
  }

  return (
    <div className="min-h-screen bg-red-50 p-6 print:bg-white print:p-0">
      <div className="max-w-2xl mx-auto">
        {/* Controles: no se imprimen */}
        <div className="print:hidden">
          <Link href="/productos" className="flex items-center gap-1 text-red-800 text-sm mb-4">
            <ArrowLeft className="w-4 h-4" /> Volver
          </Link>

          <div className="flex items-center justify-between mb-3">
            <h1 className="text-xl font-bold text-gray-800">Imprimir códigos QR</h1>
            <button
              onClick={() => window.print()}
              disabled={seleccionados.size === 0}
              className="flex items-center gap-1 bg-red-800 text-white text-sm font-medium px-3 py-2 rounded-lg disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir ({seleccionados.size})
            </button>
          </div>

          <button onClick={toggleTodos} className="text-sm text-red-800 underline mb-4">
            {seleccionados.size === productos.length ? 'Deseleccionar todos' : 'Seleccionar todos'}
          </button>

          {loading && <p className="text-gray-500">Cargando productos...</p>}

          <div className="space-y-2 mb-8">
            {productos.map((p) => (
              <label
                key={p.id}
                className="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm"
              >
                <input
                  type="checkbox"
                  checked={seleccionados.has(p.id)}
                  onChange={() => toggle(p.id)}
                  className="w-4 h-4"
                />
                <span className="text-gray-800">{p.nombre}</span>
                <span className="text-gray-500 text-sm ml-auto">S/ {p.precio.toFixed(2)}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Hoja imprimible: solo esto se ve al imprimir */}
        <div className="grid grid-cols-3 gap-4 print:grid-cols-3">
          {productos
            .filter((p) => seleccionados.has(p.id))
            .map((p) => (
              <div
                key={p.id}
                className="border border-gray-300 rounded-lg p-3 flex flex-col items-center text-center break-inside-avoid"
              >
                {qrs[p.id] ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrs[p.id]} alt={p.nombre} className="w-32 h-32" />
                ) : (
                  <div className="w-32 h-32 bg-gray-100 animate-pulse rounded" />
                )}
                <p className="text-xs font-semibold text-gray-800 mt-1 leading-tight">
                  {p.nombre}
                </p>
                <p className="text-xs text-gray-600">S/ {p.precio.toFixed(2)}</p>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
}
