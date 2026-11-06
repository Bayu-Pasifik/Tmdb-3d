import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

// scrolling page shell for every non-home route; resets scroll on navigation
export default function Page({ children }) {
  const ref = useRef(null)
  const { key } = useLocation()
  useEffect(() => { ref.current?.scrollTo(0, 0) }, [key])

  return (
    <main className="page" ref={ref}>
      {children}
      <footer className="page-credit">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>
    </main>
  )
}

export function Status({ loading, error, empty }) {
  if (loading) return <p className="note">Loading…</p>
  if (error) return <p className="note error">{error}</p>
  if (empty) return <p className="note">Nothing found.</p>
  return null
}
