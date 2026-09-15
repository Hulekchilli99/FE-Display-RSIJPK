# Display Masjid RSIJPK (Frontend)

Tampilan layar masjid: jam, jadwal sholat, cuaca, latar (gambar/slideshow/video/
YouTube), dan teks berjalan. Dibuat dengan **React + TypeScript + Vite**.

Data diambil dari **backend Laravel** (repo terpisah `BE-Masjid-RSIJPK`):
pengaturan & media tersimpan di server (MySQL), bukan lagi di browser.

---

## Prasyarat
- Node.js 20+ & npm
- Backend `BE-Masjid-RSIJPK` berjalan (default `http://localhost:8000`)

## Setup
```bash
npm install
cp .env.example .env      # atur VITE_API_URL bila backend bukan di localhost:8000
```

`.env`:
```
VITE_API_URL=http://localhost:8000/api
```

## Menjalankan
```bash
npm run dev      # mode pengembangan (HMR)
npm run build    # build produksi -> dist/
npm run preview  # pratinjau hasil build
npm run lint     # cek ESLint
```

## Pemakaian
- Buka URL Vite (mis. `http://localhost:5173`).
- Klik ikon **⚙️** (kanan atas) → **login admin** untuk mengubah pengaturan.
  Login default ada di README backend.
- Layar tampil tanpa login; hanya menyimpan pengaturan yang butuh login.

---

## Struktur singkat
```
src/
  App.tsx                 # komposisi layar + ambil/simpan config ke API
  lib/
    api.ts                # klien API ke backend (login, config, upload)
    config.ts             # tipe Config + cache lokal (paint instan)
    prayers.ts            # jadwal sholat (Aladhan) + sholat aktif
    weather.ts            # cuaca otomatis
    datetime.ts, youtube.ts
  components/             # atoms / molecules / organisms
    organisms/
      Background/         # render latar (gambar/slideshow/video/YouTube)
      SettingsPanel/      # form pengaturan + login admin + upload
    molecules/            # Clock, PrayerList, Sidebar, Ticker, Weather
```

## Catatan
- Gambar/video di-upload ke backend; layar membaca URL-nya dari `GET /api/config`.
- Kalau backend mati, layar memakai **cache config** terakhir (localStorage) agar tetap tampil.
- Teks berjalan: kecepatan scroll otomatis menyesuaikan panjang teks (`Ticker.tsx`).
- **`/storage` saat `npm run dev`** dilayani langsung oleh Vite dari folder media
  backend (`../BE-Display-RSIJPK/storage/app/public`, atur lewat `VITE_STORAGE_DIR`),
  bukan di-proxy ke `php artisan serve` — server bawaan PHP mengabaikan header
  `Range` sehingga video terasa tersendat. Ini menyamakan perilaku dev dengan
  produksi, di mana Apache yang menyajikan `/storage`. Bila folder itu tidak
  ditemukan, Vite otomatis kembali memakai proxy lama.
- **Jalankan layar dalam mode fullscreen / kiosk.** Video signage dibuat 16:9,
  sementara viewport browser biasa selalu lebih lebar dari 16:9 karena tingginya
  dipotong toolbar — akibatnya muncul pita hitam di kiri-kanan (mode YouTube)
  atau tepi video terpotong (mode upload). Fullscreen (F11) atau kiosk membuat
  viewport sama persis dengan layar, sehingga di TV 16:9 video tampil penuh
  tanpa pita hitam dan tanpa potongan:

  ```bash
  chromium --kiosk --autoplay-policy=no-user-gesture-required \
    "http://<server>/?display=walidah"
  ```

  Flag `--autoplay-policy` sekaligus membuat suara langsung keluar tanpa perlu
  layar disentuh lebih dulu.

- **Layar Walidah** punya dua sumber tayangan, dipilih di panel pengaturan
  (**Sumber tayangan**):
  - *Video upload* — playlist video diputar dengan dua elemen `<video>`
    bergantian (double buffer): satu tampil, satunya sudah memuat video
    berikutnya, sehingga tidak ada jeda hitam saat pergantian.
  - *YouTube* — satu link live/video memenuhi layar lewat `<iframe>`
    (komponen `YoutubeFrame`, sama seperti kolom kanan MCU). Playlist upload
    tidak dirender selama mode ini aktif agar decoder TV tidak dipakai dua
    player sekaligus; video yang sudah di-upload tetap tersimpan.

    Syaratnya videonya **Publik** atau **Tidak publik (unlisted)**, dan
    penyematannya tidak dimatikan. Video **Pribadi** hanya tampil sebagai kotak
    hitam "Video unavailable" — pemiliknya sendiri tetap bisa membukanya di
    YouTube karena sedang login, jadi gejalanya menyesatkan.

    **Jangan tambahkan `loop=1&playlist=<id>` ke URL embed.** Itu trik looping
    yang lazim, tapi `playlist=` membuat player memperlakukan video sebagai
    playlist dan playlist YouTube **hanya menerima video publik**: video
    unlisted ditolak dengan pesan "This video is unavailable", sementara embed
    biasa video yang sama jalan normal. Looping ditangani `YoutubeFrame` lewat
    JS API (tangkap state `ENDED`, putar lagi dari awal), yang bekerja untuk
    publik maupun unlisted.
