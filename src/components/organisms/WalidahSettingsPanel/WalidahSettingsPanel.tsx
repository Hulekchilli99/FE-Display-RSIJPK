import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { Config } from '../../../lib/config'
import { displayFor } from '../../../lib/config'
import { apiLogin, apiLogout, apiUploadVideos, isAuthed } from '../../../lib/api'
import { VIDEO_ACCEPT, isVideoFile } from '../../../lib/media'
import { Button } from '../../atoms/Button'
import { Input } from '../../atoms/Input'
import { Checkbox } from '../../atoms/Checkbox'
import { DisplaySwitcher } from '../../molecules/DisplaySwitcher'
import { FooterFields } from '../../molecules/FooterFields'
import styles from '../SettingsPanel/SettingsPanel.module.css'

export interface WalidahSettingsPanelProps {
  cfg: Config
  onSave: (cfg: Config) => Promise<void> | void
  onClose: () => void
}

/**
 * Pengaturan untuk unit ber-design Walidah (satu frame video upload).
 */
function WalidahSettingsPanel({ cfg, onSave, onClose }: WalidahSettingsPanelProps) {
  const display = displayFor(cfg.slug)
  const [name, setName] = useState(cfg.name)
  const [sound, setSound] = useState(cfg.ytSound)
  const [footerOn, setFooterOn] = useState(cfg.footerOn)
  const [footer, setFooter] = useState({ ...cfg.footer })

  const [pendingFiles, setPendingFiles] = useState<File[] | null>(null)
  const [fileInfo, setFileInfo] = useState(
    cfg.videos.length
      ? `🎬 ${cfg.videos.length} video tersimpan. Pilih lagi untuk mengganti.`
      : 'Mendukung MP4, MOV & WebM. Tekan Ctrl saat memilih untuk memilih beberapa video.',
  )
  // Ada file yang dilewati karena formatnya tidak bisa diputar di layar.
  const [adaDitolak, setAdaDitolak] = useState(false)

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

  function onVideoFiles(e: ChangeEvent<HTMLInputElement>) {
    const picked = Array.from(e.target.files || [])
    if (!picked.length) return

    // Urutkan sendiri agar urutan putar pasti (urutan FileList dari browser
    // tidak dijamin). "video2" sebelum "video10" -> numeric: true.
    const files = picked
      .filter(isVideoFile)
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }))
    const ditolak = picked.filter((f) => !isVideoFile(f))

    setPendingFiles(files.length ? files : null)
    setAdaDitolak(ditolak.length > 0)

    const tolakInfo = ditolak.length
      ? `⚠️ Dilewati (didukung: MP4, MOV, WebM): ${ditolak
          .map((f) => f.name)
          .join(', ')}. Convert dulu ke MP4.`
      : ''
    const pilihInfo = files.length
      ? `🎬 ${files.length} video dipilih, urut sesuai nama file: ${files
          .map((f) => f.name)
          .join(', ')}`
      : ''

    setFileInfo([pilihInfo, tolakInfo].filter(Boolean).join(' — '))
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
      type: 'walidah',
      name: name.trim() || display.name,
      ytSound: sound,
      footerOn,
      footer: {
        name: (footer.name ?? '').trim(),
        address: (footer.address ?? '').trim(),
        phone: (footer.phone ?? '').trim(),
        website: (footer.website ?? '').trim(),
      },
    }

    try {
      if (pendingFiles) {
        next.videos = await apiUploadVideos(pendingFiles, (i, total) =>
          setFileInfo(`⏳ Mengupload video ${i + 1} dari ${total}…`),
        )
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
        <h2 className={styles.h2}>
          ⚙️ Pengaturan Display {display.icon} {display.name}
        </h2>

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

        <h3 className={styles.h3}>Video</h3>
        <Input
          label="Upload video (MP4 / MOV / WebM, boleh banyak sekaligus)"
          type="file"
          accept={VIDEO_ACCEPT}
          multiple
          onChange={onVideoFiles}
          hint={fileInfo}
          error={adaDitolak}
        />
        <p className={styles.note}>
          Lebih dari satu video akan diputar bergantian berurutan, lalu kembali
          ke video pertama. Memilih file baru mengganti seluruh daftar. File MOV
          otomatis diubah ke MP4 saat upload — prosesnya bisa agak lama untuk
          file besar. Format lain (MKV, AVI) belum didukung.
        </p>
        <Checkbox
          label="Putar suara video"
          checked={sound}
          onChange={(e) => setSound(e.target.checked)}
        />
        <p className={styles.note}>
          Browser memblokir suara otomatis. Suara baru keluar setelah layar
          disentuh/klik sekali — atau jalankan browser kiosk dengan flag{' '}
          <code>--autoplay-policy=no-user-gesture-required</code> agar langsung
          bersuara.
        </p>

        <h3 className={styles.h3}>Footer Bawah</h3>
        <FooterFields
          on={footerOn}
          onToggle={setFooterOn}
          footer={footer}
          onChange={setFooter}
        />

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

export default WalidahSettingsPanel
