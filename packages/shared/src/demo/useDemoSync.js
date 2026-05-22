import { useEffect } from 'react'
import { loadGlobalStore, saveGlobalStore, subscribeGlobalStore } from './store.js'
import { startHubPolling, isHubEnabled } from './syncHub.js'

/** Подписка на store + hub poll (для React contexts) */
export function useDemoSync(setStore) {
  useEffect(() => {
    setStore(loadGlobalStore())
    const unsub = subscribeGlobalStore(setStore)
    const stopHub = isHubEnabled() ? startHubPolling(2000, (remote) => {
      saveGlobalStore(remote, { skipHub: true })
      setStore(remote)
    }) : () => {}
    return () => {
      unsub()
      stopHub()
    }
  }, [setStore])
}
