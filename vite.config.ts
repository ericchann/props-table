import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set this to your repo name if using GitHub Pages project site
export default defineConfig({
  plugins: [react()],
  base: '/' // serve from root so local dev paths are like /wnba and /csgo
})
