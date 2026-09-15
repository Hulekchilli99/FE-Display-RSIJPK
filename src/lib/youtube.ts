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

/**
 * Link YouTube yang benar-benar bisa diputar di halaman ini. Iframe YouTube
 * diblokir saat halaman dibuka lewat `file://`, jadi layar harus menampilkan
 * pesan pengganti alih-alih frame kosong.
 */
export function canPlayYoutube(url: string): boolean {
  return !!youtubeId(url) && location.protocol !== 'file:'
}

// URL embed untuk iframe latar/looping. Default mute=1: autoplay bersuara
// diblokir browser sebelum ada interaksi user; reload dengan mute=0 di dalam
// window "user activation" untuk mengaktifkan suara.
//
// Sengaja TANPA `loop=1&playlist=<id>`, trik looping yang lazim dipakai:
// `playlist=` membuat player memperlakukan video sebagai playlist, dan playlist
// YouTube hanya menerima video PUBLIK. Video **unlisted** ditolak dengan pesan
// "This video is unavailable" — padahal embed biasa video yang sama jalan
// normal. Looping ditangani lewat JS API saja (lihat YoutubeFrame), yang bekerja
// untuk video publik maupun unlisted.
export function youtubeEmbedUrl(id: string, muted: boolean): string {
  const origin = encodeURIComponent(location.origin)
  const mute = muted ? 1 : 0
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${mute}&controls=0&rel=0&playsinline=1&origin=${origin}&enablejsapi=1`
}
