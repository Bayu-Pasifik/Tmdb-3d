import { useEffect, useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'

export default function Layout() {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const [q, setQ] = useState('')

  // keep the box in sync with /search?q=… (and clear it elsewhere)
  useEffect(() => {
    setQ(pathname === '/search' ? new URLSearchParams(search).get('q') || '' : '')
  }, [pathname, search])

  const submit = (e) => {
    e.preventDefault()
    if (q.trim()) navigate(`/search?q=${encodeURIComponent(q.trim())}`)
  }

  return (
    <>
      <header className="top">
        <Link className="logo" to="/"><span className="mark" />orbit</Link>
        <nav className="navlinks">
          <NavLink to="/" end>Home</NavLink>
          <NavLink to="/genres">Genres</NavLink>
        </nav>
        <form className="searchbox" onSubmit={submit} role="search">
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search movies…" aria-label="Search movies" />
        </form>
      </header>
      <Outlet />
    </>
  )
}
