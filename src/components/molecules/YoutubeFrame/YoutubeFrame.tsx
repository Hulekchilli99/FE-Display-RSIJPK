import { useEffect, useRef, useState } from 'react'
import { canPlayYoutube, youtubeEmbedUrl, youtubeId } from '../../../lib/youtube'
import styles from './YoutubeFrame.module.css'

export interface YoutubeFrameProps {
  /** Link YouTube apa adanya dari config (live / video / shorts). */
  url: string
  /** Putar dengan suara bila browser mengizinkan. */
  sound: boolean
  /** Judul iframe, untuk pembeda saat ada lebih dari satu player. */
  title: string
  /** Kelas penempatan dari layout induk. */
  className?: string
  /**
   * Besarkan iframe sampai menutupi layar supaya tidak ada pita hitam di tepi
   * (tepi video yang lewat batas dipotong induk). Hanya untuk frame yang
   * memenuhi layar — ukurannya berbasis vw/vh.
   */
  fill?: boolean
}

// Kirim perintah ke player YouTube lewat postMessage (butuh enablejsapi=1).
function ytCommand(frame: HTMLIFrameElement, func: string, args: unknown[] = []) {
  frame.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*',
  )
}

/** Player state dari YouTube iframe API: video selesai diputar. */
const ENDED = 0

/** Pesan hanya dipercaya bila datang dari domain player YouTube. */
function dariYoutube(origin: string): boolean {
  return (
    origin === 'https://www.youtube-nocookie.com' ||
    origin === 'https://www.youtube.com'
  )
}

/**
 * Player YouTube full-bleed untuk layar display (latar masjid, MCU kolom kanan,
 * Walidah satu frame penuh). Mengembalikan null bila link tidak valid atau
 * halaman dibuka lewat file:// — induk yang menampilkan pesan penggantinya.
 *
 * Looping diurus di sini lewat JS API (tangkap state ENDED -> putar lagi dari
 * awal), bukan lewat `loop=1&playlist=<id>` di URL embed. Alasannya ada di
 * catatan `youtubeEmbedUrl()`: parameter playlist bikin video unlisted ditolak
 * YouTube. Live stream tidak pernah mengirim ENDED, jadi tidak terpengaruh.
 */
function YoutubeFrame({ url, sound, title, className, fill }: YoutubeFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  // Mulai selalu muted agar autoplay pasti jalan; di-set false saat suara
  // diaktifkan + ada izin (flag kiosk / interaksi user) -> iframe reload.
  const [ytMuted, setYtMuted] = useState(true)

  const ytId = youtubeId(url)

  // Saat ganti video / matikan suara: kembali ke kondisi muted (autoplay aman).
  // Disetel saat render, bukan lewat efek, supaya tidak ada satu frame yang
  // sempat dirender dengan status mute lama (iframe ikut reload tiap ganti).
  const stateKey = `${ytId}|${sound}`
  const [prevKey, setPrevKey] = useState(stateKey)
  if (prevKey !== stateKey) {
    setPrevKey(stateKey)
    setYtMuted(true)
  }

  // Ulang dari awal saat video selesai. Player baru mengirim event setelah
  // menerima handshake 'listening', dan handshake itu hanya nyangkut kalau
  // iframe-nya sudah siap — karena itu dikirim beberapa kali. `muted` ikut jadi
  // dependensi: mengubahnya me-remount iframe (lihat `key`), jadi handshake-nya
  // harus diulang ke player yang baru.
  useEffect(() => {
    if (!ytId) return
    const frame = frameRef.current
    if (!frame) return

    const halo = () =>
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: ytId, channel: 'widget' }),
        '*',
      )
    const timers = [0, 500, 1500, 3000].map((ms) => setTimeout(halo, ms))

    const onMessage = (e: MessageEvent) => {
      if (!dariYoutube(e.origin) || e.source !== frame.contentWindow) return

      let data: { event?: string; info?: unknown }
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return // pesan non-JSON dari player, abaikan
      }
      if (data?.event !== 'onStateChange') return

      // Bentuk `info` berbeda antar versi player: angka polos, atau objek.
      const state =
        typeof data.info === 'number'
          ? data.info
          : (data.info as { playerState?: number } | null)?.playerState
      if (state !== ENDED) return

      ytCommand(frame, 'seekTo', [0, true])
      ytCommand(frame, 'playVideo')
    }

    window.addEventListener('message', onMessage)
    return () => {
      timers.forEach(clearTimeout)
      window.removeEventListener('message', onMessage)
    }
  }, [ytId, ytMuted, sound])

  // Aktifkan suara saat `sound` aktif: coba via API (jalur kiosk), lalu reload
  // iframe tanpa mute pada interaksi user pertama (jalur paling andal).
  useEffect(() => {
    if (!ytId || !sound) return

    const tryApiUnmute = () => {
      const f = frameRef.current
      if (!f) return
      ytCommand(f, 'unMute')
      ytCommand(f, 'setVolume', [100])
      ytCommand(f, 'playVideo')
    }
    const timers = ytMuted
      ? [600, 1500, 3000].map((ms) => setTimeout(tryApiUnmute, ms))
      : []

    const events: (keyof DocumentEventMap)[] = ['pointerdown', 'touchstart', 'keydown']
    const onInteract = () => setYtMuted(false)
    if (ytMuted) {
      events.forEach((e) => document.addEventListener(e, onInteract, { once: true }))
    }

    return () => {
      timers.forEach(clearTimeout)
      events.forEach((e) => document.removeEventListener(e, onInteract))
    }
  }, [ytId, sound, ytMuted])

  if (!canPlayYoutube(url)) return null

  const muted = !sound || ytMuted

  return (
    <iframe
      key={`${ytId}-${muted ? 'm' : 's'}`}
      ref={frameRef}
      className={[styles.frame, fill && styles.fill, className]
        .filter(Boolean)
        .join(' ')}
      src={youtubeEmbedUrl(ytId, muted)}
      allow="autoplay; encrypted-media"
      allowFullScreen
      title={title}
    />
  )
}

export default YoutubeFrame
