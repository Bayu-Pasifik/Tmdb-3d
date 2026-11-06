import { useSearchParams } from 'react-router-dom'
import Page, { Status } from '../components/Page'
import MovieCard from '../components/MovieCard'
import { usePaged } from '../hooks/useFetch'
import { searchMovies } from '../api/tmdb'

export default function Search() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').trim()
  const { items, loading, error, hasMore, loadMore } = usePaged(
    (page, s) => (q ? searchMovies(q, page, s) : Promise.resolve({ results: [], total_pages: 0 })),
    [q]
  )

  return (
    <Page>
      <div className="container">
        <h1 className="ptitle">{q ? <>Results for “{q}”</> : 'Search'}</h1>
        {!q && <p className="note">Type a movie title in the box above.</p>}
        <div className="mgrid">{items.filter((m) => m.poster_path).map((m) => <MovieCard key={m.id} movie={m} />)}</div>
        <Status loading={loading && !!q} error={error} empty={!!q && !loading && !error && items.length === 0} />
        {hasMore && !loading && <button className="more" onClick={loadMore}>Load more</button>}
      </div>
    </Page>
  )
}
