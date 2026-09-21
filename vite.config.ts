import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://chinatsu033.github.io/psych-state-journal/
export default defineConfig({
  plugins: [react()],
  base: '/psych-state-journal/',
})
