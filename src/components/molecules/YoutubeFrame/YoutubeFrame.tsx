import { useEffect, useRef, useState } from 'react'
import type { YtPlayer } from '../../../lib/youtube'
import {
  canPlayYoutube,
  loadYoutubeApi,
  youtubeEmbedUrl,
  youtubeId,
} from '../../../lib/youtube'
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

/** Player state dari YouTube iframe API. */
const UNSTARTED = -1
const ENDED = 0
const PLAYING = 1
const PAUSED = 2
const CUED = 5

/** Jarak antar handshake 'listening' selama player belum menjawab (ms). */
const HALO_TIAP = 1000

/** Jarak antar pengecekan state player lewat IFrame API resmi (ms). */
const PANTAU_TIAP = 1000

/**
 * Jeda minimal antar tahap pemulihan: lama menunggu apakah perintah sebelumnya
 * digubris player sebelum naik ke cara yang lebih keras (ms).
 */
const JEDA_PULIH = 4000

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
 *
 * Akhir video dideteksi lewat DUA jalur, karena browser bawaan smart TV sering
 * tidak menjawab handshake `listening` yang ditulis tangan — kalau itu satu-
 * satunya jalur, video berhenti di layar akhir dan tidak pernah mengulang:
 *
 *  1. Event `onStateChange` dari handshake manual (cepat, tapi bisa tidak
 *     pernah datang).
 *  2. IFrame Player API resmi YouTube ditempelkan ke iframe yang sama, lalu
 *     `getPlayerState()` ditanya tiap detik. Tidak bergantung event sama
 *     sekali, jadi tetap jalan saat jalur 1 diam.
 *
 * Pemulihannya bertahap, tiap tahap diberi JEDA_PULIH untuk membuktikan diri:
 * seekTo(0)+playVideo -> loadVideoById (untuk player yang mengabaikan seek dari
 * layar "tonton lagi") -> muat ulang iframe sebagai jalan terakhir.
 */
function YoutubeFrame({ url, sound, title, className, fill }: YoutubeFrameProps) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  // Mulai selalu muted agar autoplay pasti jalan; di-set false saat suara
  // diaktifkan + ada izin (flag kiosk / interaksi user) -> iframe reload.
  const [ytMuted, setYtMuted] = useState(true)
  // Dinaikkan untuk memaksa iframe dimuat ulang (jalan terakhir bila perintah
  // putar-ulang tidak digubris player).
  const [reload, setReload] = useState(0)

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

  // Jaga video tetap berputar: deteksi akhir video lalu ulang dari awal.
  // `ytMuted` dan `reload` ikut jadi dependensi karena keduanya me-remount
  // iframe (lihat `key`) — handshake dan player API harus dipasang ulang ke
  // iframe yang baru.
  useEffect(() => {
    if (!ytId) return
    const frame = frameRef.current
    if (!frame) return

    let lepas = false
    let terhubung = false
    let player: YtPlayer | null = null
    // Tahap pemulihan yang akan dijalankan saat akhir video terdeteksi.
    let tahap = 0
    let pulihTerakhir = 0

    // —— jalur 1: handshake manual ——
    // Handshake hanya nyangkut kalau dokumen player di dalam iframe sudah
    // jalan — di browser TV yang lambat itu bisa lewat dari beberapa detik
    // pertama, jadi dikirim ulang sampai player menjawab dan tiap iframe
    // selesai load.
    const halo = () =>
      frame.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening', id: ytId, channel: 'widget' }),
        '*',
      )

    halo()
    frame.addEventListener('load', halo)
    const haloTimer = setInterval(() => {
      if (!terhubung) halo()
    }, HALO_TIAP)

    // Video terbukti jalan lagi -> eskalasi pemulihan direset dari awal.
    const jalanLagi = () => {
      tahap = 0
      pulihTerakhir = 0
    }

    // Naik satu tahap tiap kali dipanggil, tapi paling cepat tiap JEDA_PULIH
    // supaya perintah sebelumnya punya waktu untuk bekerja.
    const pulihkan = () => {
      const kini = Date.now()
      if (kini - pulihTerakhir < JEDA_PULIH) return
      pulihTerakhir = kini

      if (tahap === 0) {
        tahap = 1
        if (player) {
          player.seekTo(0, true)
          player.playVideo()
        } else {
          ytCommand(frame, 'seekTo', [0, true])
          ytCommand(frame, 'playVideo')
        }
        return
      }

      if (tahap === 1) {
        tahap = 2
        // Sebagian player mengabaikan seekTo dari state ENDED (mis. saat layar
        // "tonton lagi" sudah muncul); memuat ulang video id-nya selalu
        // dimulai dari awal.
        if (player) player.loadVideoById(ytId)
        else ytCommand(frame, 'loadVideoById', [ytId])
        return
      }

      // Player tidak menggubris perintah apa pun: muat ulang iframe —
      // autoplay membuatnya mulai lagi dari awal.
      setReload((n) => n + 1)
    }

    const onMessage = (e: MessageEvent) => {
      if (!dariYoutube(e.origin) || e.source !== frame.contentWindow) return

      let data: { event?: string; info?: unknown }
      try {
        data = typeof e.data === 'string' ? JSON.parse(e.data) : e.data
      } catch {
        return // pesan non-JSON dari player, abaikan
      }

      // Pesan apa pun dari player membuktikan handshake sudah nyangkut.
      terhubung = true
      if (data?.event !== 'onStateChange') return

      // Bentuk `info` berbeda antar versi player: angka polos, atau objek.
      const state =
        typeof data.info === 'number'
          ? data.info
          : (data.info as { playerState?: number } | null)?.playerState

      if (state === PLAYING) jalanLagi()
      else if (state === ENDED) pulihkan()
    }

    window.addEventListener('message', onMessage)

    // —— jalur 2: IFrame API resmi, ditanyai berkala ——
    let pantauTimer: ReturnType<typeof setInterval> | undefined

    const pantau = () => {
      if (!player) return
      let state: number
      try {
        state = player.getPlayerState()
      } catch {
        return // player belum siap menjawab
      }

      if (state === PLAYING) {
        jalanLagi()
        return
      }
      if (state === ENDED) {
        pulihkan()
        return
      }
      // Berhenti tanpa sebab (TV kadang mem-pause sendiri saat kehabisan
      // buffer): dorong jalan lagi, tanpa menaikkan tahap eskalasi.
      if (state === PAUSED || state === CUED || state === UNSTARTED) {
        player.playVideo()
      }
    }

    loadYoutubeApi()
      .then((YT) => {
        if (lepas) return
        player = new YT.Player(frame, {
          events: {
            onReady: () => {
              if (!lepas) player?.playVideo()
            },
          },
        })
        pantauTimer = setInterval(pantau, PANTAU_TIAP)
      })
      .catch(() => {
        // API resmi tidak tersedia (offline / diblokir): jalur handshake
        // manual di atas tetap jalan sendiri.
      })

    return () => {
      lepas = true
      clearInterval(haloTimer)
      if (pantauTimer !== undefined) clearInterval(pantauTimer)
      frame.removeEventListener('load', halo)
      window.removeEventListener('message', onMessage)
      player = null
    }
  }, [ytId, ytMuted, reload])

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
      key={`${ytId}-${muted ? 'm' : 's'}-${reload}`}
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
