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
    host: '127.0.0.1',
    port: 5175,
    proxy: GP_API_PROXY,
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('admin'),
  },
})
