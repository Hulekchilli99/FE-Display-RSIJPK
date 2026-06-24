export type BgType = 'image' | 'slideshow' | 'video' | 'youtube'

/** Jenis tampilan: masjid (sidebar + jadwal sholat) atau mcu (split layar). */
export type DisplayType = 'masjid' | 'mcu'

/** Isi footer biru bawah (layout MCU). */
export interface Footer {
  name: string
  address: string
  phone: string
  website: string
}

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
  /** Penanda design yang dipakai layar. */
  type: DisplayType
  /** Identifier unit/display di backend (mis. 'masjid', 'mcu'). */
  slug: string
  name: string
  loc: string
  /** URL gambar/video latar (dari backend), atau link YouTube. */
  bg: string
  bgType: BgType
  /** Daftar URL gambar slideshow (dari backend). */
  slides: string[]
  slideSec: number
  /** Putar audio YouTube latar (live/video). Default mati. */
  ytSound: boolean
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
  /** MCU — kolom kiri: slideshow gambar. */
  leftSlides: string[]
  leftSlideSec: number
  /** MCU — kolom kanan: URL video/live YouTube. */
  rightYoutube: string
  rightSound: boolean
  /** MCU — footer biru bawah. */
  footerOn: boolean
  footer: Footer
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
  type: 'masjid',
  slug: 'masjid',
  name: 'Masjid Baitusy Syifa',
  loc: 'Jakarta Timur',
  bg: '',
  bgType: 'slideshow',
  slides: [],
  slideSec: 6,
  ytSound: false,
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
  leftSlides: [],
  leftSlideSec: 6,
  rightYoutube: '',
  rightSound: false,
  footerOn: false,
  footer: { name: '', address: '', phone: '', website: '' },
}

/** Daftar display yang tersedia (untuk switcher di panel pengaturan). */
export const DISPLAYS: { slug: string; label: string }[] = [
  { slug: 'masjid', label: '🕌 Masjid' },
  { slug: 'mcu', label: '🏥 MCU' },
]

/** Slug display yang sedang dibuka layar ini, dari URL `?display=`. */
export function currentSlug(): string {
  const p = new URLSearchParams(location.search).get('display')
  return p === 'mcu' ? 'mcu' : 'masjid'
}

/** URL untuk berpindah ke display lain (masjid = tanpa query). */
export function displayUrl(slug: string): string {
  const u = new URL(location.href)
  if (slug === 'masjid') u.searchParams.delete('display')
  else u.searchParams.set('display', slug)
  return u.pathname + u.search
}

/** Tipe display bawaan untuk sebuah slug (sebelum data backend tersedia). */
function defaultType(slug: string): DisplayType {
  return slug === 'mcu' ? 'mcu' : 'masjid'
}

// Cache config terakhir dari server, agar layar langsung tampil saat dibuka
// (sebelum request ke backend selesai). Sumber kebenaran tetap backend.
// Per-slug agar tampilan masjid & mcu tidak saling menimpa.
const CACHE_PREFIX = 'masjidCfgCache_v1'
const cacheKey = (slug: string) => `${CACHE_PREFIX}:${slug}`

export function loadConfig(slug: string = currentSlug()): Config {
  const seed: Config = { ...DEFAULT, type: defaultType(slug), slug }
  try {
    const parsed = JSON.parse(localStorage.getItem(cacheKey(slug)) || '{}')
    return {
      ...seed,
      ...parsed,
      times: { ...DEFAULT.times, ...(parsed.times || {}) },
      iqomah: { ...DEFAULT.iqomah, ...(parsed.iqomah || {}) },
      footer: { ...DEFAULT.footer, ...(parsed.footer || {}) },
    }
  } catch {
    return seed
  }
}

export function cacheConfig(cfg: Config, slug: string = currentSlug()): void {
  try {
    localStorage.setItem(cacheKey(slug), JSON.stringify(cfg))
  } catch {
    /* abaikan */
  }
}
