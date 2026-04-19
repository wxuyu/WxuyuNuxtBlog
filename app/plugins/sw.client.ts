// plugins/service-worker.client.ts
import { defineNuxtPlugin } from '#app'

export default defineNuxtPlugin(() => {
  if (!process.client || !('serviceWorker' in navigator)) {
    return
  }

  const registerSW = async () => {
    try {
      // 直接注册 public 目录下的 sw.ts，拥有合法的同源 URL
      const registration = await navigator.serviceWorker.register('/sw.ts', {
        scope: '/',
        updateViaCache: 'none'
      })

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // 检测到新版本，触发 UI 提示
              const cacheManager = useCacheManager()
              cacheManager.showUpdateNotification()
            }
          })
        }
      })
    } catch (error) {
      console.error('[SW] Registration failed:', error)
    }
  }

  if (document.readyState === 'complete') {
    registerSW()
  } else {
    window.addEventListener('load', registerSW)
  }
})