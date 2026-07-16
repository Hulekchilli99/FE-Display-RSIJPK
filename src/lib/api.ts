// Klien API ke backend Laravel (Masjid RSIJPK).
import type { Config } from './config'

// Origin backend. Default: SAMA dengan origin halaman (same-origin), karena Apache
// vhost frontend mem-proxy /api dan /storage ke backend. Jadi jalan dari LAN
// maupun publik dengan satu port, tanpa CORS. Override pakai VITE_API_URL bila perlu.
function backendOrigin(): string {
  const env = import.meta.env.VITE_API_URL
  if (env) return env.replace(/\/api\/?$/, '')
  return '' // same-origin (relatif)
}

const ORIGIN = backendOrigin()
const BASE = `${ORIGIN}/api`
const TOKEN_KEY = 'masjidToken'

/**
 * Normalisasi URL media absolut dari backend (mis. http://10.12.12.10:8081/storage/..)
 * agar memakai origin yang sama dengan halaman (di-proxy Apache). Link non-storage
 * (YouTube/eksternal) dibiarkan apa adanya.
 */
function fixMediaUrl(u: string): string {
  if (!u) return u
  const i = u.indexOf('/storage/')
  return i >= 0 ? ORIGIN + u.slice(i) : u
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export function isAuthed(): boolean {
  return !!getToken()
}

function authHeaders(): Record<string, string> {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

// Endpoint config: 'masjid' tetap memakai /config (lama, tidak breaking),
// slug lain memakai /config/{slug}.
function configPath(slug: string): string {
  return slug === 'masjid' ? `${BASE}/config` : `${BASE}/config/${slug}`
}

/** Baca config sebuah display (publik, tanpa login). */
export async function apiGetConfig(slug = 'masjid'): Promise<Config> {
  const r = await fetch(configPath(slug), { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Gagal memuat pengaturan dari server.')
  const cfg = (await r.json()) as Config
  // Samakan host URL media dengan host API (LAN/publik).
  if (cfg.bgType !== 'youtube') cfg.bg = fixMediaUrl(cfg.bg)
  cfg.slides = (cfg.slides || []).map(fixMediaUrl)
  cfg.leftSlides = (cfg.leftSlides || []).map(fixMediaUrl)
  return cfg
}

/** Login admin -> simpan token. */
export async function apiLogin(email: string, password: string): Promise<void> {
  const r = await fetch(`${BASE}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!r.ok) throw new Error('Email atau password salah.')
  const data = await r.json()
  setToken(data.token)
}

export async function apiLogout(): Promise<void> {
  try {
    await fetch(`${BASE}/logout`, {
      method: 'POST',
      headers: { Accept: 'application/json', ...authHeaders() },
    })
  } catch {
    /* abaikan */
  }
  setToken(null)
}

/** Simpan config sebuah display (perlu login). */
export async function apiUpdateConfig(cfg: Partial<Config>, slug = 'masjid'): Promise<Config> {
  const r = await fetch(configPath(slug), {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', ...authHeaders() },
    body: JSON.stringify(cfg),
  })
  if (r.status === 401) {
    setToken(null)
    throw new Error('Sesi login habis. Silakan login lagi.')
  }
  if (!r.ok) throw new Error('Gagal menyimpan pengaturan.')
  return r.json()
}

/** Ubah response gagal jadi pesan yang jelas (termasuk kasus file kebesaran). */
async function uploadError(r: Response, fallback: string): Promise<Error> {
  if (r.status === 413) {
    return new Error('Ukuran file terlalu besar untuk server. Pakai gambar lebih kecil.')
  }
  if (r.status === 401) {
    setToken(null)
    return new Error('Sesi login habis. Silakan login lagi.')
  }
  try {
    const data = await r.json()
    if (data?.message) return new Error(data.message)
  } catch {
    /* abaikan */
  }
  return new Error(fallback)
}

/** Upload satu gambar/video latar -> { url, type }. */
export async function apiUploadMedia(file: File): Promise<{ url: string; type: string }> {
  const fd = new FormData()
  fd.append('file', file)
  const r = await fetch(`${BASE}/media`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: fd,
  })
  if (!r.ok) throw await uploadError(r, 'Gagal mengupload file.')
  return r.json()
}

/** Upload banyak gambar slideshow -> daftar URL. */
export async function apiUploadSlides(files: File[]): Promise<string[]> {
  const fd = new FormData()
  files.forEach((f) => fd.append('files[]', f))
  const r = await fetch(`${BASE}/slides`, {
    method: 'POST',
    headers: { Accept: 'application/json', ...authHeaders() },
    body: fd,
  })
  if (!r.ok) throw await uploadError(r, 'Gagal mengupload gambar slideshow.')
  const data = await r.json()
  return data.urls as string[]
}

/**
 * Upload beberapa video (playlist Walidah) -> daftar URL, urut sesuai pilihan.
 * Dikirim satu per satu lewat endpoint /media karena file video besar;
 * `onProgress` dipanggil sebelum tiap file agar panel bisa menampilkan status.
 */
export async function apiUploadVideos(
  files: File[],
  onProgress?: (index: number, total: number) => void,
): Promise<string[]> {
  const urls: string[] = []
  for (let i = 0; i < files.length; i++) {
    onProgress?.(i, files.length)
    const { url } = await apiUploadMedia(files[i])
    urls.push(url)
  }
  return urls
}
