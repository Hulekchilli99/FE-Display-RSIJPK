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

/** Bagian kecil dari YT.Player yang dipakai layar ini. */
export interface YtPlayer {
  getPlayerState(): number
  playVideo(): void
  seekTo(seconds: number, allowSeekAhead: boolean): void
  loadVideoById(videoId: string): void
  unMute(): void
  setVolume(volume: number): void
}

interface YtApi {
  Player: new (
    el: HTMLElement,
    opts: { events?: { onReady?: () => void } },
  ) => YtPlayer
}

declare global {
  interface Window {
    YT?: YtApi
    onYouTubeIframeAPIReady?: () => void
  }
}

const API_SRC = 'https://www.youtube.com/iframe_api'

/** Batas tunggu script API sebelum dianggap gagal (ms). */
const API_BATAS = 10000

let apiPromise: Promise<YtApi> | null = null

/**
 * Muat IFrame Player API resmi YouTube (sekali saja untuk seluruh halaman).
 *
 * Dipakai sebagai pengawas looping: handshake `postMessage` yang ditulis
 * tangan kadang tidak pernah dijawab player di browser bawaan smart TV,
 * sehingga event `onStateChange` tak sampai dan video berhenti di layar akhir.
 * Script resmi punya handshake sendiri yang lebih sabar, plus `getPlayerState()`
 * yang bisa ditanya kapan saja tanpa menunggu event.
 *
 * Bila gagal (TV offline dari domain youtube.com, script diblokir), promise-nya
 * ditolak dan pemanggil kembali ke jalur postMessage manual.
 */
export function loadYoutubeApi(): Promise<YtApi> {
  if (window.YT?.Player) return Promise.resolve(window.YT)
  if (apiPromise) return apiPromise

  apiPromise = new Promise<YtApi>((resolve, reject) => {
    const sebelumnya = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      sebelumnya?.()
      if (window.YT?.Player) resolve(window.YT)
      else reject(new Error('YT.Player tidak tersedia'))
    }

    if (!document.querySelector(`script[src="${API_SRC}"]`)) {
      const el = document.createElement('script')
      el.src = API_SRC
      el.async = true
      el.onerror = () => reject(new Error('script IFrame API gagal dimuat'))
      document.head.appendChild(el)
    }

    setTimeout(() => reject(new Error('IFrame API tidak kunjung siap')), API_BATAS)
  })

  // Gagal sekali jangan mengunci selamanya: percobaan berikutnya boleh menunggu
  // lagi (script-nya mungkin baru sampai setelah jaringan TV siap).
  apiPromise.catch(() => {
    apiPromise = null
  })

  return apiPromise
}
