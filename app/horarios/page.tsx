'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, ImagePlus, Calendar } from 'lucide-react'

export default function HorariosPage() {
  const { profile } = useProfile()
  const [fotoUrl, setFotoUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [subiendo, setSubiendo] = useState(false)
  const [error, setError] = useState('')

  const cargar = async () => {
    const { data } = await supabase.from('horario').select('foto_url').eq('id', 1).maybeSingle()
    setFotoUrl(data?.foto_url ?? null)
    setLoading(false)
  }

  useEffect(() => {
    cargar()
  }, [])

  const handleFotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return

    setSubiendo(true)
    setError('')

    const extension = file.name.split('.').pop()
    const nombreArchivo = `${crypto.randomUUID()}.${extension}`

    const { error: errorSubida } = await supabase.storage
      .from('horarios-fotos')
      .upload(nombreArchivo, file)

    if (errorSubida) {
      setSubiendo(false)
      setError('No se pudo subir la foto: ' + errorSubida.message)
      return
    }

    const { data: urlData } = supabase.storage.from('horarios-fotos').getPublicUrl(nombreArchivo)

    const { error: errorGuardar } = await supabase
      .from('horario')
      .update({
        foto_url: urlData.publicUrl,
        updated_by: profile.id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 1)

    setSubiendo(false)

    if (errorGuardar) {
      setError(errorGuardar.message)
      return
    }

    await cargar()
  }

  const esAdmin = profile?.rol === 'admin'

  return (
    <div className="min-h-screen bg-red-50 p-6">
      <div className="max-w-md mx-auto">
        <Link href="/" className="flex items-center gap-1 text-red-800 text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>

        <h1 className="text-xl font-bold text-gray-800 mb-4">Horarios</h1>

        {loading && <p className="text-gray-500">Cargando...</p>}

        {!loading && fotoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={fotoUrl}
            alt="Horario"
            className="w-full rounded-xl shadow-sm border mb-4"
          />
        )}

        {!loading && !fotoUrl && (
          <div className="bg-white rounded-xl shadow-sm p-8 flex flex-col items-center gap-2 text-gray-400 mb-4">
            <Calendar className="w-10 h-10" />
            <p className="text-sm">Todavía no se ha publicado un horario.</p>
          </div>
        )}

        {esAdmin && (
          <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-red-800 bg-white">
            <ImagePlus className="w-5 h-5 text-red-800" />
            <span className="text-sm text-gray-600">
              {subiendo ? 'Subiendo...' : fotoUrl ? 'Reemplazar foto de horario' : 'Subir foto de horario'}
            </span>
            <input
              type="file"
              accept="image/*"
              onChange={handleFotoChange}
              disabled={subiendo}
              className="hidden"
            />
          </label>
        )}

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
      </div>
    </div>
  )
}
