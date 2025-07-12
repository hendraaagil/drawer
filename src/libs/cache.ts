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
        resolve(request.result || null)
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
