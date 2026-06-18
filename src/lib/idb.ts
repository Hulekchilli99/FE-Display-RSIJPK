// Penyimpanan media (gambar/video besar) di IndexedDB.

function idbOpen(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('masjidMedia', 1)
    req.onupgradeneeded = () => req.result.createObjectStore('media')
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readwrite')
    tx.objectStore('media').put(value, key)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

export async function idbGet<T = unknown>(key: string): Promise<T | null> {
  const db = await idbOpen()
  return new Promise((resolve, reject) => {
    const tx = db.transaction('media', 'readonly')
    const r = tx.objectStore('media').get(key)
    r.onsuccess = () => resolve((r.result as T) ?? null)
    r.onerror = () => reject(r.error)
  })
}
