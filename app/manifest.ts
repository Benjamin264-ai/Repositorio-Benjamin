import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Comercial Mary',
    short_name: 'C. Mary',
    description: 'Sistema de ventas e inventario de Comercial Mary',
    start_url: '/',
    display: 'standalone',
    background_color: '#fef2f2',
    theme_color: '#7f1d1d',
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
