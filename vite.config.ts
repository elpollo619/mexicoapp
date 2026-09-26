import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Publicada en GitHub Pages: https://elpollo619.github.io/mexicoapp/
export default defineConfig({
  base: '/mexicoapp/',
  plugins: [
    react(),
    VitePWA({
      // 'prompt': la app avisa con un toast y la persona decide cuándo actualizar (nunca recarga sola a mitad de un formulario)
      registerType: 'prompt',
      includeAssets: ['favicon.png', 'apple-touch-icon.png'],
      manifest: {
        name: 'México Lindo 2026',
        short_name: 'México Lindo',
        description: 'La app del viaje: itinerario, vuelos, gastos, votaciones y juegos.',
        lang: 'es',
        theme_color: '#e4007c',
        background_color: '#fbf6ee',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/mexicoapp/',
        scope: '/mexicoapp/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,jpg,svg,woff2,webp}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'fonts', expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 } },
          },
          {
            urlPattern: /^https:\/\/([abc]\.)?tile\.openstreetmap\.org\/.*/,
            handler: 'CacheFirst',
            // Las imágenes de otros dominios llegan "opacas" (status 0): hay que permitirlas o no se guardan
            options: { cacheName: 'tiles', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 150, maxAgeSeconds: 60 * 60 * 24 * 30 } },
          },
          {
            urlPattern: /^https:\/\/fopblphtagryrdjotohf\.supabase\.co\/storage\/.*/,
            handler: 'CacheFirst',
            options: { cacheName: 'receipts', cacheableResponse: { statuses: [0, 200] }, expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 60 } },
          },
        ],
      },
    }),
  ],
})
