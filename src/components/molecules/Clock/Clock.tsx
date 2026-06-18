import { useClock } from '../../../hooks/useClock'
import { formatDate, formatTime } from '../../../lib/datetime'
import styles from './Clock.module.css'

function Clock() {
  const now = useClock(1000)
  const { hhmm, ss } = formatTime(now)

  return (
    <div className={styles.clock}>
      <div className={styles.time}>
        {hhmm}
        <span className={styles.sec}>.{ss}</span>
      </div>
      <div className={styles.date}>{formatDate(now)}</div>
    </div>
  )
}

export default Clock
