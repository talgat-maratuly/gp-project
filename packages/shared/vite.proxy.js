/** Прокси API для Vite dev-серверов (GP Service / Partner / Admin) */
export const GP_API_PROXY = {
  '/api': { target: 'http://localhost:4000', changeOrigin: true },
  '/health': { target: 'http://localhost:4000', changeOrigin: true },
}
