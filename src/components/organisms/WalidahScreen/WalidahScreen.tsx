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
 *
 * Pergantian memakai dua elemen <video> bergantian (double buffer): satu
 * tampil, satunya diam-diam sudah memuat video berikutnya. Saat video habis
 * keduanya tinggal ditukar, jadi tidak ada layar hitam menunggu buffer —
 * sebelumnya elemen video di-remount tiap ganti sehingga sumber berikutnya
 * baru mulai diunduh setelah yang lama selesai.
 */
function WalidahScreen({ cfg }: WalidahScreenProps) {
  const videos = cfg.videos || []
  const listKey = videos.join('|')
  const total = videos.length

  const refA = useRef<HTMLVideoElement>(null)
  const refB = useRef<HTMLVideoElement>(null)

  // Slot yang sedang tampil (0 = A, 1 = B).
  const [active, setActive] = useState(0)
  // Sumber tiap slot. Slot non-aktif diisi video berikutnya supaya ter-buffer
  // sebelum gilirannya tiba.
  const [srcs, setSrcs] = useState<[string, string]>(['', ''])
  // Video yang sedang diputar (indeks dalam cfg.videos).
  const [idx, setIdx] = useState(0)
  // Mulai selalu muted agar autoplay pasti jalan; baru unmute saat suara
  // diaktifkan dan browser mengizinkan (flag kiosk / interaksi user).
  const [muted, setMuted] = useState(true)

  // Daftar video / setelan suara berubah: mulai lagi dari video pertama dan
  // dari kondisi muted (autoplay aman).
  const stateKey = `${listKey}|${cfg.ytSound}`
  const [prevKey, setPrevKey] = useState('')
  if (prevKey !== stateKey) {
    setPrevKey(stateKey)
    setIdx(0)
    setActive(0)
    setMuted(true)
    setSrcs([videos[0] ?? '', total > 1 ? videos[1] : ''])
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

  // Putar slot yang sedang tampil. Bila browser menolak memutar dengan suara,
  // video ikut ter-pause — kembalikan ke muted supaya tampilan tidak berhenti.
  useEffect(() => {
    const cur = (active === 0 ? refA : refB).current
    if (!cur) return
    cur.play().catch(() => setMuted(true))
  }, [active, idx, muted])

  // Slot yang tidak tampil: dihentikan dan dikembalikan ke awal, tapi tetap
  // memuat (preload="auto") supaya siap diputar begitu ditukar. Reset ini juga
  // yang membuat playlist 2 video benar — slot lama dipakai ulang untuk video
  // yang sama dan tanpa reset ia masih berada di posisi akhir.
  useEffect(() => {
    const other = (active === 0 ? refB : refA).current
    if (!other) return
    other.pause()
    if (other.currentTime !== 0) {
      try {
        other.currentTime = 0
      } catch {
        /* belum ada metadata: posisi awal memang sudah 0 */
      }
    }
  }, [active, idx])

  // Tukar slot: yang sudah ter-buffer langsung tampil, slot yang baru selesai
  // dipakai untuk memuat video sesudahnya.
  const advance = () => {
    if (total < 2) return
    const next = (idx + 1) % total
    setIdx(next)
    setActive(active === 0 ? 1 : 0)
    setSrcs((s) => {
      const out: [string, string] = [s[0], s[1]]
      out[active] = videos[(next + 1) % total] ?? ''
      return out
    })
  }

  const slot = (i: 0 | 1) => (
    <video
      ref={i === 0 ? refA : refB}
      className={`${styles.video} ${active === i ? '' : styles.standby}`}
      src={srcs[i]}
      // Satu video: cukup diulang sendiri. Banyak video: lanjut ke berikutnya
      // lewat onEnded.
      loop={total < 2}
      // Slot cadangan selalu bisu; hanya yang tampil yang boleh bersuara.
      muted={active === i ? muted : true}
      preload="auto"
      playsInline
      onEnded={() => active === i && advance()}
      // Video rusak / gagal dimuat jangan menghentikan playlist. Error pada
      // slot cadangan diabaikan — akan ketahuan saat gilirannya tampil.
      onError={() => active === i && advance()}
    />
  )

  return (
    <div className={styles.screen}>
      <div className={styles.pane}>
        {srcs[0] || srcs[1] ? (
          <>
            {slot(0)}
            {total > 1 && slot(1)}
          </>
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
