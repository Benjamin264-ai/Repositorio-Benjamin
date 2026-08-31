'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { Search, ShoppingBag, Package, LogOut, ShieldCheck } from 'lucide-react'

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
        <p className="text-red-800">Cargando...</p>
      </div>
    )
  }

  const menu = [
    {
      href: '/consultar',
      label: 'Consultar precio',
      icon: Search,
      desc: 'Escanea un QR y revisa precio y stock',
    },
    {
      href: '/vender',
      label: 'Vender',
      icon: ShoppingBag,
      desc: 'Registra una venta en efectivo o Yape',
    },
    {
      href: '/productos',
      label: 'Productos',
      icon: Package,
      desc: 'Ver, agregar y (si eres admin) editar',
    },
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

        {/* Marca centrada */}
        <div className="text-center mb-7">
          <p className="text-red-200 text-xs tracking-[0.3em] uppercase">Comercial</p>
          <h1 className="text-4xl font-black tracking-tight -mt-1">MARY</h1>
        </div>

        {/* Usuario y tienda, más grande */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-2xl font-bold leading-tight">{profile.nombre}</p>
            {profile.rol === 'admin' ? (
              <span className="inline-flex items-center gap-1 bg-amber-400 text-red-950 text-sm font-bold px-3 py-1 rounded-full mt-1">
                <ShieldCheck className="w-4 h-4" /> Admin
              </span>
            ) : (
              <span className="inline-flex items-center bg-white/15 text-white text-sm font-semibold px-3 py-1 rounded-full mt-1">
                Vendedor
              </span>
            )}
          </div>

          {tiendaNombre && (
            <div className="text-right">
              <p className="text-red-200 text-[10px] uppercase tracking-wide">Tienda</p>
              <p className="text-3xl font-black leading-none">{tiendaNombre}</p>
            </div>
          )}
        </div>
      </div>

      <div className="px-6 mt-4 space-y-4 pb-10">
        {menu.map((item) => {
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-red-100"
            >
              <div className="bg-red-100 text-red-800 p-3 rounded-xl">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">{item.label}</p>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
