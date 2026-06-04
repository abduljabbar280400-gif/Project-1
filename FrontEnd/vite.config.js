import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.jpg'],
      manifest: {
        name: 'Num Num',
        short_name: 'NumNum',
        description: 'Premium Restaurant Platform for Customers, Chefs, and Drivers',
        theme_color: '#f7f0eb',
        background_color: '#f7f0eb',
        display: 'standalone',
        icons: [
          {
            src: 'logo.jpg',
            sizes: '192x192 512x512',
            type: 'image/jpeg',
            purpose: 'any maskable'
          }
        ]
      }
    })
  ],
})
