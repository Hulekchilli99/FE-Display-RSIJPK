export type BgType = 'image' | 'slideshow' | 'video' | 'youtube'

export interface PrayerTimes {
  Subuh: string
  Syuruq: string
  Dzuhur: string
  Ashar: string
  Maghrib: string
  Isya: string
}

/** Jeda (menit) hitung mundur antara adzan dan iqomah per sholat. */
export interface Iqomah {
  Subuh: number
  Dzuhur: number
  Ashar: number
  Maghrib: number
  Isya: number
}

export interface Config {
  name: string
  loc: string
  /** URL gambar/video latar (dari backend), atau link YouTube. */
  bg: string
  bgType: BgType
  /** Daftar URL gambar slideshow (dari backend). */
  slides: string[]
  slideSec: number
  temp: string
  cond: string
  ico: string
  autoWeather: boolean
  autoPrayer: boolean
  method: string
  lat: string
  lon: string
  ticker: string
  times: PrayerTimes
  iqomah: Iqomah
}

export const PRAYER_NAMES: (keyof PrayerTimes)[] = [
  'Subuh',
  'Syuruq',
  'Dzuhur',
  'Ashar',
  'Maghrib',
  'Isya',
]

/** Sholat yang punya jeda iqomah (Syuruq bukan waktu sholat). */
export const IQOMAH_NAMES: (keyof Iqomah)[] = [
  'Subuh',
  'Dzuhur',
  'Ashar',
  'Maghrib',
  'Isya',
]

export const DEFAULT: Config = {
  name: 'Masjid Baitusy Syifa',
  loc: 'Jakarta Timur',
  bg: '',
  bgType: 'slideshow',
  slides: [],
  slideSec: 6,
  temp: '28°C',
  cond: 'CERAH',
  ico: '☀️',
  autoWeather: true,
  autoPrayer: true,
  method: '20',
  lat: '-6.2227',
  lon: '106.9300',
  ticker:
    'Selamat datang di Masjid Baitusy Syifa, Jakarta Timur. Mohon nonaktifkan HP saat beribadah. Jagalah kebersihan dan ketertiban bersama.',
  times: { Subuh: '', Syuruq: '', Dzuhur: '', Ashar: '', Maghrib: '', Isya: '' },
  iqomah: { Subuh: 10, Dzuhur: 10, Ashar: 10, Maghrib: 5, Isya: 10 },
}

// Cache config terakhir dari server, agar layar langsung tampil saat dibuka
// (sebelum request ke backend selesai). Sumber kebenaran tetap backend.
const CACHE_KEY = 'masjidCfgCache_v1'

export function loadConfig(): Config {
  try {
    const parsed = JSON.parse(localStorage.getItem(CACHE_KEY) || '{}')
    return {
      ...DEFAULT,
      ...parsed,
      times: { ...DEFAULT.times, ...(parsed.times || {}) },
      iqomah: { ...DEFAULT.iqomah, ...(parsed.iqomah || {}) },
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function cacheConfig(cfg: Config): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cfg))
  } catch {
    /* abaikan */
  }
}
