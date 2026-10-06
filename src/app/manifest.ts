import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Günübirlik İş Bul — Konum Bazlı Günlük İş Platformu',
    short_name: 'Günübirlik',
    description: "Türkiye'nin güvenilir ve hızlı günübirlik, part-time ve yevmiyeli iş bulma platformu.",
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#4f46e5',
    icons: [
      {
        src: '/icon.png?v=3',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/logo.png?v=3',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/apple-touch-icon.png?v=3',
        sizes: '180x180',
        type: 'image/png',
      },
    ],
  }
}
