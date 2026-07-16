import { useEffect, useRef, useState } from 'react'
import type { Config } from '../../../lib/config'
import { DisplayFooter } from '../../molecules/DisplayFooter'
import styles from './WalidahScreen.module.css'

export interface WalidahScreenProps {
  cfg: Config
}

/**
 * Tampilan unit Walidah: satu frame penuh berisi video upload, plus footer
 * biru opsional. Bila video lebih dari satu, diputar bergantian berurutan dan
 * kembali ke video pertama setelah yang terakhir selesai.
 */
function WalidahScreen({ cfg }: WalidahScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  // Video yang sedang diputar (indeks dalam cfg.videos).
  const [idx, setIdx] = useState(0)
  // Mulai selalu muted agar autoplay pasti jalan; baru unmute saat suara
  // diaktifkan dan browser mengizinkan (flag kiosk / interaksi user).
  const [muted, setMuted] = useState(true)

  const videos = cfg.videos || []
  const listKey = videos.join('|')

  // Daftar video / setelan suara berubah: mulai lagi dari video pertama dan
  // dari kondisi muted (autoplay aman).
  const stateKey = `${listKey}|${cfg.ytSound}`
  const [prevKey, setPrevKey] = useState(stateKey)
  if (prevKey !== stateKey) {
    setPrevKey(stateKey)
    setIdx(0)
    setMuted(true)
  }

  // Coba aktifkan suara: langsung (berhasil di browser kiosk dengan flag
  // --autoplay-policy=no-user-gesture-required), lalu saat interaksi user
  // pertama sebagai jalur cadangan.
  useEffect(() => {
    if (!listKey || !cfg.ytSound || !muted) return

    const unmute = () => setMuted(false)
    const timer = setTimeout(unmute, 600)
    const events: (keyof DocumentEventMap)[] = [
      'pointerdown',
      'touchstart',
      'keydown',
    ]
    events.forEach((e) => document.addEventListener(e, unmute, { once: true }))

    return () => {
      clearTimeout(timer)
      events.forEach((e) => document.removeEventListener(e, unmute))
    }
  }, [listKey, cfg.ytSound, muted])

  // Bila browser menolak memutar dengan suara, video ikut ter-pause —
  // kembalikan ke muted supaya tampilan tidak berhenti.
  useEffect(() => {
    const v = videoRef.current
    if (!v || muted) return
    v.play().catch(() => setMuted(true))
  }, [muted, idx])

  const src = videos[idx] ?? videos[0] ?? ''

  return (
    <div className={styles.screen}>
      <div className={styles.pane}>
        {src ? (
          <video
            // Remount tiap ganti video agar browser memuat & memutar sumber baru.
            key={`${listKey}|${idx}`}
            ref={videoRef}
            className={styles.video}
            src={src}
            autoPlay
            // Satu video: cukup diulang sendiri. Banyak video: lanjut ke
            // berikutnya lewat onEnded.
            loop={videos.length < 2}
            muted={muted}
            playsInline
            onEnded={() => setIdx((i) => (i + 1) % videos.length)}
            // Video rusak / gagal dimuat jangan menghentikan playlist.
            onError={() =>
              videos.length > 1 && setIdx((i) => (i + 1) % videos.length)
            }
          />
        ) : (
          <div className={styles.msg}>
            <div className={styles.big}>Belum ada video</div>
            <div className={styles.sub}>
              Klik ikon ⚙️ → bagian <b>Video</b>, lalu upload file MP4/WebM.
              Boleh lebih dari satu — akan diputar bergantian.
            </div>
          </div>
        )}
      </div>

      {cfg.footerOn && (
        <DisplayFooter footer={cfg.footer} className={styles.footerSlot} />
      )}
    </div>
  )
}

export default WalidahScreen
