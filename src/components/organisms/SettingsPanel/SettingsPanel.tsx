import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { BgType, Config, Iqomah, PrayerTimes } from '../../../lib/config'
import { DEFAULT, IQOMAH_NAMES, PRAYER_NAMES } from '../../../lib/config'
import {
  apiLogin,
  apiLogout,
  apiUploadMedia,
  apiUploadSlides,
  isAuthed,
} from '../../../lib/api'
import { isYoutube } from '../../../lib/youtube'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Select } from '../../atoms/Select'
import { Textarea } from '../../atoms/Textarea'
import { Checkbox } from '../../atoms/Checkbox'
import { DisplaySwitcher } from '../../molecules/DisplaySwitcher'
import styles from './SettingsPanel.module.css'

export interface SettingsPanelProps {
  cfg: Config
  onSave: (cfg: Config) => Promise<void> | void
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
  const [bgUrl, setBgUrl] = useState(isYoutube(cfg.bg) ? cfg.bg : '')
  const [bgType, setBgType] = useState<BgType>(cfg.bgType)
  const [slideSec, setSlideSec] = useState(String(cfg.slideSec || 6))
  const [ytSound, setYtSound] = useState(cfg.ytSound)
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
  const [iqomah, setIqomah] = useState<Iqomah>({ ...DEFAULT.iqomah, ...cfg.iqomah })

  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [pendingType, setPendingType] = useState<BgType | null>(null)
  const [pendingSlides, setPendingSlides] = useState<File[] | null>(null)
  const [preview, setPreview] = useState<string | null>(
    cfg.bgType === 'image' && cfg.bg ? cfg.bg : null,
  )
  const [fileInfo, setFileInfo] = useState(
    'Mendukung gambar (JPG, PNG) & video (MP4, WebM). Atau tempel URL di bawah.',
  )
  const [slidesInfo, setSlidesInfo] = useState(
    cfg.slides.length
      ? `🖼️ ${cfg.slides.length} gambar slideshow tersimpan. Pilih lagi untuk mengganti.`
      : 'Tekan Ctrl saat memilih untuk memilih beberapa gambar.',
  )

  // Status login admin & proses simpan.
  const [authed, setAuthed] = useState(isAuthed())
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    setBusy(true)
    setError(null)
    try {
      await apiLogin(email.trim(), password)
      setAuthed(true)
      setPassword('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login gagal.')
    } finally {
      setBusy(false)
    }
  }

  async function handleLogout() {
    await apiLogout()
    setAuthed(false)
  }

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
    if (!authed) {
      setError('Login admin dulu untuk menyimpan.')
      return
    }
    setBusy(true)
    setError(null)

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
      ytSound,
    }

    try {
      const url = bgUrl.trim()
      if (bgType === 'slideshow') {
        // Slideshow tidak pakai bg tunggal -> buang link/YouTube lama.
        next.bg = ''
        if (pendingSlides) {
          next.slides = await apiUploadSlides(pendingSlides)
        }
      } else if (url) {
        next.bg = url
        next.bgType = isYoutube(url) ? 'youtube' : bgType
      } else if (pendingFile && pendingType) {
        const res = await apiUploadMedia(pendingFile)
        next.bg = res.url
        next.bgType = res.type === 'video' ? 'video' : pendingType
      } else if (bgType !== 'youtube' && isYoutube(next.bg)) {
        // Pindah dari YouTube ke tipe lain tanpa isi sumber baru -> bersihkan link.
        next.bg = ''
      }

      if (!autoPrayer) next.times = { ...times }
      next.iqomah = { ...iqomah }

      await onSave(next)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menyimpan.')
    } finally {
      setBusy(false)
    }
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

        <DisplaySwitcher />

        {!authed ? (
          <>
            <h3 className={styles.h3}>Login Admin</h3>
            <p className={styles.note}>
              Login untuk mengubah & menyimpan pengaturan. Tampilan layar tetap
              berjalan tanpa login.
            </p>
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button variant="primary" fullWidth onClick={handleLogin} disabled={busy}>
              {busy ? 'Masuk…' : 'Login'}
            </Button>
            {error && <p className={styles.error}>{error}</p>}
          </>
        ) : (
          <p className={styles.note}>
            ✅ Login sebagai admin.{' '}
            <button type="button" className={styles.linkBtn} onClick={handleLogout}>
              Logout
            </button>
          </p>
        )}

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
        {(bgType === 'youtube' || isYoutube(bgUrl)) && (
          <>
            <Checkbox
              label="Putar suara YouTube (live/video latar)"
              checked={ytSound}
              onChange={(e) => setYtSound(e.target.checked)}
            />
            <p className={styles.note}>
              Browser memblokir suara otomatis. Suara baru keluar setelah layar
              disentuh/klik sekali — atau jalankan browser kiosk dengan flag{' '}
              <code>--autoplay-policy=no-user-gesture-required</code> agar langsung
              bersuara.
            </p>
          </>
        )}
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

        <h3 className={styles.h3}>Jeda Adzan → Iqomah (menit)</h3>
        <p className={styles.note}>
          Lama hitung mundur setelah adzan sampai iqomah, per sholat.
        </p>
        <div className={styles.grid3}>
          {IQOMAH_NAMES.map((n) => (
            <Input
              key={n}
              label={n}
              type="number"
              min={0}
              max={120}
              value={String(iqomah[n] ?? 0)}
              onChange={(e) =>
                setIqomah((q) => ({ ...q, [n]: parseInt(e.target.value, 10) || 0 }))
              }
            />
          ))}
        </div>

        <h3 className={styles.h3}>Teks Berjalan</h3>
        <Textarea label="Isi informasi" value={ticker} onChange={(e) => setTicker(e.target.value)} />

        {error && authed && <p className={styles.error}>{error}</p>}
        <div className={styles.btns}>
          <Button
            variant="primary"
            fullWidth
            onClick={handleSave}
            disabled={busy || !authed}
          >
            {busy ? 'Menyimpan…' : 'Simpan'}
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
