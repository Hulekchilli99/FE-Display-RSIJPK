import { useEffect, useRef, useState } from 'react'
import type { Config } from '../../../lib/config'
import { youtubeEmbedUrl, youtubeId } from '../../../lib/youtube'
import styles from './McuScreen.module.css'

export interface McuScreenProps {
  cfg: Config
}

// Kirim perintah ke player YouTube lewat postMessage (butuh enablejsapi=1).
function ytCommand(frame: HTMLIFrameElement, func: string, args: unknown[] = []) {
  frame.contentWindow?.postMessage(
    JSON.stringify({ event: 'command', func, args }),
    '*',
  )
}

/**
 * Tampilan unit MCU: kolom kiri slideshow gambar, kolom kanan video/live
 * YouTube. Tanpa elemen masjid (jadwal sholat, cuaca, dll).
 */
function McuScreen({ cfg }: McuScreenProps) {
  const slideARef = useRef<HTMLDivElement>(null)
  const slideBRef = useRef<HTMLDivElement>(null)
  const frameRef = useRef<HTMLIFrameElement>(null)
  // Mulai selalu muted agar autoplay pasti jalan; di-set false saat suara
  // diaktifkan + ada izin (flag kiosk / interaksi user) -> iframe reload.
  const [ytMuted, setYtMuted] = useState(true)

  const slides = cfg.leftSlides || []
  const slidesKey = slides.join('|')
  const ytId = youtubeId(cfg.rightYoutube)

  // --- Slideshow kiri (crossfade dua lapis) ---
  useEffect(() => {
    const a = slideARef.current
    const b = slideBRef.current
    if (!a || !b) return

    const setSlide = (el: HTMLDivElement, url: string) => {
      const img = el.querySelector('img')
      if (img) img.src = url
    }

    if (!slides.length) {
      ;[a, b].forEach((el) => {
        el.style.display = 'none'
        el.classList.remove(styles.show)
        el.querySelector('img')?.removeAttribute('src')
      })
      return
    }

    a.style.display = b.style.display = 'block'
    setSlide(a, slides[0])
    a.classList.add(styles.show)
    b.classList.remove(styles.show)

    if (slides.length < 2) return // satu gambar, tidak perlu berganti

    let front: HTMLDivElement = a
    let idx = 0
    const timer = setInterval(
      () => {
        idx = (idx + 1) % slides.length
        const back = front === a ? b : a
        setSlide(back, slides[idx])
        back.classList.add(styles.show)
        front.classList.remove(styles.show)
        front = back
      },
      Math.max(2, cfg.leftSlideSec || 6) * 1000,
    )
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slidesKey, cfg.leftSlideSec])

  // Saat ganti video / matikan suara: kembali ke kondisi muted (autoplay aman).
  useEffect(() => {
    setYtMuted(true)
  }, [ytId, cfg.rightSound])

  // Aktifkan suara saat rightSound aktif: coba via API (jalur kiosk), lalu
  // reload iframe tanpa mute pada interaksi user pertama (jalur paling andal).
  useEffect(() => {
    if (!ytId || !cfg.rightSound) return

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
  }, [ytId, cfg.rightSound, ytMuted])

  const muted = !cfg.rightSound || ytMuted
  const isFile = location.protocol === 'file:'
  const f = cfg.footer

  return (
    <div className={styles.screen}>
      <div className={`${styles.pane} ${styles.left}`}>
        <div ref={slideARef} className={styles.slide}>
          <img alt="" />
        </div>
        <div ref={slideBRef} className={styles.slide}>
          <img alt="" />
        </div>
        {!slides.length && (
          <div className={styles.msg}>
            <div className={styles.big}>Belum ada gambar slideshow</div>
            <div className={styles.sub}>
              Klik ikon ⚙️ → bagian <b>Slideshow (kolom kiri)</b>, lalu upload gambar.
            </div>
          </div>
        )}
      </div>

      <div className={styles.pane}>
        {ytId && !isFile ? (
          <iframe
            key={`${ytId}-${muted ? 'm' : 's'}`}
            ref={frameRef}
            className={styles.frame}
            src={youtubeEmbedUrl(ytId, muted)}
            allow="autoplay; encrypted-media"
            allowFullScreen
            title="mcu-video"
          />
        ) : (
          <div className={styles.msg}>
            {isFile && cfg.rightYoutube ? (
              <>
                <div className={styles.big}>⚠️ YouTube tidak bisa diputar dari file</div>
                <div className={styles.sub}>
                  Buka lewat server (mis. <code>http://localhost:8080</code>), bukan{' '}
                  <code>file://</code>.
                </div>
              </>
            ) : (
              <>
                <div className={styles.big}>Belum ada video YouTube</div>
                <div className={styles.sub}>
                  Klik ikon ⚙️ → bagian <b>Video YouTube (kolom kanan)</b>, lalu tempel
                  link.
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {cfg.footerOn && (
        <footer className={styles.footer}>
          {(f.name || f.address) && (
            <div className={styles.fItem}>
              <img className={styles.fLogo} src="/logo-rsijpk.jpg" alt="RSIJPK" />
              <div className={styles.fText}>
                {f.name && <div className={styles.fStrong}>{f.name}</div>}
                {f.address && <div className={styles.fSub}>{f.address}</div>}
              </div>
            </div>
          )}
          {f.phone && (
            <div className={styles.fItem}>
              <span className={styles.fIcon}>📞</span>
              <div className={styles.fText}>
                <div className={styles.fSub}>Informasi & Reservasi</div>
                <div className={styles.fStrong}>{f.phone}</div>
              </div>
            </div>
          )}
          {f.website && (
            <div className={styles.fItem}>
              <span className={styles.fIcon}>🌐</span>
              <div className={styles.fText}>
                <div className={styles.fSub}>Kunjungi Website Kami</div>
                <div className={styles.fStrong}>
                  {f.website.replace(/^https?:\/\//, '').replace(/\/+$/, '')}
                </div>
              </div>
            </div>
          )}
        </footer>
      )}
    </div>
  )
}

export default McuScreen
