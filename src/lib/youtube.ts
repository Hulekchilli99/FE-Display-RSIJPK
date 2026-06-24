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

// URL embed untuk iframe latar/looping. Default mute=1: autoplay bersuara
// diblokir browser sebelum ada interaksi user; reload dengan mute=0 di dalam
// window "user activation" untuk mengaktifkan suara.
export function youtubeEmbedUrl(id: string, muted: boolean): string {
  const origin = encodeURIComponent(location.origin)
  const mute = muted ? 1 : 0
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${mute}&controls=0&rel=0&playsinline=1&loop=1&playlist=${id}&origin=${origin}&enablejsapi=1`
}
