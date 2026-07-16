import type { Footer } from '../../../lib/config'
import styles from './DisplayFooter.module.css'

export interface DisplayFooterProps {
  footer: Footer
  /** Kelas penempatan dari layout induk (mis. posisi di grid). */
  className?: string
}

/**
 * Footer biru bawah berisi identitas & kontak unit. Dipakai layout MCU dan
 * Walidah; penempatannya diatur induk lewat `className`.
 */
function DisplayFooter({ footer: f, className }: DisplayFooterProps) {
  return (
    <footer className={[styles.footer, className].filter(Boolean).join(' ')}>
      {(f.name || f.address) && (
        <div className={styles.fItem}>
          <img className={styles.fLogo} src="/logo-rsijpk.jpg" alt="RSIJPK" />
          <div className={styles.fText}>
            {f.name && <div className={styles.fStrong}>{f.name}</div>}
            {f.address && <div className={styles.fSub}>{f.address}</div>}
          </div>
        </div>
      )}
      {f.phone && (
        <div className={styles.fItem}>
          <span className={styles.fIcon}>📞</span>
          <div className={styles.fText}>
            <div className={styles.fSub}>Informasi & Reservasi</div>
            <div className={styles.fStrong}>{f.phone}</div>
          </div>
        </div>
      )}
      {f.website && (
        <div className={styles.fItem}>
          <span className={styles.fIcon}>🌐</span>
          <div className={styles.fText}>
            <div className={styles.fSub}>Kunjungi Website Kami</div>
            <div className={styles.fStrong}>
              {f.website.replace(/^https?:\/\//, '').replace(/\/+$/, '')}
            </div>
          </div>
        </div>
      )}
    </footer>
  )
}

export default DisplayFooter
