import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

/**
 * Dev-only middleware that mimics the Vercel `api/gemini.ts` edge function.
 * Lets `npm run dev` handle /api/gemini locally without needing `vercel dev`.
 */
function geminiDevProxy(apiKey: string | undefined): Plugin {
  return {
    name: 'gemini-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/gemini', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end(JSON.stringify({ error: 'Method not allowed' }))
          return
        }
        if (!apiKey) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'GEMINI_API_KEY not configured in .env' }))
          return
        }
        const chunks: Buffer[] = []
        for await (const chunk of req) chunks.push(chunk as Buffer)
        const body = Buffer.concat(chunks).toString('utf8')
        try {
          const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body,
            },
          )
          const text = await upstream.text()
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(text)
        } catch (e) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: String(e) }))
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
  server: {
    host: '127.0.0.1',
  },
  plugins: [
    geminiDevProxy(env.GEMINI_API_KEY),
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
  }
})
