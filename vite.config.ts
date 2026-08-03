import fs from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { defineConfig, loadEnv, type Plugin } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
}

/**
 * Sajikan /storage langsung dari folder media backend, lengkap dengan dukungan
 * header Range.
 *
 * Sebelumnya path ini di-proxy ke `php artisan serve`. Server bawaan PHP
 * mengabaikan Range (selalu membalas 200 + seluruh file) dan hanya melayani
 * satu request pada satu waktu, sehingga video display tersendat dan patah-patah.
 * Di produksi tugas ini dipegang Apache — lihat
 * `BE-Display-RSIJPK/_server-setup/apache-vhosts.conf`. Plugin ini menyamakan
 * perilaku `npm run dev` dengan produksi supaya masalah serupa ketahuan lebih awal.
 */
function serveStorage(root: string): Plugin {
  const handler = (req: IncomingMessage, res: ServerResponse) => {
    const rel = decodeURIComponent((req.url ?? '').split('?')[0])
    const file = path.join(root, rel)

    // Jangan biarkan '..' keluar dari folder media.
    if (!file.startsWith(root + path.sep)) {
      res.statusCode = 403
      return res.end()
    }

    fs.stat(file, (err, st) => {
      // Dijawab 404 di sini, bukan diteruskan ke middleware Vite berikutnya:
      // fallback SPA akan membalas index.html dengan status 200 untuk media
      // yang tidak ada, dan itu menyesatkan saat menelusuri video yang blank.
      if (err || !st.isFile()) {
        res.statusCode = 404
        return res.end('Not found')
      }

      res.setHeader('Content-Type', MIME[path.extname(file).toLowerCase()] ?? 'application/octet-stream')
      res.setHeader('Accept-Ranges', 'bytes')

      const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.range ?? '')
      if (range) {
        const start = range[1] ? Number(range[1]) : 0
        const end = range[2] ? Number(range[2]) : st.size - 1

        if (start >= st.size || end >= st.size || start > end) {
          res.statusCode = 416
          res.setHeader('Content-Range', `bytes */${st.size}`)
          return res.end()
        }

        res.statusCode = 206
        res.setHeader('Content-Range', `bytes ${start}-${end}/${st.size}`)
        res.setHeader('Content-Length', String(end - start + 1))
        if (req.method === 'HEAD') return res.end()

        return fs.createReadStream(file, { start, end }).pipe(res)
      }

      res.statusCode = 200
      res.setHeader('Content-Length', String(st.size))
      if (req.method === 'HEAD') return res.end()

      fs.createReadStream(file).pipe(res)
    })
  }

  return {
    name: 'display-serve-storage',
    configureServer: (s) => {
      s.middlewares.use('/storage', handler)
    },
    configurePreviewServer: (s) => {
      s.middlewares.use('/storage', handler)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // VITE_API_PORT dibaca di sini (bukan di src/lib/api.ts) supaya kode aplikasi
  // tetap memakai jalur same-origin apa adanya.
  const env = loadEnv(mode, process.cwd(), '')
  const apiTarget = `http://localhost:${env.VITE_API_PORT || '8000'}`

  // Folder media backend. Bisa ditimpa lewat VITE_STORAGE_DIR bila repo backend
  // tidak bersebelahan dengan repo ini.
  const storageDir = path.resolve(
    process.cwd(),
    env.VITE_STORAGE_DIR || '../BE-Display-RSIJPK/storage/app/public',
  )
  const storageLokal = fs.existsSync(storageDir)

  // Di produksi Apache mem-proxy /api ke Laravel, sehingga backendOrigin() di
  // src/lib/api.ts cukup memakai same-origin. Saat `npm run dev` proxy itu
  // tidak ada, jadi /api nyasar ke vite sendiri dan dibalas index.html — config
  // gagal di-parse (layar jadi "belum ada gambar") dan login ditolak dengan
  // pesan menyesatkan "Email atau password salah." Proxy di bawah menghadirkan
  // perilaku Apache itu di dev.
  const proxy: Record<string, { target: string; changeOrigin: boolean }> = {
    '/api': { target: apiTarget, changeOrigin: true },
  }

  // Folder backend tidak ketemu -> terpaksa kembali lewat backend (video akan
  // terasa tersendat; atur VITE_STORAGE_DIR untuk memperbaikinya).
  if (!storageLokal) {
    proxy['/storage'] = { target: apiTarget, changeOrigin: true }
  }

  return {
    plugins: [
      react(),
      babel({ presets: [reactCompilerPreset()] }),
      ...(storageLokal ? [serveStorage(storageDir)] : []),
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
