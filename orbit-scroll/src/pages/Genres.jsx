import { Link } from 'react-router-dom'
import Page, { Status } from '../components/Page'
import { useFetch } from '../hooks/useFetch'
import { getGenres } from '../api/tmdb'

export default function Genres() {
  const { data, loading, error } = useFetch((s) => getGenres(s), [])
  return (
    <Page>
      <div className="container">
        <h1 className="ptitle">Browse by genre</h1>
        <Status loading={loading} error={error} />
        <div className="genre-grid">
          {data?.genres.map((g, i) => (
            <Link key={g.id} to={`/genre/${g.id}`} className="genre" >
              {g.name}
            </Link>
          ))}
        </div>
      </div>
    </Page>
  )
}
