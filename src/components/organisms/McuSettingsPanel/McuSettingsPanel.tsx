import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Config } from '../../../lib/config'
import { apiLogin, apiLogout, apiUploadSlides, isAuthed } from '../../../lib/api'
import { isYoutube } from '../../../lib/youtube'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Checkbox } from '../../atoms/Checkbox'
import { DisplaySwitcher } from '../../molecules/DisplaySwitcher'
import styles from '../SettingsPanel/SettingsPanel.module.css'

export interface McuSettingsPanelProps {
  cfg: Config
  onSave: (cfg: Config) => Promise<void> | void
  onClose: () => void
}

/** Pengaturan untuk tampilan unit MCU (kiri slideshow, kanan YouTube). */
function McuSettingsPanel({ cfg, onSave, onClose }: McuSettingsPanelProps) {
  const [name, setName] = useState(cfg.name)
  const [leftSlideSec, setLeftSlideSec] = useState(String(cfg.leftSlideSec || 6))
  const [rightYoutube, setRightYoutube] = useState(cfg.rightYoutube)
  const [rightSound, setRightSound] = useState(cfg.rightSound)
  const [footerOn, setFooterOn] = useState(cfg.footerOn)
  const [footer, setFooter] = useState({ ...cfg.footer })

  const [pendingSlides, setPendingSlides] = useState<File[] | null>(null)
  const [slidesInfo, setSlidesInfo] = useState(
    cfg.leftSlides.length
      ? `🖼️ ${cfg.leftSlides.length} gambar slideshow tersimpan. Pilih lagi untuk mengganti.`
      : 'Tekan Ctrl saat memilih untuk memilih beberapa gambar.',
  )

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
      type: 'mcu',
      name: name.trim() || 'MCU',
      leftSlideSec: parseInt(leftSlideSec, 10) || 6,
      rightYoutube: rightYoutube.trim(),
      rightSound,
      footerOn,
      footer: {
        name: footer.name.trim(),
        address: footer.address.trim(),
        phone: footer.phone.trim(),
        website: footer.website.trim(),
      },
    }

    try {
      if (pendingSlides) {
        next.leftSlides = await apiUploadSlides(pendingSlides)
      }
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
        <h2 className={styles.h2}>⚙️ Pengaturan Display MCU</h2>

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

        <h3 className={styles.h3}>Identitas</h3>
        <Input label="Nama Unit" value={name} onChange={(e) => setName(e.target.value)} />

        <h3 className={styles.h3}>Slideshow (kolom kiri)</h3>
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
          value={leftSlideSec}
          onChange={(e) => setLeftSlideSec(e.target.value)}
        />

        <h3 className={styles.h3}>Video YouTube (kolom kanan)</h3>
        <Input
          label="Link YouTube (Live / Video)"
          type="text"
          placeholder="https://youtube.com/..."
          value={rightYoutube}
          onChange={(e) => setRightYoutube(e.target.value)}
          hint={
            rightYoutube && !isYoutube(rightYoutube)
              ? 'Sepertinya bukan link YouTube yang valid.'
              : 'Tempel link live atau video YouTube.'
          }
          error={!!rightYoutube && !isYoutube(rightYoutube)}
        />
        <Checkbox
          label="Putar suara YouTube"
          checked={rightSound}
          onChange={(e) => setRightSound(e.target.checked)}
        />
        <p className={styles.note}>
          Browser memblokir suara otomatis. Suara baru keluar setelah layar
          disentuh/klik sekali — atau jalankan browser kiosk dengan flag{' '}
          <code>--autoplay-policy=no-user-gesture-required</code> agar langsung
          bersuara.
        </p>

        <h3 className={styles.h3}>Footer Bawah</h3>
        <Checkbox
          label="Tampilkan footer biru di bawah layar"
          checked={footerOn}
          onChange={(e) => setFooterOn(e.target.checked)}
        />
        {footerOn && (
          <>
            <Input
              label="Nama Unit / Rumah Sakit"
              placeholder="SehatMitra Hospital"
              value={footer.name}
              onChange={(e) => setFooter((f) => ({ ...f, name: e.target.value }))}
            />
            <Input
              label="Alamat"
              placeholder="Jl. Sehat Selalu No. 123, Kota Sejahtera"
              value={footer.address}
              onChange={(e) => setFooter((f) => ({ ...f, address: e.target.value }))}
            />
            <Input
              label="Telepon (Informasi & Reservasi)"
              placeholder="021-1234-5678"
              value={footer.phone}
              onChange={(e) => setFooter((f) => ({ ...f, phone: e.target.value }))}
            />
            <Input
              label="Website"
              placeholder="www.sehatmitra.co.id"
              value={footer.website}
              onChange={(e) => setFooter((f) => ({ ...f, website: e.target.value }))}
            />
          </>
        )}

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

export default McuSettingsPanel
