import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import Page, { Status } from '../components/Page'
import MovieCard from '../components/MovieCard'
import { useFetch } from '../hooks/useFetch'
import { getMovie, img } from '../api/tmdb'

const runtime = (min) => (min ? `${Math.floor(min / 60)}h ${min % 60}m` : null)

export default function MovieDetail() {
  const { id } = useParams()
  const { data: m, loading, error } = useFetch((s) => getMovie(id, s), [id])
  const [playing, setPlaying] = useState(false)

  if (loading || error) {
    return <Page><div className="container"><Status loading={loading} error={error} /></div></Page>
  }

  const trailer =
    m.videos?.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
    m.videos?.results.find((v) => v.site === 'YouTube' && v.type === 'Trailer')
  const director = m.credits?.crew.find((c) => c.job === 'Director')
  const cast = (m.credits?.cast || []).slice(0, 16)
  const similar = (m.similar?.results || []).filter((x) => x.poster_path).slice(0, 12)
  const meta = [m.release_date?.slice(0, 4), runtime(m.runtime), m.original_language?.toUpperCase()].filter(Boolean)

  return (
    <Page>
      <section
        className="hero-d"
        style={m.backdrop_path ? { '--backdrop': `url(${img(m.backdrop_path, 'w1280')})` } : undefined}
      >
        <div className="container hero-inner">
          {m.poster_path && <img className="dposter" src={img(m.poster_path, 'w500')} alt={m.title} />}
          <div className="dtext">
            <h1>{m.title}</h1>
            {m.tagline && <p className="tagline">“{m.tagline}”</p>}
            <p className="tags">
              <span>★ {m.vote_average.toFixed(1)}</span>
              {meta.map((t) => <span key={t}>{t}</span>)}
              {m.genres.map((g) => (
                <Link key={g.id} to={`/genre/${g.id}`} className="tag-link">{g.name}</Link>
              ))}
            </p>
            <p className="ov full">{m.overview || 'No synopsis available.'}</p>
            {director && <p className="dir">Directed by <b>{director.name}</b></p>}
            <div className="row">
              {trailer && (
                <button className="cta" onClick={() => setPlaying((p) => !p)}>
                  {playing ? 'Hide trailer' : '▶ Watch trailer'}
                </button>
              )}
              <a className="ghost" href={`https://www.themoviedb.org/movie/${m.id}`} target="_blank" rel="noreferrer">
                TMDB ↗
              </a>
              <Link className="ghost" to="/">← Back to orbit</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        {playing && trailer && (
          <div className="video">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${trailer.key}?autoplay=1`}
              title={`${m.title} trailer`}
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {cast.length > 0 && (
          <section>
            <h2>Cast</h2>
            <div className="cast">
              {cast.map((c) => (
                <Link key={c.cast_id ?? c.credit_id} to={`/person/${c.id}`} className="person">
                  {c.profile_path ? <img src={img(c.profile_path, 'w185')} alt={c.name} loading="lazy" /> : <span className="noimg">?</span>}
                  <b>{c.name}</b>
                  <span>{c.character}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {similar.length > 0 && (
          <section>
            <h2>You might also like</h2>
            <div className="mgrid">{similar.map((s) => <MovieCard key={s.id} movie={s} />)}</div>
          </section>
        )}
      </div>
    </Page>
  )
}
