import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: command === 'serve' ? false : 'auto',
      devOptions: {
        enabled: false,
      },
      includeAssets: [
        'favicon.ico',
        'manifest.webmanifest',
        'pwa-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png',
        'maskable-icon-512x512.png',
        'apple-touch-icon-180x180.png',
      ],
      manifest: false,
      workbox: {
        // De la fuente basta el subconjunto latino (español); el resto se baja solo si hace falta
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}', '**/inter-latin-wght-normal-*.woff2'],
        navigateFallbackDenylist: [/\.webmanifest$/],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      // Código común con la app Android (mobile/)
      '@shared': fileURLToPath(new URL('./shared', import.meta.url)),
    },
  },
  server: {
    host: 'localhost',
    port: 5173,
  },
  preview: {
    host: 'localhost',
    port: 5173,
  },
}))
