import { useParams, useSearchParams } from 'react-router-dom'
import Page, { Status } from '../components/Page'
import MovieCard from '../components/MovieCard'
import { useFetch, usePaged } from '../hooks/useFetch'
import { discoverMovies, getGenres } from '../api/tmdb'

const SORTS = [
  ['popularity.desc', 'Popular'],
  ['vote_average.desc', 'Top rated'],
  ['primary_release_date.desc', 'Newest'],
]

export default function GenreMovies() {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const sort = SORTS.some(([k]) => k === params.get('sort')) ? params.get('sort') : 'popularity.desc'

  const { data: genres } = useFetch((s) => getGenres(s), [])
  const name = genres?.genres.find((g) => String(g.id) === id)?.name

  const { items, loading, error, hasMore, loadMore } = usePaged(
    (page, s) => discoverMovies({ genre: id, sort, page }, s),
    [id, sort]
  )

  return (
    <Page>
      <div className="container">
        <h1 className="ptitle">{name || 'Genre'}</h1>
        <div className="sorts">
          {SORTS.map(([k, label]) => (
            <button key={k} className={k === sort ? 'on' : ''} onClick={() => setParams(k === 'popularity.desc' ? {} : { sort: k })}>
              {label}
            </button>
          ))}
        </div>
        <div className="mgrid">{items.filter((m) => m.poster_path).map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        <Status loading={loading} error={error} empty={!loading && !error && items.length === 0} />
        {hasMore && !loading && <button className="more" onClick={loadMore}>Load more</button>}
      </div>
    </Page>
  )
}
