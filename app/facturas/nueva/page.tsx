'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useProfile } from '@/lib/useProfile'
import { ArrowLeft, ImagePlus } from 'lucide-react'

export default function NuevaFacturaPage() {
  const { profile } = useProfile()
  const router = useRouter()

  const [ruc, setRuc] = useState('')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [foto, setFoto] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null
    setFoto(file)
    setPreviewUrl(file ? URL.createObjectURL(file) : '')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    let fotoUrl: string | null = null

    if (foto) {
      const extension = foto.name.split('.').pop()
      const nombreArchivo = `${crypto.randomUUID()}.${extension}`

      const { error: errorSubida } = await supabase.storage
        .from('facturas-fotos')
        .upload(nombreArchivo, foto)

      if (errorSubida) {
        setLoading(false)
        setError('No se pudo subir la foto: ' + errorSubida.message)
        return
      }

      const { data: urlData } = supabase.storage
        .from('facturas-fotos')
        .getPublicUrl(nombreArchivo)

      fotoUrl = urlData.publicUrl
    }

    const { error } = await supabase.from('facturas_pendientes').insert({
      ruc: ruc.trim(),
      monto: parseFloat(monto),
      descripcion: descripcion.trim(),
      foto_url: fotoUrl,
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

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Foto <span className="text-gray-400 font-normal">(adjunta foto de la factura o boleta)</span>
            </label>
            <label className="flex items-center justify-center gap-2 border-2 border-dashed border-gray-300 rounded-lg py-4 cursor-pointer hover:border-red-800">
              <ImagePlus className="w-5 h-5 text-red-800" />
              <span className="text-sm text-gray-600">
                {foto ? foto.name : 'Toca para elegir una foto'}
              </span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFotoChange}
                className="hidden"
              />
            </label>
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Vista previa"
                className="mt-3 w-full max-h-48 object-contain rounded-lg border"
              />
            )}
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
