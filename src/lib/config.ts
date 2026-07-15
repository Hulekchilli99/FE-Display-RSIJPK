export type BgType = 'image' | 'slideshow' | 'video' | 'youtube'

/**
 * Design tampilan: masjid (sidebar + jadwal sholat) atau mcu (split layar).
 * Satu design bisa dipakai beberapa unit — lihat DISPLAYS.
 */
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
  /** Identifier unit/display di backend (mis. 'masjid', 'mcu', 'poli'). */
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

export interface Display {
  /** Kunci config unit di backend, dipakai di URL `?display=`. */
  slug: string
  /** Nama unit untuk judul panel & default "Nama Unit". */
  name: string
  icon: string
  /** Design yang dipakai unit ini. Beberapa unit boleh berbagi design. */
  type: DisplayType
}

/**
 * Daftar unit display yang tersedia (untuk switcher di panel pengaturan).
 * Menambah unit baru cukup menambah satu baris di sini — backend membuat
 * baris config-nya otomatis saat admin pertama kali menyimpan.
 */
export const DISPLAYS: Display[] = [
  { slug: 'masjid', name: 'Masjid', icon: '🕌', type: 'masjid' },
  { slug: 'mcu', name: 'MCU', icon: '🏥', type: 'mcu' },
  { slug: 'poli', name: 'Poli', icon: '🩺', type: 'mcu' },
]

/** Unit bawaan bila slug tidak dikenal. */
const FALLBACK: Display = DISPLAYS[0]

/** Data unit untuk sebuah slug. */
export function displayFor(slug: string): Display {
  return DISPLAYS.find((d) => d.slug === slug) ?? FALLBACK
}

/** Slug display yang sedang dibuka layar ini, dari URL `?display=`. */
export function currentSlug(): string {
  const p = new URLSearchParams(location.search).get('display')
  return DISPLAYS.some((d) => d.slug === p) ? p! : FALLBACK.slug
}

/** URL untuk berpindah ke display lain (masjid = tanpa query). */
export function displayUrl(slug: string): string {
  const u = new URL(location.href)
  if (slug === FALLBACK.slug) u.searchParams.delete('display')
  else u.searchParams.set('display', slug)
  return u.pathname + u.search
}

// Cache config terakhir dari server, agar layar langsung tampil saat dibuka
// (sebelum request ke backend selesai). Sumber kebenaran tetap backend.
// Per-slug agar config antar unit tidak saling menimpa.
const CACHE_PREFIX = 'masjidCfgCache_v1'
const cacheKey = (slug: string) => `${CACHE_PREFIX}:${slug}`

export function loadConfig(slug: string = currentSlug()): Config {
  const d = displayFor(slug)
  const seed: Config = {
    ...DEFAULT,
    type: d.type,
    slug: d.slug,
    // DEFAULT.name adalah nama lengkap masjid; unit lain pakai nama unitnya
    // sampai config dari backend datang.
    name: d.slug === FALLBACK.slug ? DEFAULT.name : d.name,
  }
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
