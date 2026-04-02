import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import sqlocal from 'sqlocal/vite'

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? '/aoyo/' : '/',
  plugins: [react(), sqlocal()],
})
