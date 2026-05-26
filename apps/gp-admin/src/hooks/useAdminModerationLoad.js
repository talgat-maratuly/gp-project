import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getToken } from '@gp/shared/api'
import { isDemoMode } from '@gp/shared/demo'

/**
 * Список модерации без infinite loop: opts мемоизацияланған, fetch/onLoaded ref арқылы.
 */
export function useAdminModerationLoad({
  tab,
  scope,
  fetchList,
  enabled = true,
  demoBlockedMessage = '',
  onLoaded,
}) {
  const listOpts = useMemo(() => (scope ? { scope } : {}), [scope])
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const fetchRef = useRef(fetchList)
  const onLoadedRef = useRef(onLoaded)
  const demoMsgRef = useRef(demoBlockedMessage)
  fetchRef.current = fetchList
  onLoadedRef.current = onLoaded
  demoMsgRef.current = demoBlockedMessage

  const load = useCallback(async () => {
    if (!enabled) return
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
