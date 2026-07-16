import type { Footer } from '../../../lib/config'
import { Checkbox } from '../../atoms/Checkbox'
import { Input } from '../../atoms/Input'

export interface FooterFieldsProps {
  /** Tampilkan footer di layar display. */
  on: boolean
  onToggle: (on: boolean) => void
  footer: Footer
  onChange: (footer: Footer) => void
}

/**
 * Bagian pengaturan footer biru bawah. Dipakai panel MCU & Walidah.
 */
function FooterFields({ on, onToggle, footer, onChange }: FooterFieldsProps) {
  const set = (patch: Partial<Footer>) => onChange({ ...footer, ...patch })

  return (
    <>
      <Checkbox
        label="Tampilkan footer biru di bawah layar"
        checked={on}
        onChange={(e) => onToggle(e.target.checked)}
      />
      {on && (
        <>
          <Input
            label="Nama Unit / Rumah Sakit"
            placeholder="SehatMitra Hospital"
            value={footer.name}
            onChange={(e) => set({ name: e.target.value })}
          />
          <Input
            label="Alamat"
            placeholder="Jl. Sehat Selalu No. 123, Kota Sejahtera"
            value={footer.address}
            onChange={(e) => set({ address: e.target.value })}
          />
          <Input
            label="Telepon (Informasi & Reservasi)"
            placeholder="021-1234-5678"
            value={footer.phone}
            onChange={(e) => set({ phone: e.target.value })}
          />
          <Input
            label="Website"
            placeholder="www.sehatmitra.co.id"
            value={footer.website}
            onChange={(e) => set({ website: e.target.value })}
          />
        </>
      )}
    </>
  )
}

export default FooterFields
