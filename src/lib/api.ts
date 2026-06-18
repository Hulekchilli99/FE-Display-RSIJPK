// Klien API ke backend Laravel (Masjid RSIJPK).
import type { Config } from './config'

const BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api'
const TOKEN_KEY = 'masjidToken'

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

/** Baca config global (publik, tanpa login). */
export async function apiGetConfig(): Promise<Config> {
  const r = await fetch(`${BASE}/config`, { headers: { Accept: 'application/json' } })
  if (!r.ok) throw new Error('Gagal memuat pengaturan dari server.')
  return r.json()
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

/** Simpan config (perlu login). */
export async function apiUpdateConfig(cfg: Partial<Config>): Promise<Config> {
  const r = await fetch(`${BASE}/config`, {
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
