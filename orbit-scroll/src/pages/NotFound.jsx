import { Link } from 'react-router-dom'
import Page from '../components/Page'

export default function NotFound() {
  return (
    <Page>
      <div className="container center">
        <h1 className="ptitle">404</h1>
        <p className="note">This page drifted out of orbit.</p>
        <Link className="cta" to="/">Back to orbit</Link>
      </div>
    </Page>
  )
}
