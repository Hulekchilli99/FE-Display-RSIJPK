export const HARI = [
  'Minggu',
  'Senin',
  'Selasa',
  'Rabu',
  'Kamis',
  'Jumat',
  'Sabtu',
]

export const BULAN = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

const pad = (n: number) => String(n).padStart(2, '0')

export function formatTime(d: Date) {
  return {
    hhmm: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
    ss: pad(d.getSeconds()),
  }
}

export function formatDate(d: Date) {
  return `${HARI[d.getDay()]}, ${d.getDate()} ${BULAN[d.getMonth()]} ${d.getFullYear()}`
}
