import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  // Layar display dibuka lewat URL tetap, jadi port jangan berpindah diam-diam
  // saat 3000 terpakai — strictPort membuatnya gagal terang-terangan daripada
  // menyalakan di port lain yang tak terduga.
  server: {
    port: 3000,
    strictPort: true,
  },
  preview: {
    port: 3000,
    strictPort: true,
  },
})
