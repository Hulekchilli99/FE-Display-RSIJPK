import { useEffect, useState } from 'react'
import type { Config } from './lib/config'
import { cacheConfig, currentSlug, loadConfig } from './lib/config'
import { apiGetConfig, apiUpdateConfig } from './lib/api'
import { fetchWeather } from './lib/weather'
import { activePrayer, fetchPrayers } from './lib/prayers'
import { Sidebar, Ticker } from './components/molecules'
import {
  Background,
  McuScreen,
  McuSettingsPanel,
  SettingsPanel,
} from './components/organisms'
import styles from './App.module.css'

function App() {
  // Display yang dibuka layar ini ditentukan oleh URL (?display=mcu).
  const slug = currentSlug()
  const [cfg, setCfg] = useState<Config>(() => loadConfig(slug))
  const [panelOpen, setPanelOpen] = useState(false)
  const [activeName, setActiveName] = useState<string | null>(null)
  const isMcu = cfg.type === 'mcu'

  // Ambil config terbaru dari backend saat dibuka, lalu cache untuk paint instan.
  useEffect(() => {
    let alive = true
    apiGetConfig(slug)
      .then((c) => {
        if (!alive) return
        setCfg((prev) => ({ ...prev, ...c, times: { ...prev.times, ...c.times } }))
        cacheConfig(c, slug)
      })
      .catch(() => {
        /* offline / backend mati / display belum dibuat: pakai cache lokal */
      })
    return () => {
      alive = false
    }
  }, [slug])

  // Cuaca & jadwal sholat otomatis (khusus masjid).
  useEffect(() => {
    if (isMcu) return
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
  }, [isMcu, cfg.autoWeather, cfg.autoPrayer, cfg.lat, cfg.lon, cfg.method])

  // Highlight sholat yang sedang berlangsung, perbarui tiap 30 detik (masjid).
  useEffect(() => {
    if (isMcu) return
    const update = () => setActiveName(activePrayer(cfg.times, new Date()))
    update()
    const id = setInterval(update, 30000)
    return () => clearInterval(id)
  }, [isMcu, cfg.times])

  const handleSave = async (next: Config) => {
    const saved = await apiUpdateConfig(next, slug)
    setCfg((prev) => ({ ...prev, ...saved, times: { ...prev.times, ...saved.times } }))
    cacheConfig(saved, slug)
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

      {isMcu ? (
        <McuScreen cfg={cfg} />
      ) : (
        <div className={styles.screen}>
          <Sidebar
            name={cfg.name}
            loc={cfg.loc}
            temp={cfg.temp}
            cond={cfg.cond}
            ico={cfg.ico}
            times={cfg.times}
            iqomah={cfg.iqomah}
            activeName={activeName}
          />
          <Background cfg={cfg} />
          <Ticker text={cfg.ticker} />
        </div>
      )}

      {panelOpen &&
        (isMcu ? (
          <McuSettingsPanel
            cfg={cfg}
            onSave={handleSave}
            onClose={() => setPanelOpen(false)}
          />
        ) : (
          <SettingsPanel
            cfg={cfg}
            onSave={handleSave}
            onClose={() => setPanelOpen(false)}
          />
        ))}
    </>
  )
}

export default App
