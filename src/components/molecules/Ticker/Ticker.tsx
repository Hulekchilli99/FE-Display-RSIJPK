import type { CSSProperties } from 'react'
import styles from './Ticker.module.css'

export interface TickerProps {
  text: string
  label?: string
}

// Kecepatan baca konstan: durasi scroll menyesuaikan panjang teks
// (makin panjang -> makin lama), supaya tidak terasa kebut saat teks banyak.
function scrollSeconds(text: string): number {
  return Math.max(20, Math.round(text.length * 0.22))
}

function Ticker({ text, label = 'INFORMASI' }: TickerProps) {
  const style = { '--dur': `${scrollSeconds(text)}s` } as CSSProperties

  return (
    <div className={styles.ticker}>
      <div className={styles.label}>{label}</div>
      <div className={styles.track}>
        {/* key forces the animation to restart when text changes */}
        <span key={text} style={style}>
          {text}
        </span>
      </div>
    </div>
  )
}

export default Ticker
