import { Link } from 'react-router-dom'
import { img } from '../api/tmdb'

export default function MovieCard({ movie }) {
  const year = movie.release_date?.slice(0, 4)
  return (
    <Link className="mcard" to={`/movie/${movie.id}`}>
      <div className="mthumb">
        {movie.poster_path ? (
          <img src={img(movie.poster_path, 'w342')} alt={movie.title} loading="lazy" />
        ) : (
          <span className="noimg">No poster</span>
        )}
        {movie.vote_average > 0 && <span className="rate">★ {movie.vote_average.toFixed(1)}</span>}
      </div>
      <h3>{movie.title}</h3>
      {year && <span className="yr">{year}</span>}
    </Link>
  )
}
