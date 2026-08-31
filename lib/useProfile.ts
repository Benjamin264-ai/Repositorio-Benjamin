'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabase'

export type Profile = {
  id: string
  nombre: string
  rol: 'admin' | 'vendedor'
  tienda_id: string | null
  email?: string
}

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true

    const load = async () => {
      const { data: userData } = await supabase.auth.getUser()

      if (!userData.user) {
        if (active) {
          setProfile(null)
          setLoading(false)
        }
        return
      }

      const { data, error } = await supabase
        .from('perfiles')
        .select('id, nombre, rol, tienda_id')
        .eq('id', userData.user.id)
        .single()

      if (active) {
        if (!error && data) {
          setProfile({ ...data, email: userData.user.email ?? undefined })
        }
        setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  return { profile, loading }
}
