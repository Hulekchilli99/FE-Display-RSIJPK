import { useEffect, useRef } from 'react'
import type { Config } from '../../../lib/config'
import { canPlayYoutube } from '../../../lib/youtube'
import { DisplayFooter } from '../../molecules/DisplayFooter'
import { YoutubeFrame } from '../../molecules/YoutubeFrame'
import styles from './McuScreen.module.css'

export interface McuScreenProps {
  cfg: Config
}

/**
 * Tampilan unit MCU: kolom kiri slideshow gambar, kolom kanan video/live
 * YouTube. Tanpa elemen masjid (jadwal sholat, cuaca, dll).
 */
function McuScreen({ cfg }: McuScreenProps) {
  const slideARef = useRef<HTMLDivElement>(null)
  const slideBRef = useRef<HTMLDivElement>(null)

  const slides = cfg.leftSlides || []
  const slidesKey = slides.join('|')
  const adaYoutube = canPlayYoutube(cfg.rightYoutube)

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

  const isFile = location.protocol === 'file:'

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
        {adaYoutube ? (
          <YoutubeFrame
            url={cfg.rightYoutube}
            sound={cfg.rightSound}
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
        <DisplayFooter footer={cfg.footer} className={styles.footerSlot} />
      )}
    </div>
  )
}

export default McuScreen
