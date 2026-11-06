import { useState } from 'react'
import { useParams } from 'react-router-dom'
import Page, { Status } from '../components/Page'
import MovieCard from '../components/MovieCard'
import { useFetch } from '../hooks/useFetch'
import { getPerson, img } from '../api/tmdb'

export default function Person() {
  const { id } = useParams()
  const { data: p, loading, error } = useFetch((s) => getPerson(id, s), [id])
  const [more, setMore] = useState(false)

  if (loading || error) {
    return <Page><div className="container"><Status loading={loading} error={error} /></div></Page>
  }

  // best-known films first, one entry per movie
  const seen = new Set()
  const films = [...(p.movie_credits?.cast || [])]
    .filter((c) => c.poster_path && !seen.has(c.id) && seen.add(c.id))
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 24)

  const bio = p.biography || 'No biography available.'
  const long = bio.length > 600

  return (
    <Page>
      <div className="container">
        <section className="pbio">
          {p.profile_path ? <img src={img(p.profile_path, 'w342')} alt={p.name} /> : <span className="noimg big">?</span>}
          <div>
            <h1 className="ptitle">{p.name}</h1>
            <p className="tags">
              {p.known_for_department && <span>{p.known_for_department}</span>}
              {p.birthday && <span>Born {p.birthday}</span>}
              {p.place_of_birth && <span>{p.place_of_birth}</span>}
            </p>
            <p className="ov full">{long && !more ? `${bio.slice(0, 600)}…` : bio}</p>
            {long && (
              <button className="ghost" onClick={() => setMore((v) => !v)}>{more ? 'Show less' : 'Read more'}</button>
            )}
          </div>
        </section>

        {films.length > 0 && (
          <section>
            <h2>Known for</h2>
            <div className="mgrid">{films.map((f) => <MovieCard key={f.id} movie={f} />)}</div>
          </section>
        )}
      </div>
    </Page>
  )
}
