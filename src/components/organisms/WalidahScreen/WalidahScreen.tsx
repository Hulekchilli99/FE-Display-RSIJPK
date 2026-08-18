import { useEffect, useRef, useState } from 'react'
import type { Config } from '../../../lib/config'
import { DisplayFooter } from '../../molecules/DisplayFooter'
import styles from './WalidahScreen.module.css'

export interface WalidahScreenProps {
  cfg: Config
}

/**
 * Berapa detik sebelum video habis slot cadangan mulai memuat video
 * berikutnya. Cukup panjang untuk mengisi buffer awal, cukup pendek supaya dua
 * elemen <video> hanya hidup bersamaan sebentar — lihat catatan di bawah.
 */
const PRELOAD_LEAD = 12

/**
 * Tampilan unit Walidah: satu frame penuh berisi video upload, plus footer
 * biru opsional. Bila video lebih dari satu, diputar bergantian berurutan dan
 * kembali ke video pertama setelah yang terakhir selesai.
 *
 * Pergantian memakai dua elemen <video> bergantian (double buffer): satu
 * tampil, satunya memuat video berikutnya, jadi tidak ada layar hitam menunggu
 * buffer — sebelumnya elemen video di-remount tiap ganti sehingga sumber
 * berikutnya baru mulai diunduh setelah yang lama selesai.
 *
 * Yang penting untuk TV: slot cadangan baru diberi src pada PRELOAD_LEAD detik
 * terakhir, dan slot yang selesai langsung dilepas (src dikosongkan -> elemen
 * tidak dirender). Layar ini dibuka di browser bawaan smart TV, dan SoC TV
 * umumnya cuma punya SATU hardware video decoder: dua elemen <video> yang
 * hidup terus-menerus membuat salah satunya jatuh ke software decode dan
 * videonya patah-patah. Keduanya preload="auto" sepanjang waktu juga bikin
 * unduhan video cadangan berebut bandwidth dengan video yang sedang diputar.
 * Layar masjid & MCU tidak kena karena keduanya hanya memakai satu <video>.
 */
function WalidahScreen({ cfg }: WalidahScreenProps) {
  const videos = cfg.videos || []
  const listKey = videos.join('|')
  const total = videos.length

  const refA = useRef<HTMLVideoElement>(null)
  const refB = useRef<HTMLVideoElement>(null)

  // Slot yang sedang tampil (0 = A, 1 = B).
  const [active, setActive] = useState(0)
  // Sumber tiap slot. Slot bersumber '' tidak dirender sama sekali, supaya
  // decoder-nya benar-benar dilepas dan bukan cuma di-pause.
  const [srcs, setSrcs] = useState<[string, string]>(['', ''])
  // Video yang sedang diputar (indeks dalam cfg.videos).
  const [idx, setIdx] = useState(0)
  // Slot cadangan sudah diisi video berikutnya untuk putaran ini.
  const [armed, setArmed] = useState(false)
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
    setArmed(false)
    setSrcs([videos[0] ?? '', ''])
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

  // Slot cadangan tidak perlu di-pause/reset lagi seperti dulu: slot yang
  // selesai dilepas dari DOM, jadi yang dipakai giliran berikutnya selalu
  // elemen baru yang sudah berada di posisi 0.

  // Mulai memuat video berikutnya menjelang akhir video yang tampil.
  const arm = () => {
    if (armed || total < 2) return
    const cur = (active === 0 ? refA : refB).current
    if (!cur) return

    const left = cur.duration - cur.currentTime
    if (!Number.isFinite(left) || left > PRELOAD_LEAD) return

    setArmed(true)
    setSrcs((s) => {
      const out: [string, string] = [s[0], s[1]]
      out[active === 0 ? 1 : 0] = videos[(idx + 1) % total] ?? ''
      return out
    })
  }

  // Tukar slot: yang sudah ter-buffer langsung tampil, slot yang baru selesai
  // dikosongkan supaya decoder-nya bebas.
  const advance = () => {
    if (total < 2) return
    const next = (idx + 1) % total
    const nextActive = active === 0 ? 1 : 0

    setIdx(next)
    setActive(nextActive)
    setArmed(false)
    setSrcs((s) => {
      const out: [string, string] = [s[0], s[1]]
      out[active] = ''
      // Biasanya sudah terisi saat arm; diisi di sini sebagai jaring pengaman
      // bila durasi tidak pernah terbaca sehingga arm tak sempat jalan.
      out[nextActive] = videos[next] ?? ''
      return out
    })
  }

  const slot = (i: 0 | 1) => (
    <video
      key={i}
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
      onTimeUpdate={() => active === i && arm()}
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
            {srcs[0] ? slot(0) : null}
            {srcs[1] ? slot(1) : null}
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
