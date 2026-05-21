import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { GP_API_PROXY } from '../../packages/shared/vite.proxy.js'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    proxy: GP_API_PROXY,
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('service'),
  },
})
