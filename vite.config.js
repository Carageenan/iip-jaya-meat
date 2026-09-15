import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [react(), tailwindcss()],
  // Deploy ke GitHub Pages project site (carageenan.github.io/iip-jaya-meat/),
  // bukan user/org root site, jadi semua asset perlu di-prefix nama repo ini.
  // Cuma pas build ("npm run build") -- kalau ikut kepakai pas dev server juga,
  // localhost:5173 jadi pindah ke /iip-jaya-meat/ dan bikin dev jadi aneh.
  base: command === 'build' ? '/iip-jaya-meat/' : '/',
}))
