import { useEffect } from 'react'
import { img } from '../api/tmdb'

export default function Modal({ movie, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="modal-bg" onClick={onClose}>
      <article className="modal" onClick={(e) => e.stopPropagation()}>
        <img src={img(movie.poster_path, 'w342')} alt={movie.title} />
        <div>
          <h2>{movie.title}</h2>
          <p className="tags">
            <span>★ {movie.vote_average.toFixed(1)}</span>
            <span>{movie.release_date || 'TBA'}</span>
            <span>{movie.original_language?.toUpperCase()}</span>
          </p>
          <p className="ov">{movie.overview || 'No synopsis available.'}</p>
          <div className="row">
            <a className="cta" href={`https://www.themoviedb.org/movie/${movie.id}`} target="_blank" rel="noreferrer">
              View on TMDB ↗
            </a>
            <button className="ghost" onClick={onClose}>Close</button>
          </div>
        </div>
      </article>
    </div>
  )
}
