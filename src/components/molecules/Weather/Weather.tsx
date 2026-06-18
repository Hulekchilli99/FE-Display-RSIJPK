import styles from './Weather.module.css'

export interface WeatherProps {
  temp: string
  cond: string
  /** Emoji or HTML entity icon. */
  ico: string
}

function Weather({ temp, cond, ico }: WeatherProps) {
  return (
    <div className={styles.weather}>
      <span className={styles.ico}>{ico}</span>
      <div>
        <div className={styles.temp}>{temp}</div>
        <div className={styles.cond}>{cond}</div>
      </div>
    </div>
  )
}

export default Weather
