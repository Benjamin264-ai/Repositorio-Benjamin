'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { User, Lock, ShoppingCart } from 'lucide-react'

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
      // Mensaje temporal de depuración: te muestra el motivo real
      setError(`Error real: ${error.message}`)
      console.error(error)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500">
      {/* Ondas decorativas de fondo */}
      <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-blue-400/30 blur-2xl" />
      <div className="absolute bottom-0 left-0 w-full h-64 bg-blue-800/20 rounded-t-[100%]" />
      <div className="absolute bottom-0 left-0 w-full h-40 bg-blue-900/20 rounded-t-[100%]" />

      <div className="relative z-10 w-full max-w-sm px-6">
        {/* Icono */}
        <div className="flex justify-center mb-10">
          <div className="relative">
            <ShoppingCart className="w-16 h-16 text-white" strokeWidth={1.5} />
          </div>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="flex items-center gap-3 border-2 border-white/70 rounded-lg px-4 py-3 bg-white/95">
            <User className="w-5 h-5 text-blue-700 shrink-0" />
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
            <Lock className="w-5 h-5 text-blue-700 shrink-0" />
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
            <p className="text-sm text-yellow-200 bg-red-900/30 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-blue-700 py-3 rounded-lg font-bold tracking-wide uppercase mt-2 disabled:opacity-60"
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
