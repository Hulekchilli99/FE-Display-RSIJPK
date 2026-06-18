import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { BgType, Config, PrayerTimes } from '../../../lib/config'
import { DEFAULT, PRAYER_NAMES } from '../../../lib/config'
import { idbSet } from '../../../lib/idb'
import { isYoutube } from '../../../lib/youtube'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Select } from '../../atoms/Select'
import { Textarea } from '../../atoms/Textarea'
import { Checkbox } from '../../atoms/Checkbox'
import styles from './SettingsPanel.module.css'

export interface SettingsPanelProps {
  cfg: Config
  onSave: (cfg: Config) => void
  onClose: () => void
}

const BG_TYPES: { value: BgType; label: string }[] = [
  { value: 'image', label: 'Gambar (1 gambar)' },
  { value: 'slideshow', label: 'Slideshow (banyak gambar bergantian)' },
  { value: 'video', label: 'Video (file MP4/WebM)' },
  { value: 'youtube', label: 'YouTube (Live / Video)' },
]

const ICONS = [
  { value: '☀️', label: '☀️ Cerah' },
  { value: '⛅', label: '⛅ Berawan' },
  { value: '☁️', label: '☁️ Mendung' },
  { value: '🌧️', label: '🌧️ Hujan' },
  { value: '⚡', label: '⚡ Badai' },
  { value: '🌙', label: '🌙 Malam' },
]

const METHODS = [
  { value: '20', label: 'Kemenag RI (Indonesia)' },
  { value: '3', label: 'Muslim World League' },
  { value: '2', label: 'ISNA (Amerika Utara)' },
  { value: '4', label: 'Umm al-Qura (Makkah)' },
  { value: '5', label: 'Egyptian General Authority' },
]

function SettingsPanel({ cfg, onSave, onClose }: SettingsPanelProps) {
  const [name, setName] = useState(cfg.name)
  const [loc, setLoc] = useState(cfg.loc)
  const [bgUrl, setBgUrl] = useState(cfg.bg && cfg.bg !== 'idb' ? cfg.bg : '')
  const [bgType, setBgType] = useState<BgType>(cfg.bgType)
  const [slideSec, setSlideSec] = useState(String(cfg.slideSec || 6))
  const [temp, setTemp] = useState(cfg.temp)
  const [cond, setCond] = useState(cfg.cond)
  const [ico, setIco] = useState(cfg.ico)
  const [autoWeather, setAutoWeather] = useState(cfg.autoWeather)
  const [lat, setLat] = useState(cfg.lat)
  const [lon, setLon] = useState(cfg.lon)
  const [autoPrayer, setAutoPrayer] = useState(cfg.autoPrayer)
  const [method, setMethod] = useState(cfg.method)
  const [ticker, setTicker] = useState(cfg.ticker)
  const [times, setTimes] = useState<PrayerTimes>({ ...cfg.times })

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingType, setPendingType] = useState<BgType | null>(null)
  const [pendingSlides, setPendingSlides] = useState<File[] | null>(null)
  const [preview, setPreview] = useState<string | null>(
    cfg.bgType === 'image' && cfg.bg && cfg.bg !== 'idb' ? cfg.bg : null,
  )
  const [fileInfo, setFileInfo] = useState(
    'Mendukung gambar (JPG, PNG) & video (MP4, WebM). Atau tempel URL di bawah.',
  )
  const [slidesInfo, setSlidesInfo] = useState(
    cfg.slidesIdb
      ? '🖼️ Gambar slideshow tersimpan. Pilih lagi untuk mengganti.'
      : 'Tekan Ctrl saat memilih untuk memilih beberapa gambar.',
  )

  function onBgFile(e: ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const type: BgType = f.type.startsWith('video') ? 'video' : 'image'
    setPendingFile(f)
    setPendingType(type)
    setBgType(type)
    setPreview(type === 'image' ? URL.createObjectURL(f) : null)
    setFileInfo((type === 'video' ? '🎬 Video' : '🖼️ Gambar') + ' dipilih: ' + f.name)
  }

  function onSlidesFile(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image'),
    )
    setPendingSlides(files.length ? files : null)
    setSlidesInfo(
      files.length
        ? `🖼️ ${files.length} gambar dipilih`
        : 'Tekan Ctrl saat memilih untuk memilih beberapa gambar.',
    )
  }

  async function handleSave() {
    const next: Config = {
      ...cfg,
      name: name.trim() || DEFAULT.name,
      loc: loc.trim(),
      temp: temp.trim() || '—',
      cond: cond.trim(),
      ico,
      autoWeather,
      lat: lat.trim(),
      lon: lon.trim(),
      autoPrayer,
      method,
      ticker: ticker.trim(),
      bgType,
      slideSec: parseInt(slideSec, 10) || 6,
    }

    const url = bgUrl.trim()
    if (bgType === 'slideshow') {
      if (pendingSlides) {
        try {
          await idbSet('slides', pendingSlides)
          next.slidesIdb = true
          next.slides = []
        } catch {
          alert('Gagal menyimpan gambar slideshow. Coba gambar lebih sedikit/kecil.')
        }
      }
    } else if (url) {
      next.bg = url
      if (isYoutube(url)) next.bgType = 'youtube'
    } else if (pendingFile && pendingType) {
      try {
        await idbSet('bg', pendingFile)
        next.bg = 'idb'
        next.bgType = pendingType
      } catch {
        alert('Gagal menyimpan file. Coba file lebih kecil atau pakai URL.')
      }
    }

    if (!autoPrayer) next.times = { ...times }

    onSave(next)
    onClose()
  }

  return (
    <div
      className={styles.overlay}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className={styles.panel}>
        <h2 className={styles.h2}>⚙️ Pengaturan Tampilan</h2>

        <h3 className={styles.h3}>Identitas Masjid</h3>
        <Input label="Nama Masjid" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Lokasi" value={loc} onChange={(e) => setLoc(e.target.value)} />

        <h3 className={styles.h3}>Gambar / Video Latar</h3>
        <Input
          label="Upload gambar atau video dari komputer"
          type="file"
          accept="image/*,video/*"
          onChange={onBgFile}
          hint={fileInfo}
        />
        {preview && <img className={styles.preview} src={preview} alt="" />}
        <Input
          label="URL Gambar/Video (opsional)"
          type="text"
          placeholder="https://..."
          value={bgUrl}
          onChange={(e) => setBgUrl(e.target.value)}
          hint="Jika URL diisi, pilih tipenya di bawah."
        />
        <Select
          label="Tipe media"
          value={bgType}
          onChange={(e) => setBgType(e.target.value as BgType)}
          options={BG_TYPES}
          hint="Untuk YouTube: pilih tipe ini lalu tempel link live/video YouTube di kolom URL."
        />
        {bgType === 'slideshow' && (
          <>
            <Input
              label="Upload gambar slideshow (boleh banyak sekaligus)"
              type="file"
              accept="image/*"
              multiple
              onChange={onSlidesFile}
              hint={slidesInfo}
            />
            <Input
              label="Ganti gambar tiap berapa detik?"
              type="number"
              min={2}
              value={slideSec}
              onChange={(e) => setSlideSec(e.target.value)}
            />
          </>
        )}

        <h3 className={styles.h3}>Cuaca</h3>
        <Checkbox
          label="Cuaca otomatis sesuai lokasi (suhu °C ter-generate sendiri)"
          checked={autoWeather}
          onChange={(e) => setAutoWeather(e.target.checked)}
        />
        {autoWeather ? (
          <>
            <div className={styles.grid2}>
              <Input label="Latitude" value={lat} placeholder="-6.2227" onChange={(e) => setLat(e.target.value)} />
              <Input label="Longitude" value={lon} placeholder="106.9300" onChange={(e) => setLon(e.target.value)} />
            </div>
            <p className={styles.note}>
              Cari koordinat lokasi di Google Maps (klik kanan titik → salin angka
              koordinat).
            </p>
          </>
        ) : (
          <div className={styles.grid3}>
            <Input label="Suhu" value={temp} placeholder="28°C" onChange={(e) => setTemp(e.target.value)} />
            <Input label="Kondisi" value={cond} placeholder="CERAH" onChange={(e) => setCond(e.target.value)} />
            <Select label="Ikon" value={ico} onChange={(e) => setIco(e.target.value)} options={ICONS} />
          </div>
        )}

        <h3 className={styles.h3}>Jadwal Sholat</h3>
        <Checkbox
          label="Jadwal sholat otomatis sesuai lokasi (pakai koordinat di atas)"
          checked={autoPrayer}
          onChange={(e) => setAutoPrayer(e.target.checked)}
        />
        {autoPrayer ? (
          <Select label="Metode perhitungan" value={method} onChange={(e) => setMethod(e.target.value)} options={METHODS} />
        ) : (
          <div className={styles.grid3}>
            {PRAYER_NAMES.map((n) => (
              <Input
                key={n}
                label={n}
                type="time"
                value={times[n]}
                onChange={(e) => setTimes((t) => ({ ...t, [n]: e.target.value }))}
              />
            ))}
          </div>
        )}

        <h3 className={styles.h3}>Teks Berjalan</h3>
        <Textarea label="Isi informasi" value={ticker} onChange={(e) => setTicker(e.target.value)} />

        <div className={styles.btns}>
          <Button variant="primary" fullWidth onClick={handleSave}>
            Simpan
          </Button>
          <Button variant="ghost" fullWidth className={styles.closeBtn} onClick={onClose}>
            Tutup
          </Button>
        </div>
      </div>
    </div>
  )
}

export default SettingsPanel
