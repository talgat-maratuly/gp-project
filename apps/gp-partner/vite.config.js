import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { GP_API_PROXY } from '../../packages/shared/vite.proxy.js'
import { gpViteResolve } from '../../packages/shared/vite.resolve.js'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: gpViteResolve(__dirname),
  server: {
    port: 5174,
    strictPort: true,
    host: true,
    proxy: GP_API_PROXY,
  },
  define: {
    'import.meta.env.VITE_APP_NAME': JSON.stringify('partner'),
  },
})
