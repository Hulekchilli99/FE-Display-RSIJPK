import { PRAYER_NAMES } from '../../../lib/config'
import type { PrayerTimes } from '../../../lib/config'
import styles from './PrayerList.module.css'

export interface PrayerListProps {
  times: PrayerTimes
  /** Name of the prayer currently in progress, highlighted. */
  activeName: string | null
}

const cx = (...c: (string | false | undefined)[]) => c.filter(Boolean).join(' ')

function PrayerList({ times, activeName }: PrayerListProps) {
  return (
    <div className={styles.prayers}>
      {PRAYER_NAMES.map((name) => (
        <div
          key={name}
          className={cx(styles.prayer, name === activeName && styles.active)}
        >
          <span className={styles.nm}>{name}</span>
          <span className={styles.tm}>{times[name] || '--:--'}</span>
        </div>
      ))}
    </div>
  )
}

export default PrayerList
