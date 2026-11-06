import { useEffect } from 'react'
import { img } from '../api/tmdb'

export default function Overlay({ movie, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="backdrop" onClick={onClose}>
      <article className="card" onClick={(e) => e.stopPropagation()}>
        <img src={img(movie.poster_path, 'w342')} alt={movie.title} />
        <div>
          <h2>{movie.title}</h2>
          <p className="meta">
            ★ {movie.vote_average.toFixed(1)} · {movie.release_date || 'TBA'}
          </p>
          <p>{movie.overview || 'No synopsis available.'}</p>
          <a
            href={`https://www.themoviedb.org/movie/${movie.id}`}
            target="_blank"
            rel="noreferrer"
          >
            View on TMDB ↗
          </a>
          <button onClick={onClose}>Close</button>
        </div>
      </article>
    </div>
  )
}
