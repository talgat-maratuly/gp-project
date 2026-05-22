/** Синхронизация demo-store между портами 5173/5174/5175 через hub :5190 */

const HUB_URL = typeof import.meta !== 'undefined'
  ? (import.meta.env?.VITE_GP_DEMO_HUB || 'http://127.0.0.1:5190')
  : 'http://127.0.0.1:5190'

export function isHubEnabled() {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_GP_DEMO_HUB === 'off') return false
  return true
}

export async function pullFromHub() {
  try {
    const res = await fetch(`${HUB_URL}/store`, { cache: 'no-store' })
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

export async function pushToHub(store) {
  await fetch(`${HUB_URL}/store`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(store),
  })
}

export function startHubPolling(intervalMs = 2000, onUpdate) {
  if (!isHubEnabled()) return () => {}
  let last = ''
  const tick = async () => {
    const remote = await pullFromHub()
    if (!remote) return
    const sig = JSON.stringify(remote).length + (remote.orders?.length || 0)
    if (String(sig) !== last) {
      last = String(sig)
      onUpdate(remote)
    }
  }
  tick()
  const id = setInterval(tick, intervalMs)
  return () => clearInterval(id)
}
