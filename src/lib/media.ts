// Format media yang boleh di-upload lewat endpoint /media.
//
// Daftar ini harus cocok dengan aturan `mimetypes` di MediaController: format
// di luar daftar ditolak backend, jadi menyaringnya di sini mencegah upload
// file besar gagal sia-sia dengan pesan error yang membingungkan.
//
// MOV boleh di-upload walau tidak bisa diputar semua browser — backend
// otomatis mengubahnya jadi MP4 saat masuk. Format video lain (MKV, AVI)
// tidak didukung dan harus di-convert dulu, mis:
//   ffmpeg -i video.mkv -c:v libx264 -c:a aac video.mp4
//
// Catatan: pengecekan di sini hanya menebak dari nama & tipe yang dilaporkan
// browser, yang keduanya berbasis ekstensi. File salah label (mis. MOV yang
// di-rename jadi .mp4) hanya bisa ditangkap backend, yang membaca isi file.

/** Nilai atribut `accept` untuk input file. */
export const VIDEO_ACCEPT = '.mp4,.webm,.mov,video/mp4,video/webm,video/quicktime'
export const IMAGE_ACCEPT =
  '.jpg,.jpeg,.png,.webp,.gif,image/jpeg,image/png,image/webp,image/gif'
export const MEDIA_ACCEPT = `${IMAGE_ACCEPT},${VIDEO_ACCEPT}`

const VIDEO_EXT = /\.(mp4|webm|mov)$/i
const IMAGE_EXT = /\.(jpe?g|png|webp|gif)$/i
const VIDEO_MIME = ['video/mp4', 'video/webm', 'video/quicktime']
const IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Cek ekstensi ATAU tipe: sebagian browser mengirim `type` kosong untuk file
// tertentu, dan sebaliknya nama file tidak selalu berekstensi. Backend tetap
// memeriksa isi file, jadi cek di sini cukup untuk menyaring lebih awal.
export const isVideoFile = (f: File): boolean =>
  VIDEO_EXT.test(f.name) || VIDEO_MIME.includes(f.type)

export const isImageFile = (f: File): boolean =>
  IMAGE_EXT.test(f.name) || IMAGE_MIME.includes(f.type)

export const isSupportedMedia = (f: File): boolean =>
  isVideoFile(f) || isImageFile(f)
