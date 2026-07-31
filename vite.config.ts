import { defineConfig, loadEnv } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_API_PORT dibaca di sini (bukan di src/lib/api.ts) supaya kode aplikasi
  // tetap memakai jalur same-origin apa adanya.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = `http://localhost:${env.VITE_API_PORT || '8000'}`

  // Di produksi Apache mem-proxy /api dan /storage ke Laravel, sehingga
  // backendOrigin() di src/lib/api.ts cukup memakai same-origin. Saat
  // `npm run dev` proxy itu tidak ada, jadi /api nyasar ke vite sendiri dan
  // dibalas index.html — config gagal di-parse (layar jadi "belum ada gambar")
  // dan login ditolak dengan pesan menyesatkan "Email atau password salah."
  // Proxy di bawah menghadirkan perilaku Apache itu di dev.
  const proxy = {
    '/api': { target: apiTarget, changeOrigin: true },
    '/storage': { target: apiTarget, changeOrigin: true },
  }

  return {
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
      proxy,
    },
    preview: {
      port: 3000,
      strictPort: true,
      proxy,
    },
  }
})
