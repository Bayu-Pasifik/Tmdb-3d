import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// image.tmdb.org sends no CORS headers, so WebGL cannot use its images as
// textures directly. Proxy them through our own origin (/tmdbimg/...).
// In production add the same rewrite on your host (see README note).
const imageProxy = {
  '/tmdbimg': {
    target: 'https://image.tmdb.org',
    changeOrigin: true,
    rewrite: (p) => p.replace(/^\/tmdbimg/, ''),
  },
}

export default defineConfig({
  plugins: [react()],
  server: { proxy: imageProxy },
  preview: { proxy: imageProxy },
})
