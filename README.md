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
