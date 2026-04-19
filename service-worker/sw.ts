import { clientsClaim } from 'workbox-core'
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'

interface CacheConfig {
  permanent: boolean
  maxAge: number
  escapeHatch: string
  enabled: boolean
  extraFileTypes: string[]
  cachePrefix: string
  cachePatterns: RegExp[]
}

declare const self: ServiceWorkerGlobalScope & {
  __CACHE_VERSION__: string
  __APP_CONFIG__: CacheConfig
}

const CACHE_NAME = `${self.__APP_CONFIG__?.cachePrefix || 'nuxt-cache-v'}${self.__CACHE_VERSION__}`
const CACHE_CONFIG: CacheConfig = self.__APP_CONFIG__

// 需要缓存的资源类型
const CACHEABLE_EXTENSIONS = [
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'avif',
  'woff', 'woff2', 'ttf', 'eot',
  ...(CACHE_CONFIG?.extraFileTypes || [])
].map(ext => ext.toLowerCase())

// 缓存策略：仅缓存 GET 请求
const isCacheableRequest = (request: Request): boolean => {
  const url = new URL(request.url)
  
  // 1. 检查是否启用缓存
  if (!CACHE_CONFIG?.enabled) return false
  
  // 2. 检查逃生门
  if (url.searchParams.has(CACHE_CONFIG.escapeHatch)) return false
  
  // 3. 只缓存 GET 请求
  if (request.method !== 'GET') return false
  
  // 4. 检查是否匹配缓存模式
  const matchesPattern = CACHE_CONFIG.cachePatterns?.some(pattern => 
    pattern.test(url.pathname) || pattern.test(url.href)
  ) || false
  
  if (matchesPattern) return true
  
  // 5. 检查文件扩展名
  const extension = url.pathname.split('.').pop()?.toLowerCase() || ''
  return CACHEABLE_EXTENSIONS.includes(extension)
}

// 安装事件 - 立即激活
self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting()
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      // 清理所有旧版本缓存
      const cacheNames = await caches.keys()
      const oldCaches = cacheNames.filter(name => 
        name.startsWith(CACHE_CONFIG?.cachePrefix || 'nuxt-cache-v') && 
        name !== CACHE_NAME
      )
      
      await Promise.all(oldCaches.map(name => caches.delete(name)))
      
      // 立即接管所有客户端
      await self.clients.claim()
      
      // 通知所有客户端更新完成
      const clients = await self.clients.matchAll()
      clients.forEach(client => {
        client.postMessage({
          type: 'SW_ACTIVATED',
          version: self.__CACHE_VERSION__
        })
      })
    })()
  )
})

// 拦截请求
self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request
  
  // 不缓存导航请求（HTML页面）
  if (request.mode === 'navigate') {
    return
  }
  
  if (!isCacheableRequest(request)) {
    return
  }
  
  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME)
      
      // 尝试从缓存获取
      const cachedResponse = await cache.match(request)
      
      if (cachedResponse) {
        // 检查缓存是否过期
        if (!CACHE_CONFIG.permanent && CACHE_CONFIG.maxAge) {
          const cachedDate = new Date(cachedResponse.headers.get('date') || 0)
          const age = Date.now() - cachedDate.getTime()
          
          if (age < CACHE_CONFIG.maxAge) {
            // 缓存有效，返回缓存
            return cachedResponse
          } else {
            // 缓存过期，删除
            await cache.delete(request)
          }
        } else {
          // 永久缓存，直接返回
          return cachedResponse
        }
      }
      
      // 从网络获取
      try {
        const networkResponse = await fetch(request)
        
        // 只缓存成功的响应
        if (networkResponse.ok) {
          // 克隆响应以便缓存
          const responseToCache = networkResponse.clone()
          
          // 异步缓存，不阻塞响应
          cache.put(request, responseToCache).catch(err => {
            console.warn('Cache put failed:', err)
          })
        }
        
        return networkResponse
      } catch (error) {
        // 网络失败，尝试返回缓存（即使过期）
        const fallbackResponse = await cache.match(request)
        if (fallbackResponse) {
          return fallbackResponse
        }
        
        // 返回离线响应
        return new Response('Offline', { 
          status: 503,
          headers: { 'Content-Type': 'text/plain' }
        })
      }
    })()
  )
})

// 监听来自客户端的消息
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  switch (event.data.type) {
    case 'CLEAR_ALL_CACHES':
      clearAllCaches()
      break
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
  }
})

async function clearAllCaches(): Promise<void> {
  const cacheNames = await caches.keys()
  await Promise.all(cacheNames.map(name => caches.delete(name)))
  
  // 通知所有客户端
  const clients = await self.clients.matchAll()
  clients.forEach(client => {
    client.postMessage({ type: 'CACHE_CLEARED' })
  })
}

// 定期清理过期缓存（每24小时）
self.addEventListener('periodicsync', (event: PeriodicSyncEvent) => {
  if (event.tag === 'cleanup-caches') {
    event.waitUntil(cleanupExpiredCaches())
  }
})

async function cleanupExpiredCaches(): Promise<void> {
  const cache = await caches.open(CACHE_NAME)
  const requests = await cache.keys()
  
  for (const request of requests) {
    const response = await cache.match(request)
    if (response) {
      const cachedDate = new Date(response.headers.get('date') || 0)
      const age = Date.now() - cachedDate.getTime()
      
      if (age > (CACHE_CONFIG?.maxAge || Infinity)) {
        await cache.delete(request)
      }
    }
  }
}