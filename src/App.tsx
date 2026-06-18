import { useEffect, useState } from 'react'
import type { Config } from './lib/config'
import { cacheConfig, loadConfig } from './lib/config'
import { apiGetConfig, apiUpdateConfig } from './lib/api'
import { fetchWeather } from './lib/weather'
import { activePrayer, fetchPrayers } from './lib/prayers'
import { Sidebar, Ticker } from './components/molecules'
import { Background, SettingsPanel } from './components/organisms'
import styles from './App.module.css'

function App() {
  const [cfg, setCfg] = useState<Config>(() => loadConfig())
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeName, setActiveName] = useState<string | null>(null)

  // Ambil config terbaru dari backend saat dibuka, lalu cache untuk paint instan.
  useEffect(() => {
    let alive = true
    apiGetConfig()
      .then((c) => {
        if (!alive) return
        setCfg((prev) => ({ ...prev, ...c, times: { ...prev.times, ...c.times } }))
        cacheConfig(c)
      })
      .catch(() => {
        /* offline / backend mati: pakai cache lokal yang sudah dimuat */
      })
    return () => {
      alive = false
    }
  }, [])

  // Cuaca & jadwal sholat otomatis: ambil sekarang lalu perbarui berkala.
  useEffect(() => {
    let alive = true
    const runWeather = async () => {
      const w = await fetchWeather(cfg)
      if (alive && w) setCfg((c) => ({ ...c, ...w }))
    }
    const runPrayers = async () => {
      const t = await fetchPrayers(cfg)
      if (alive && t) setCfg((c) => ({ ...c, times: t }))
    }
    runWeather()
    runPrayers()
    const wId = setInterval(runWeather, 10 * 60 * 1000) // tiap 10 menit
    const pId = setInterval(runPrayers, 60 * 60 * 1000) // tiap jam
    return () => {
      alive = false
      clearInterval(wId)
      clearInterval(pId)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.autoWeather, cfg.autoPrayer, cfg.lat, cfg.lon, cfg.method])

  // Highlight sholat yang sedang berlangsung, perbarui tiap 30 detik.
  useEffect(() => {
    const update = () => setActiveName(activePrayer(cfg.times, new Date()))
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [cfg.times])

  const handleSave = async (next: Config) => {
    const saved = await apiUpdateConfig(next)
    setCfg((prev) => ({ ...prev, ...saved, times: { ...prev.times, ...saved.times } }))
    cacheConfig(saved)
  }

  return (
    <>
      <button
        type="button"
        className={styles.gear}
        title="Pengaturan"
        aria-label="Pengaturan"
        onClick={() => setPanelOpen(true)}
      >
        ⚙️
      </button>

      <div className={styles.screen}>
        <Sidebar
          name={cfg.name}
          loc={cfg.loc}
          temp={cfg.temp}
          cond={cfg.cond}
          ico={cfg.ico}
          times={cfg.times}
          activeName={activeName}
        />
        <Background cfg={cfg} />
        <Ticker text={cfg.ticker} />
      </div>

      {panelOpen && (
        <SettingsPanel
          cfg={cfg}
          onSave={handleSave}
          onClose={() => setPanelOpen(false)}
        />
      )}
    </>
  )
}

export default App
