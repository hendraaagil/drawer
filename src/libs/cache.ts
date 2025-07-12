import { cacheExpirationInHours } from './constant'

interface CacheData {
  coordinates: number[][][]
  colours: number[][]
  timestamp: number
  image: string
}

class DrawingCache {
  private dbName = 'image-cache'
  private version = 1
  private storeName = 'images'
  private db: IDBDatabase | null = null
  private readonly CACHE_EXPIRY_MS = cacheExpirationInHours * 60 * 60 * 1000 // 24 hours in milliseconds

  async init(): Promise<void> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, {
            keyPath: 'image',
          })
          store.createIndex('timestamp', 'timestamp', { unique: false })
        }
      }
    })
  }

  async get(image: string): Promise<CacheData | null> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(image)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const result = request.result
        if (result) {
          const now = Date.now()
          const age = now - result.timestamp

          // Check if cache is expired
          if (age > this.CACHE_EXPIRY_MS) {
            // Cache is expired, delete it and return null
            this.delete(image).catch(console.error)
            resolve(null)
          } else {
            // Cache is still valid
            resolve(result)
          }
        } else {
          resolve(null)
        }
      }
    })
  }

  async set(
    image: string,
    coordinates: number[][][],
    colours: number[][],
  ): Promise<void> {
    if (!this.db) await this.init()

    const data: CacheData = {
      image,
      coordinates,
      colours,
      timestamp: Date.now(),
    }

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.put(data)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async delete(image: string): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(image)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async clearExpired(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const allEntries = request.result
        const now = Date.now()
        const expiredEntries = allEntries.filter(
          (entry) => now - entry.timestamp > this.CACHE_EXPIRY_MS,
        )

        // Delete expired entries
        const deletePromises = expiredEntries.map((entry) =>
          this.delete(entry.image),
        )

        Promise.all(deletePromises)
          .then(() => resolve())
          .catch(reject)
      }
    })
  }

  async getCacheStats(): Promise<{
    totalEntries: number
    expiredEntries: number
    validEntries: number
  }> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        const allEntries = request.result
        const now = Date.now()
        const expiredEntries = allEntries.filter(
          (entry) => now - entry.timestamp > this.CACHE_EXPIRY_MS,
        )

        resolve({
          totalEntries: allEntries.length,
          expiredEntries: expiredEntries.length,
          validEntries: allEntries.length - expiredEntries.length,
        })
      }
    })
  }

  async clear(): Promise<void> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db!.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }
}

export const drawingCache = new DrawingCache()
