import type { Config } from './config'

// Pemetaan kode cuaca WMO (Open-Meteo) -> [kondisi, ikon].
export function weatherInfo(code: number, isDay: boolean): [string, string] {
  const sun = isDay ? '☀️' : '🌙'
  const map: Record<number, [string, string]> = {
    0: [isDay ? 'CERAH' : 'CERAH MALAM', sun],
    1: ['CERAH BERAWAN', isDay ? '🌤️' : '🌙'],
    2: ['BERAWAN SEBAGIAN', '⛅'],
    3: ['BERAWAN', '☁️'],
    45: ['BERKABUT', '🌫️'],
    48: ['BERKABUT', '🌫️'],
    51: ['GERIMIS', '🌦️'],
    53: ['GERIMIS', '🌦️'],
    55: ['GERIMIS', '🌦️'],
    56: ['GERIMIS', '🌦️'],
    57: ['GERIMIS', '🌦️'],
    61: ['HUJAN RINGAN', '🌧️'],
    63: ['HUJAN', '🌧️'],
    65: ['HUJAN LEBAT', '🌧️'],
    66: ['HUJAN', '🌧️'],
    67: ['HUJAN', '🌧️'],
    71: ['SALJU', '❄️'],
    73: ['SALJU', '❄️'],
    75: ['SALJU', '❄️'],
    77: ['SALJU', '❄️'],
    80: ['HUJAN', '🌧️'],
    81: ['HUJAN LEBAT', '🌧️'],
    82: ['HUJAN LEBAT', '🌧️'],
    85: ['HUJAN SALJU', '🌨️'],
    86: ['HUJAN SALJU', '🌨️'],
    95: ['BADAI PETIR', '⛈️'],
    96: ['BADAI PETIR', '⛈️'],
    99: ['BADAI PETIR', '⛈️'],
  }
  return map[code] || ['—', sun]
}

export interface WeatherResult {
  temp: string
  cond: string
  ico: string
}

// Ambil cuaca dari Open-Meteo (gratis, tanpa API key). null bila gagal/offline.
export async function fetchWeather(
  cfg: Config,
): Promise<WeatherResult | null> {
  if (!cfg.autoWeather || !cfg.lat || !cfg.lon) return null
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${cfg.lat}&longitude=${cfg.lon}&current=temperature_2m,weather_code,is_day&timezone=auto`
    const res = await fetch(url)
    const data = await res.json()
    const cur = data.current
    if (!cur) return null
    const [cond, ico] = weatherInfo(cur.weather_code, cur.is_day === 1)
    return { temp: Math.round(cur.temperature_2m) + '°C', cond, ico }
  } catch {
    return null
  }
}
