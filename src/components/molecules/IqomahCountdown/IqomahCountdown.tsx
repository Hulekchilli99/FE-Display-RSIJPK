import { useClock } from '../../../hooks/useClock'
import type { Iqomah, PrayerTimes } from '../../../lib/config'
import { iqomahCountdown } from '../../../lib/prayers'
import styles from './IqomahCountdown.module.css'

export interface IqomahCountdownProps {
  times: PrayerTimes
  iqomah: Iqomah
}

const pad = (n: number) => String(n).padStart(2, '0')

/** Hitung mundur jeda adzan -> iqomah. Tampil hanya saat di dalam jeda. */
function IqomahCountdown({ times, iqomah }: IqomahCountdownProps) {
  const now = useClock(1000)
  const c = iqomahCountdown(times, iqomah, now)
  if (!c) return null

  const mm = pad(Math.floor(c.remainingSec / 60))
  const ss = pad(c.remainingSec % 60)

  return (
    <div className={styles.box}>
      <div className={styles.label}>Menjelang Iqomah {c.name}</div>
      <div className={styles.time}>
        {mm}:{ss}
      </div>
      <div className={styles.hint}>Rapatkan & luruskan shaf</div>
    </div>
  )
}

export default IqomahCountdown
