import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getToken } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'

/**
 * Список модерации без infinite loop: opts мемоизацияланған, fetch/onLoaded ref арқылы.
 */
export function useAdminModerationLoad({
  tab,
  scope,
  listOpts: listOptsProp,
  fetchList,
  fetchDemoList,
  enabled = true,
  demoBlockedMessage = '',
  onLoaded,
}) {
  const listOpts = useMemo(
    () => ({ ...(scope ? { scope } : {}), ...(listOptsProp || {}) }),
    [scope, listOptsProp],
  )
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fetchRef = useRef(fetchList)
  const fetchDemoRef = useRef(fetchDemoList)
  const onLoadedRef = useRef(onLoaded)
  const demoMsgRef = useRef(demoBlockedMessage)
  fetchRef.current = fetchList
  fetchDemoRef.current = fetchDemoList
  onLoadedRef.current = onLoaded
  demoMsgRef.current = demoBlockedMessage

  const load = useCallback(async () => {
    if (!enabled) return
    if (isDemoMode() && fetchDemoRef.current) {
      setLoading(true)
      setError('')
      try {
        const rows = fetchDemoRef.current(tab, listOpts)
        const next = Array.isArray(rows) ? rows : []
        setList(next)
        onLoadedRef.current?.(next)
      } catch (e) {
        setError(e?.message || '')
      } finally {
        setLoading(false)
      }
      return
    }
    if (isDemoMode() && !getToken()) {
      setList([])
      setError(demoMsgRef.current)
      return
    }
    setLoading(true)
    setError('')
    try {
      const rows = await fetchRef.current(tab, listOpts)
      const next = Array.isArray(rows) ? rows : []
      setList(next)
      onLoadedRef.current?.(next)
    } catch (e) {
      setError(e?.message || '')
    } finally {
      setLoading(false)
    }
  }, [tab, listOpts, enabled])

  useEffect(() => {
    load()
  }, [load])

  return { list, setList, loading, error, setError, load, listOpts }
}
