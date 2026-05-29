import path from 'path'
import { fileURLToPath } from 'url'

const packagesRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/** Vite/Rolldown monorepo aliases — package.json subpath exports sometimes fail in production build */
export function gpViteResolve(appDir) {
  return {
    alias: {
      '@': path.resolve(appDir, './src'),
      // Rolldown (Vite 8) sometimes misses package.json "exports" subpaths for shared-core
      '@gp/shared-core': path.resolve(packagesRoot, 'shared-core/src'),
    },
  }
}
