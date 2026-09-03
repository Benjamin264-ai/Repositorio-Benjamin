'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { Search, ShoppingBag, Package, LogOut, ShieldCheck, Receipt } from 'lucide-react'

export default function HomePage() {
  const router = useRouter()
  const { profile, loading } = useProfile()
  const [tiendaNombre, setTiendaNombre] = useState('')

  useEffect(() => {
    if (!loading && !profile) {
      router.push('/login')
    }
  }, [loading, profile, router])

  useEffect(() => {
    const fetchTienda = async () => {
      if (!profile?.tienda_id) return
      const { data } = await supabase
        .from('tiendas')
        .select('nombre')
        .eq('id', profile.tienda_id)
        .single()
      if (data) setTiendaNombre(data.nombre)
    }
    fetchTienda()
  }, [profile])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <p className="text-red-800 font-bold">Cargando...</p>
      </div>
    )
  }

  const menu = [
    { href: '/consultar', label: 'Consultar precio', icon: Search },
    { href: '/vender', label: 'Vender', icon: ShoppingBag },
    { href: '/productos', label: 'Productos', icon: Package },
    { href: '/facturas', label: 'Facturas pendientes', icon: Receipt },
  ]

  return (
    <div className="min-h-screen bg-red-50">
      <div className="relative bg-gradient-to-b from-red-900 to-red-800 text-white px-6 pt-8 pb-12 rounded-b-3xl shadow-lg">
        <button
          onClick={handleLogout}
          className="absolute top-8 right-6 text-red-200 hover:text-white"
        >
          <LogOut className="w-5 h-5" />
        </button>

        <div className="text-center mb-7">
          <p className="text-red-200 text-xs tracking-[0.3em] uppercase">Comercial</p>
          <h1 className="text-4xl font-black tracking-tight -mt-1">MARY</h1>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-black leading-tight">{profile.nombre}</p>
            {profile.rol === 'admin' ? (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-red-950 text-sm font-bold px-3 py-1 rounded-full mt-1">
                <ShieldCheck className="w-4 h-4" /> ADMIN
              </span>
            ) : (
              <span className="inline-flex items-center bg-white/15 text-white text-sm font-bold px-3 py-1 rounded-full mt-1">
                VENDEDOR
              </span>
            )}
          </div>

          {tiendaNombre && (
            <div className="text-right">
              <p className="text-red-200 text-[10px] uppercase tracking-wide font-bold">Tienda</p>
              <p className="text-3xl font-black leading-none">{tiendaNombre}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-5 mt-5 pb-10">
        <div className="grid grid-cols-2 gap-4">
          {menu.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center gap-3 bg-white aspect-square rounded-2xl shadow-sm border border-red-100 active:scale-95 active:bg-red-50 transition-transform"
              >
                <div className="bg-red-800 text-white p-4 rounded-2xl">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="font-black text-gray-800 text-center text-sm leading-tight px-2">
                  {item.label.toUpperCase()}
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}
