import { useCallback, useEffect, useRef, useState } from 'react'
import Scene from './components/Scene'
import Modal from './components/Modal'
import { useMovies } from './hooks/useMovies'
import { img } from './api/tmdb'

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
  const navRef = useRef(null) // set by the scene: scrolls smoothly to poster i
  const { movies, loading, error } = useMovies(category)

  const active = movies[index]
  const goTo = useCallback((i) => navRef.current?.(i), [])

  // clicking an orbiting poster scrolls to it; clicking the focused one opens details
  const pick = useCallback(
    (i) => (i === index ? setSelected(movies[i]) : goTo(i)),
    [index, movies, goTo]
  )

  useEffect(() => {
    const onKey = (e) => {
      if (selected) return
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); goTo(index + 1) }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); goTo(index - 1) }
      if (e.key === 'Enter' && active) setSelected(active)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index, selected, active])

  const switchCategory = (key) => {
    setIndex(0)
    setCategory(key)
  }

  const progress = movies.length > 1 ? index / (movies.length - 1) : 0

  return (
    <>
      <div className="stage">
        {movies.length > 1 && (
          <Scene key={category} movies={movies} navRef={navRef} onIndex={setIndex} onPick={pick} />
        )}
      </div>

      <header className="top">
        <a className="logo" href="/"><span className="mark" />orbit</a>
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
          <span className="badge">
            Now showing · {String(index + 1).padStart(2, '0')}/{String(movies.length).padStart(2, '0')}
          </span>
          <h1>{active.title}</h1>
          <p className="meta">
            ★ {active.vote_average.toFixed(1)} · {active.release_date?.slice(0, 4) || 'TBA'}
          </p>
          <p className="ov">{active.overview}</p>
          <div className="row">
            <button className="cta" onClick={() => setSelected(active)}>Details →</button>
            <button className="ghost" onClick={() => goTo(index + 1)}>Next film</button>
          </div>
        </section>
      )}

      {movies.length > 1 && (
        <>
          {/* scroll progress rail */}
          <div className="rail" aria-hidden="true">
            <span style={{ height: `${progress * 100}%` }} />
          </div>
          <div className="strip">
            <button className="round" onClick={() => goTo(index - 1)} aria-label="Previous">←</button>
            <div className="thumbs">
              {movies.map((m, i) => (
                <button key={m.id} className={i === index ? 'on' : ''} onClick={() => goTo(i)} aria-label={m.title}>
                  <img src={img(m.poster_path, 'w92')} alt="" loading="lazy" />
                </button>
              ))}
            </div>
            <button className="round" onClick={() => goTo(index + 1)} aria-label="Next">→</button>
          </div>
        </>
      )}

      {loading && <p className="state">Loading…</p>}
      {error && <p className="state error">{error}</p>}
      <p className="hint"><i className="mouse" /> Scroll to travel through the orbit · click a poster · Enter for details</p>
      <footer className="credit">This product uses the TMDB API but is not endorsed or certified by TMDB.</footer>

      {selected && <Modal movie={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
