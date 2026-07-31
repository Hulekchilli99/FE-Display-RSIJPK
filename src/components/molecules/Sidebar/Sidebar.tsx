import type { Iqomah, PrayerTimes } from '../../../lib/config'
import { Clock } from '../Clock'
import { Weather } from '../Weather'
import { PrayerList } from '../PrayerList'
import { IqomahCountdown } from '../IqomahCountdown'
import styles from './Sidebar.module.css'

export interface SidebarProps {
  name: string
  loc: string
  temp: string
  cond: string
  ico: string
  times: PrayerTimes
  iqomah: Iqomah
  activeName: string | null
}

function Sidebar({
  name,
  loc,
  temp,
  cond,
  ico,
  times,
  iqomah,
  activeName,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.name}>{name}</div>
      {loc && <div className={styles.loc}>📍 {loc}</div>}

      <Weather temp={temp} cond={cond} ico={ico} />
      <Clock />
      <IqomahCountdown times={times} iqomah={iqomah} />
      <PrayerList times={times} activeName={activeName} />

      {/* Menempel di dasar sidebar lewat margin-top:auto, jadi posisinya tetap
          di bawah berapa pun tinggi daftar sholat / countdown iqomah. */}
      <div className={styles.credit}>
        © {new Date().getFullYear()} Tri Aji Bagaskara S.Kom
      </div>
    </aside>
  )
}

export default Sidebar
