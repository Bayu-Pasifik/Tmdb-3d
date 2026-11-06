import { useState } from 'react'
import Scene from './components/Scene'
import Overlay from './components/Overlay'
import { useMovies } from './hooks/useMovies'

const TABS = [
  ['popular', 'Popular'],
  ['top_rated', 'Top Rated'],
  ['now_playing', 'Now Playing'],
  ['upcoming', 'Upcoming'],
]

export default function App() {
  const [category, setCategory] = useState('popular')
  const [selected, setSelected] = useState(null)
  const { movies, loading, error } = useMovies(category)

  return (
    <>
      <div className="stage">
        {movies.length > 0 && <Scene key={category} movies={movies} onSelect={setSelected} />}
      </div>

      <header className="ui">
        <h1>Cine<span>Spiral</span></h1>
        <nav>
          {TABS.map(([key, label]) => (
            <button
              key={key}
              className={key === category ? 'active' : ''}
              onClick={() => setCategory(key)}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {loading && <p className="status">Loading movies…</p>}
      {error && <p className="status error">{error}</p>}
      {!loading && !error && <p className="hint">Scroll to spiral · hover · click a poster</p>}

      <footer className="credit">
        This product uses the TMDB API but is not endorsed or certified by TMDB.
      </footer>

      {selected && <Overlay movie={selected} onClose={() => setSelected(null)} />}
    </>
  )
}
