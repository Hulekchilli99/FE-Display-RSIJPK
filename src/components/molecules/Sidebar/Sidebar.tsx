import type { PrayerTimes } from '../../../lib/config'
import { Clock } from '../Clock'
import { Weather } from '../Weather'
import { PrayerList } from '../PrayerList'
import styles from './Sidebar.module.css'

export interface SidebarProps {
  name: string
  loc: string
  temp: string
  cond: string
  ico: string
  times: PrayerTimes
  activeName: string | null
}

function Sidebar({
  name,
  loc,
  temp,
  cond,
  ico,
  times,
  activeName,
}: SidebarProps) {
  return (
    <aside className={styles.sidebar}>
      <div className={styles.name}>{name}</div>
      {loc && <div className={styles.loc}>📍 {loc}</div>}

      <Weather temp={temp} cond={cond} ico={ico} />
      <Clock />
      <PrayerList times={times} activeName={activeName} />
    </aside>
  )
}

export default Sidebar
