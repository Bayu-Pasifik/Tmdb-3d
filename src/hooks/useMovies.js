import { useEffect, useState } from 'react'
import { fetchMovies } from '../api/tmdb'

export function useMovies(category) {
  const [state, setState] = useState({ movies: [], loading: true, error: null })

  useEffect(() => {
    const ctrl = new AbortController()
    setState((s) => ({ ...s, loading: true, error: null }))
    fetchMovies(category, ctrl.signal)
      .then((movies) => setState({ movies, loading: false, error: null }))
      .catch((e) => {
        if (e.name !== 'AbortError') setState({ movies: [], loading: false, error: e.message })
      })
    return () => ctrl.abort()
  }, [category])

  return state
}
