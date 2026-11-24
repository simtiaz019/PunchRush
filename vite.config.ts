import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [react(), VitePWA({ registerType: 'autoUpdate', manifest: {
    name: 'PunchRush', short_name: 'PunchRush', description: '10 Seconds. Maximum Punches.',
    theme_color: '#170a38', background_color: '#170a38', display: 'standalone', orientation: 'any',
    icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' }]
  }, workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'] } })],
  test: { environment: 'jsdom', globals: true, exclude: ['e2e/**', 'node_modules/**', 'dist/**'] }
})
