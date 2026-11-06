import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './pages/Home'
import MovieDetail from './pages/MovieDetail'
import Search from './pages/Search'
import Genres from './pages/Genres'
import GenreMovies from './pages/GenreMovies'
import Person from './pages/Person'
import NotFound from './pages/NotFound'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="movie/:id" element={<MovieDetail />} />
        <Route path="search" element={<Search />} />
        <Route path="genres" element={<Genres />} />
        <Route path="genre/:id" element={<GenreMovies />} />
        <Route path="person/:id" element={<Person />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
