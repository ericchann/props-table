import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Set this to your repo name if using GitHub Pages project site
const repo = 'props-table'

export default defineConfig({
  plugins: [react()],
  base: `/${repo}/` // use '/' if you use a custom domain
})
