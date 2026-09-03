'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Lock, Sparkles, SprayCan, Droplets } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    setLoading(false)

    if (error) {
      setError('Correo o contraseña incorrectos')
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-b from-red-900 via-red-800 to-red-700">
      {/* Íconos decorativos de limpieza, sutiles en el fondo */}
      <SprayCan className="absolute top-16 left-8 w-16 h-16 text-white/10 -rotate-12" />
      <Droplets className="absolute top-32 right-10 w-14 h-14 text-white/10 rotate-12" />
      <Sparkles className="absolute bottom-32 left-12 w-12 h-12 text-white/10" />
      <SprayCan className="absolute bottom-20 right-16 w-20 h-20 text-white/10 rotate-45" />
      <Droplets className="absolute top-1/2 left-4 w-10 h-10 text-white/10" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Marca */}
        <div className="text-center mb-10">
          <p className="text-red-200 text-xs tracking-[0.3em] uppercase">Comercial</p>
          <h1 className="text-5xl font-black tracking-tight text-white -mt-1">MARY</h1>
          <p className="text-red-200 text-sm mt-2 flex items-center justify-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Artículos de limpieza
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-3 border-2 border-white/70 rounded-lg px-4 py-3 bg-white/95">
            <User className="w-5 h-5 text-red-800 shrink-0" />
            <input
              type="email"
              placeholder="Correo"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-transparent outline-none text-black placeholder:text-gray-500"
            />
          </div>

          <div className="flex items-center gap-3 border-2 border-white/70 rounded-lg px-4 py-3 bg-white/95">
            <Lock className="w-5 h-5 text-red-800 shrink-0" />
            <input
              type="password"
              placeholder="Contraseña"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full bg-transparent outline-none text-black placeholder:text-gray-500"
            />
          </div>

          {error && (
            <p className="text-sm text-yellow-100 bg-red-950/40 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-red-800 py-3 rounded-lg font-bold tracking-wide uppercase mt-2 disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>

          <p className="text-center text-white/90 text-sm pt-1">
            <button type="button" className="hover:underline">
              ¿Olvidaste tu contraseña?
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}
