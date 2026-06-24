import { DISPLAYS, currentSlug, displayUrl } from '../../../lib/config'
import { Select } from '../../atoms/Select'

/**
 * Pemilih display di panel pengaturan. Berpindah display memuat ulang layar
 * dengan URL yang sesuai (mis. `?display=mcu`).
 */
function DisplaySwitcher() {
  const slug = currentSlug()
  return (
    <Select
      label="Tampilan ini"
      value={slug}
      onChange={(e) => {
        const next = e.target.value
        if (next !== slug) location.assign(displayUrl(next))
      }}
      options={DISPLAYS.map((d) => ({ value: d.slug, label: d.label }))}
      hint="Pilih tampilan yang ingin diatur. Berpindah akan memuat ulang layar."
    />
  )
}

export default DisplaySwitcher
