import { useEffect, useRef, useState } from 'react'
import type { Config } from '../../../lib/config'
import { isYoutube, youtubeId } from '../../../lib/youtube'
import { YoutubeFrame } from '../../molecules/YoutubeFrame'
import styles from './Background.module.css'

export interface BackgroundProps {
  cfg: Config
}

type Message = 'empty' | 'ytfile' | null

function Background({ cfg }: BackgroundProps) {
  const slideARef = useRef<HTMLDivElement>(null)
  const slideBRef = useRef<HTMLDivElement>(null)
  const [videoSrc, setVideoSrc] = useState<string | null>(null)
  const [ytId, setYtId] = useState<string | null>(null)
  const [message, setMessage] = useState<Message>(null)

  // Kunci stabil untuk daftar slide (array baru tiap render).
  const slidesKey = cfg.slides.join('|')

  useEffect(() => {
    const a = slideARef.current
    const b = slideBRef.current
    if (!a || !b) return

    let timer: ReturnType<typeof setInterval> | null = null
    let cancelled = false

    const setSlide = (el: HTMLDivElement, url: string) => {
      el.style.setProperty('--img', `url('${url}')`)
      const img = el.querySelector('img')
      if (img) img.src = url
    }
    const stopSlideshow = () => {
      if (timer) {
        clearInterval(timer)
        timer = null
      }
      ;[a, b].forEach((el) => {
        el.style.display = 'none'
        el.classList.remove(styles.show)
        el.style.removeProperty('--img')
        el.querySelector('img')?.removeAttribute('src')
      })
    }
    const startSlideshow = (slides: string[], sec: number) => {
      if (!slides.length) return
      a.style.display = b.style.display = 'block'
      setSlide(a, slides[0])
      a.classList.add(styles.show)
      let front: HTMLDivElement = a
      let idx = 0
      if (slides.length < 2) return // satu gambar, tidak perlu berganti
      timer = setInterval(
        () => {
          idx = (idx + 1) % slides.length
          const back = front === a ? b : a
          setSlide(back, slides[idx])
          back.classList.add(styles.show)
          front.classList.remove(styles.show)
          front = back
        },
        Math.max(2, sec) * 1000,
      )
    }

    function apply() {
      setVideoSrc(null)
      setYtId(null)
      setMessage(null)
      stopSlideshow()
      if (cancelled) return

      // link YouTube selalu diperlakukan sebagai YouTube
      const bgType = isYoutube(cfg.bg) ? 'youtube' : cfg.bgType

      if (bgType === 'slideshow') {
        const slides = cfg.slides || []
        if (!slides.length) {
          setMessage('empty')
          return
        }
        startSlideshow(slides, cfg.slideSec || 6)
        return
      }

      if (bgType === 'youtube') {
        const id = youtubeId(cfg.bg)
        if (!id) return
        if (location.protocol === 'file:') {
          setMessage('ytfile')
          return
        }
        setYtId(id)
        return
      }

      const src = cfg.bg
      if (bgType === 'video' && src) {
        setVideoSrc(src)
      } else if (src) {
        startSlideshow([src], 9999) // satu gambar, tampil utuh
      } else {
        setMessage('empty')
      }
    }

    apply()

    return () => {
      cancelled = true
      stopSlideshow()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.bg, cfg.bgType, cfg.slideSec, slidesKey])

  return (
    <div className={styles.bg}>
      <div ref={slideARef} className={styles.slide}>
        <img alt="" />
      </div>
      <div ref={slideBRef} className={styles.slide}>
        <img alt="" />
      </div>

      {videoSrc && (
        <video
          className={styles.video}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
        />
      )}

      {ytId && (
        <YoutubeFrame
          url={cfg.bg}
          sound={cfg.ytSound}
          title="background"
          className={styles.frame}
        />
      )}

      {message === 'empty' && (
        <div className={styles.msg}>
          <div className={styles.big}>Belum ada gambar dipilih</div>
          <div className={styles.sub}>
            Klik ikon ⚙️ di kanan atas → bagian <b>Gambar / Video Latar</b>, lalu{' '}
            <b>upload gambar</b> atau pilih tipe <b>Slideshow</b>.
          </div>
        </div>
      )}

      {message === 'ytfile' && (
        <div className={styles.msg}>
          <div className={styles.big}>⚠️ YouTube tidak bisa diputar dari file</div>
          <div className={styles.sub}>
            Halaman ini dibuka sebagai <code>file://</code>. YouTube hanya jalan
            lewat server. Buka di browser: <code>http://localhost:8080</code>
          </div>
        </div>
      )}
    </div>
  )
}

export default Background
