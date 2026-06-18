import styles from './Ticker.module.css'

export interface TickerProps {
  text: string
  label?: string
}

function Ticker({ text, label = 'INFORMASI' }: TickerProps) {
  return (
    <div className={styles.ticker}>
      <div className={styles.label}>{label}</div>
      <div className={styles.track}>
        {/* key forces the animation to restart when text changes */}
        <span key={text}>{text}</span>
      </div>
    </div>
  )
}

export default Ticker
