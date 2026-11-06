import { useCallback, useEffect, useRef, useState } from 'react'
import Scene from './components/Scene'
import Modal from './components/Modal'
import { useMovies } from './hooks/useMovies'

const TABS = [
  ['popular', 'Popular'],
  ['top_rated', 'Top Rated'],
  ['now_playing', 'Now Playing'],
  ['upcoming', 'Upcoming'],
]

export default function App() {
  const [category, setCategory] = useState('popular')
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const navRef = useRef(null)
  const { movies, loading, error } = useMovies(category)

  const active = movies[index]
  const go = useCallback((i) => navRef.current?.(i), [])

  useEffect(() => {
    const onKey = (e) => {
      if (selected) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(index + 1)
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') go(index - 1)
      if (e.key === 'Enter' && active) setSelected(active)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, active, selected, go])

  const switchCategory = (key) => {
    setIndex(0)
    setCategory(key)
  }

  return (
    <>
      <div className="stage">
        {movies.length > 1 && (
          <Scene key={category} movies={movies} navRef={navRef} onIndex={setIndex} onOpen={setSelected} />
        )}
      </div>

      <header className="top">
        <a className="logo" href="/"><span className="mark" />cardstack</a>
        <nav className="chips">
          {TABS.map(([k, label]) => (
            <button key={k} className={k === category ? 'on' : ''} onClick={() => switchCategory(k)}>
              {label}
            </button>
          ))}
        </nav>
      </header>

      {active && (
        <section className="info" key={active.id}>
          <span className="count">
            {String(index + 1).padStart(2, '0')} <i>/ {String(movies.length).padStart(2, '0')}</i>
          </span>
          <h1>{active.title}</h1>
          <p>
            ★ {active.vote_average.toFixed(1)} · {active.release_date?.slice(0, 4) || 'TBA'}
          </p>
        </section>
      )}

      {movies.length > 0 && (
        <div className="controls">
          <button className="round" onClick={() => go(index - 1)} aria-label="Previous">←</button>
          <button className="round" onClick={() => go(index + 1)} aria-label="Next">→</button>
          <button className="pill dark" onClick={() => setSelected(active)}>Details</button>
        </div>
      )}

      {loading && <p className="state">Loading…</p>}
      {error && <p className="state error">{error}</p>}
      <p className="hint">Scroll · arrow keys · click a card</p>
      <footer className="credit">This product uses the TMDB API but is not endorsed or certified by TMDB.</footer>

      {selected && <Modal movie={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
