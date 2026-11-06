const KEY = import.meta.env.VITE_TMDB_API_KEY

export const img = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

export async function fetchMovies(category, signal) {
  if (!KEY || KEY === 'your_v3_api_key_here') {
    throw new Error('Set VITE_TMDB_API_KEY in .env and restart the dev server')
  }
  const url = `https://api.themoviedb.org/3/movie/${category}?api_key=${KEY}&language=en-US&page=1`
  const res = await fetch(url, { signal })
  if (!res.ok) throw new Error(`TMDB error ${res.status}`)
  const json = await res.json()
  return json.results.filter((m) => m.poster_path).slice(0, 24)
}
