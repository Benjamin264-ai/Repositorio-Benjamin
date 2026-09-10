'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, ArrowDownCircle, ArrowUpCircle, Settings2 } from 'lucide-react'

type Movimiento = {
  id: string
  tipo: 'entrada' | 'salida' | 'ajuste'
  cantidad: number
  nota: string | null
  created_at: string
  perfiles: { nombre: string } | null
}

export default function StockDetallePage() {
  const params = useParams()
  const productoId = params.id as string
  const { profile } = useProfile()

  const [nombre, setNombre] = useState('')
  const [stock, setStock] = useState(0)
  const [inventarioId, setInventarioId] = useState('')
  const [movimientos, setMovimientos] = useState<Movimiento[]>([])
  const [loading, setLoading] = useState(true)

  const [cantidadEntrada, setCantidadEntrada] = useState('')
  const [notaEntrada, setNotaEntrada] = useState('')
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargarTodo = async () => {
    if (!profile?.tienda_id) return

    const { data: prod } = await supabase
      .from('productos')
      .select('nombre')
      .eq('id', productoId)
      .single()
    if (prod) setNombre(prod.nombre)

    const { data: inv } = await supabase
      .from('inventario')
      .select('id, stock')
      .eq('producto_id', productoId)
      .eq('tienda_id', profile.tienda_id)
      .maybeSingle()
    if (inv) {
      setStock(inv.stock)
      setInventarioId(inv.id)
    }

    const { data: movs } = await supabase
      .from('movimientos_stock')
      .select('id, tipo, cantidad, nota, created_at, perfiles(nombre)')
      .eq('producto_id', productoId)
      .eq('tienda_id', profile.tienda_id)
      .order('created_at', { ascending: false })
    if (movs) setMovimientos(movs as any)

    setLoading(false)
  }

  useEffect(() => {
    if (profile) cargarTodo()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])

  const registrarEntrada = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    const cantidad = parseInt(cantidadEntrada, 10)
    if (!cantidad || cantidad <= 0 || !profile?.tienda_id) {
      setError('Ingresa una cantidad válida')
      return
    }

    setGuardando(true)

    const nuevoStock = stock + cantidad

    const { error: errorStock } = await supabase
      .from('inventario')
      .update({ stock: nuevoStock, updated_at: new Date().toISOString() })
      .eq('id', inventarioId)

    if (errorStock) {
      setGuardando(false)
      setError(errorStock.message)
      return
    }

    await supabase.from('movimientos_stock').insert({
      producto_id: productoId,
      tienda_id: profile.tienda_id,
      tipo: 'entrada',
      cantidad,
      nota: notaEntrada.trim() || 'Ingreso de mercadería',
      usuario_id: profile.id,
    })

    setGuardando(false)
    setCantidadEntrada('')
    setNotaEntrada('')
    await cargarTodo()
  }

  const esAdmin = profile?.rol === 'admin'

  const estiloMovimiento = (tipo: Movimiento['tipo']) => {
    if (tipo === 'entrada') return { icon: ArrowUpCircle, color: 'text-green-600', signo: '+' }
    if (tipo === 'salida') return { icon: ArrowDownCircle, color: 'text-red-600', signo: '−' }
    return { icon: Settings2, color: 'text-amber-600', signo: '' }
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-red-50">Cargando...</div>
  }

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/stock" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800">{nombre}</h1>
        <p className="text-3xl font-black text-red-800 mb-4">{stock} en stock</p>

        {esAdmin && (
          <form
            onSubmit={registrarEntrada}
            className="bg-white p-4 rounded-xl shadow-sm space-y-3 mb-6"
          >
            <p className="text-sm font-semibold text-gray-700">Registrar ingreso</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                placeholder="Cantidad"
                value={cantidadEntrada}
                onChange={(e) => setCantidadEntrada(e.target.value)}
                className="w-24 border rounded-lg px-3 py-2 text-black"
              />
              <input
                type="text"
                placeholder="Nota (opcional, ej: proveedor X)"
                value={notaEntrada}
                onChange={(e) => setNotaEntrada(e.target.value)}
                className="flex-1 border rounded-lg px-3 py-2 text-black"
              />
            </div>
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={guardando}
              className="w-full bg-red-800 text-white py-2 rounded-lg font-medium disabled:opacity-60"
            >
              {guardando ? 'Guardando...' : 'Registrar entrada'}
            </button>
          </form>
        )}

        <h2 className="text-sm font-bold text-gray-600 uppercase tracking-wide mb-2">
          Historial de movimientos
        </h2>

        <div className="space-y-2">
          {movimientos.map((m) => {
            const { icon: Icon, color, signo } = estiloMovimiento(m.tipo)
            const fecha = new Date(m.created_at)
            return (
              <div key={m.id} className="bg-white p-3 rounded-lg shadow-sm flex items-center gap-3">
                <Icon className={`w-5 h-5 ${color} shrink-0`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">
                    {m.nota || (m.tipo === 'salida' ? 'Venta' : 'Ajuste manual')}
                  </p>
                  <p className="text-xs text-gray-400">
                    {fecha.toLocaleDateString('es-PE')} ·{' '}
                    {fecha.toLocaleTimeString('es-PE', { hour: '2-digit', minute: '2-digit' })}
                    {m.perfiles?.nombre ? ` · ${m.perfiles.nombre}` : ''}
                  </p>
                </div>
                <span className={`font-bold ${color}`}>
                  {signo}
                  {m.cantidad}
                </span>
              </div>
            )
          })}

          {movimientos.length === 0 && (
            <p className="text-gray-500 text-sm">Todavía no hay movimientos registrados.</p>
          )}
        </div>
      </div>
    </div>
  )
}
