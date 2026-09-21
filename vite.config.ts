import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Cloudflare Pages custom domain (thryve.chinatsu033.org) serves at site root.
// Legacy GitHub Pages used base: '/Thryve/' — switched to '/' for CF deploy.
export default defineConfig({
  plugins: [react()],
  base: '/',
})
