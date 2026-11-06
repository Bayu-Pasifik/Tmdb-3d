import { useCallback, useEffect, useState } from 'react'

// one-shot request: fn(signal) -> promise; refetches when deps change
export function useFetch(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    setState({ data: null, loading: true, error: null })
    fn(ctrl.signal)
      .then((data) => setState({ data, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ data: null, loading: false, error: e.message })
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return state
}

// paginated list: fn(page, signal) -> TMDB page object; "load more" appends the next page
export function usePaged(fn, deps) {
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ items: [], total: 1, loading: true, error: null })

  useEffect(() => {
    setPage(1)
    setState({ items: [], total: 1, loading: true, error: null })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fn(page, ctrl.signal)
      .then((r) =>
        setState((s) => ({
          items: page === 1 ? r.results : [...s.items, ...r.results.filter((x) => !s.items.some((y) => y.id === x.id))],
          total: r.total_pages,
          loading: false,
          error: null,
        }))
      )
      .catch((e) => {
        if (e.name !== 'AbortError') setState((s) => ({ ...s, loading: false, error: e.message }))
      })
    return () => ctrl.abort()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, ...deps])

  const loadMore = useCallback(() => setPage((p) => p + 1), [])
  return { items: state.items, loading: state.loading, error: state.error, hasMore: page < state.total, loadMore }
}
