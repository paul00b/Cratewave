import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg'],
      manifest: {
        name: 'Cratewave',
        short_name: 'Cratewave',
        description: 'Découverte musicale personnelle connectée à Spotify',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        icons: [
          {
            src: '/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.spotify\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'spotify-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 300 },
            },
          },
          {
            urlPattern: /^https:\/\/ws\.audioscrobbler\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'lastfm-api',
              expiration: { maxEntries: 50, maxAgeSeconds: 600 },
            },
          },
          {
            urlPattern: /^https:\/\/generativelanguage\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'gemini-api',
              expiration: { maxEntries: 20, maxAgeSeconds: 300 },
            },
          },
        ],
      },
    }),
  ],
})
