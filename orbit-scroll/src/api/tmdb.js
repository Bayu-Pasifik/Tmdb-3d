const KEY = import.meta.env.VITE_TMDB_API_KEY
const BASE = 'https://api.themoviedb.org/3'

// <img> display URLs (no CORS needed)
export const img = (path, size = 'w500') =>
  path ? `https://image.tmdb.org/t/p/${size}${path}` : null

// same-origin URL for WebGL textures (proxied in vite.config.js; TMDB has no CORS on images)
export const texUrl = (path, size = 'w500') =>
  path ? `/tmdbimg/t/p/${size}${path}` : null

async function get(path, params = {}, signal) {
  if (!KEY || KEY === 'your_v3_api_key_here') {
    throw new Error('Set VITE_TMDB_API_KEY in .env and restart the dev server')
  }
  const qs = new URLSearchParams({ api_key: KEY, language: 'en-US', ...params })
  const res = await fetch(`${BASE}${path}?${qs}`, { signal })
  if (res.status === 404) throw new Error('Not found')
  if (!res.ok) throw new Error(`TMDB error ${res.status}`)
  return res.json()
}

/* ---- endpoints used by the routes ---- */

// home orbit: popular | top_rated | now_playing | upcoming
export async function fetchMovies(category, signal) {
  const json = await get(`/movie/${category}`, { page: 1 }, signal)
  return json.results.filter((m) => m.poster_path).slice(0, 20)
}

// /movie/:id  (cast, crew, trailers and similar films in one request)
export const getMovie = (id, signal) =>
  get(`/movie/${id}`, { append_to_response: 'credits,videos,similar' }, signal)

// /search?q=
export const searchMovies = (query, page, signal) =>
  get('/search/movie', { query, page, include_adult: false }, signal)

// /genres
export const getGenres = (signal) => get('/genre/movie/list', {}, signal)

// /genre/:id
export const discoverMovies = ({ genre, sort, page }, signal) =>
  get(
    '/discover/movie',
    {
      with_genres: genre,
      sort_by: sort,
      page,
      // avoid 10/10 films with 3 votes topping the "rating" sort
      'vote_count.gte': sort.startsWith('vote_average') ? 300 : 0,
    },
    signal
  )

// /person/:id
export const getPerson = (id, signal) =>
  get(`/person/${id}`, { append_to_response: 'movie_credits' }, signal)
