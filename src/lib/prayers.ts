import type { Config, PrayerTimes } from './config'
import { PRAYER_NAMES } from './config'

const pad = (n: number) => String(n).padStart(2, '0')

// Ambil jadwal sholat dari Aladhan (gratis, tanpa API key). null bila gagal.
export async function fetchPrayers(cfg: Config): Promise<PrayerTimes | null> {
  if (!cfg.autoPrayer || !cfg.lat || !cfg.lon) return null
  try {
    const d = new Date()
    const date = `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`
    const url = `https://api.aladhan.com/v1/timings/${date}?latitude=${cfg.lat}&longitude=${cfg.lon}&method=${cfg.method || 20}`
    const res = await fetch(url)
    const data = await res.json()
    const t = data.data && data.data.timings
    if (!t) return null
    const clean = (s: string) => (s || '').split(' ')[0] // buang "(WIB)" dll
    return {
      Subuh: clean(t.Fajr),
      Syuruq: clean(t.Sunrise),
      Dzuhur: clean(t.Dhuhr),
      Ashar: clean(t.Asr),
      Maghrib: clean(t.Maghrib),
      Isya: clean(t.Isha),
    }
  } catch {
    return null
  }
}

// Syuruq (terbit matahari) hanya penanda, bukan waktu sholat -> tak di-highlight.
const ACTIVE_NAMES = PRAYER_NAMES.filter((n) => n !== 'Syuruq')

// Sholat yang sedang berlangsung: waktu terdekat yang sudah lewat hari ini.
export function activePrayer(times: PrayerTimes, now: Date): string | null {
  const nowMin = now.getHours() * 60 + now.getMinutes()
  let active: string | null = null
  let bestDiff = Infinity
  for (const n of ACTIVE_NAMES) {
    const t = times[n]
    if (!t) continue
    const [h, m] = t.split(':').map(Number)
    const diff = nowMin - (h * 60 + m)
    if (diff >= 0 && diff < bestDiff) {
      bestDiff = diff
      active = n
    }
  }
  return active
}
