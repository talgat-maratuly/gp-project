import { readFileSync, existsSync } from 'fs'
import { API_METHODS_REQUIRED } from './api-contracts.js'

export function assertApiClientMethods(clientSource, methods = API_METHODS_REQUIRED) {
  const missing = []
  for (const name of methods) {
    if (!new RegExp(`\\b${name}\\s*:`).test(clientSource)) missing.push(name)
  }
  return missing
}

export function assertExportsResolvable(packageJsonPath, subpaths) {
  const errors = []
  if (!existsSync(packageJsonPath)) return ['package.json missing']
  const pkg = JSON.parse(readFileSync(packageJsonPath, 'utf8'))
  const exports = pkg.exports || {}
  for (const sub of subpaths) {
    const key = sub === '.' ? '.' : `./${sub.replace(/^\.\//, '')}`
    const target = exports[key]
    if (!target) {
      errors.push(`missing export: ${key}`)
      continue
    }
    const file = packageJsonPath.replace('package.json', target)
    if (!existsSync(file)) errors.push(`export target missing: ${key} → ${target}`)
  }
  return errors
}
