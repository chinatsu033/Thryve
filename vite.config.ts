import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages: https://chinatsu033.github.io/Thryve/
export default defineConfig({
  plugins: [react()],
  base: '/Thryve/',
})
