// Ambil ID video (11 karakter) dari berbagai bentuk URL YouTube.
export function youtubeId(url: string): string {
  if (!url) return ''
  const m = url.match(
    /(?:youtu\.be\/|v=|\/live\/|\/embed\/|\/shorts\/)([A-Za-z0-9_-]{11})/,
  )
  return m ? m[1] : url.length === 11 ? url : ''
}

export function isYoutube(url: string): boolean {
  return /youtube\.com|youtu\.be/i.test(url || '')
}
