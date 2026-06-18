import { DEFAULT_SLIDES } from '../assets/slides'

export type BgType = 'image' | 'slideshow' | 'video' | 'youtube'

export interface PrayerTimes {
  Subuh: string
  Syuruq: string
  Dzuhur: string
  Ashar: string
  Maghrib: string
  Isya: string
}

export interface Config {
  name: string
  loc: string
  /** Image/video URL, or "idb" when stored in IndexedDB. */
  bg: string
  bgType: BgType
  /** Slideshow image URLs (used when slidesIdb is false). */
  slides: string[]
  /** True when slideshow images are stored in IndexedDB under "slides". */
  slidesIdb: boolean
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
}

export const PRAYER_NAMES: (keyof PrayerTimes)[] = [
  'Subuh',
  'Syuruq',
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
  slides: DEFAULT_SLIDES,
  slidesIdb: false,
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
}

const CFG_KEY = 'masjidCfg_v4'

export function loadConfig(): Config {
  try {
    const parsed = JSON.parse(localStorage.getItem(CFG_KEY) || '{}')
    return {
      ...DEFAULT,
      ...parsed,
      times: { ...DEFAULT.times, ...(parsed.times || {}) },
    }
  } catch {
    return { ...DEFAULT }
  }
}

export function saveConfig(cfg: Config): void {
  try {
    localStorage.setItem(CFG_KEY, JSON.stringify(cfg))
  } catch {
    /* cfg kecil, jarang gagal */
  }
}
