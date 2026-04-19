// composables/useCacheManager.ts
import { ref, reactive, computed } from 'vue'

interface CacheState {
  showUpdatePrompt: boolean
  isClearing: boolean
  lastCleared: number | null
  currentVersion: string
  updateAvailable: boolean
}

// --- 核心修复：安全的控制器获取函数 ---
/**
 * 安全地获取 Service Worker 控制器
 * 如果当前 controller 为 null，则监听 'controllerchange' 事件等待其就绪
 */
const safeGetController = (): Promise<ServiceWorker> => {
  return new Promise((resolve, reject) => {
    // 如果已经有激活的控制器，直接返回
    if (navigator.serviceWorker.controller) {
      resolve(navigator.serviceWorker.controller)
      return
    }

    // 否则，设置一个超时并等待控制器变更
    const timeout = setTimeout(() => {
      reject(new Error('Service Worker controller 获取超时'))
    }, 5000) // 5秒超时

    navigator.serviceWorker.addEventListener('controllerchange', function onControllerChange() {
      if (navigator.serviceWorker.controller) {
        clearTimeout(timeout)
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange)
        resolve(navigator.serviceWorker.controller)
      }
    })
  })
}

export const useCacheManager = () => {
  const state = reactive<CacheState>({
    showUpdatePrompt: false,
    isClearing: false,
    lastCleared: null,
    currentVersion: '',
    updateAvailable: false
  })
  
  const runtimeConfig = useRuntimeConfig()
  
  // 计算属性：距离上次清除是否超过24小时
  const shouldAutoClear = computed(() => {
    if (!state.lastCleared) return true
    const hoursSinceClear = (Date.now() - state.lastCleared) / (1000 * 60 * 60)
    return hoursSinceClear > 24
  })
  
  const showUpdateNotification = () => {
    state.updateAvailable = true
    state.showUpdatePrompt = true
  }
  
  /**
   * 清除所有缓存的核心方法
   */
  const clearAllCaches = async (): Promise<void> => {
    if (state.isClearing) return
    
    state.isClearing = true
    
    try {
      // 1. 安全地获取 Service Worker 控制器并发送清除指令
      const controller = await safeGetController()
      controller.postMessage({ type: 'CLEAR_ALL_CACHES' })
      
      // 2. 清除浏览器 Cache API (以防万一)
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(name => caches.delete(name))
        )
      }
      
      // 3. 清除 localStorage 中的缓存标记
      localStorage.removeItem('sw-cache-version')
      
      // 4. 更新状态
      state.lastCleared = Date.now()
      state.showUpdatePrompt = false
      state.updateAvailable = false
      
      // 5. 延迟刷新，确保缓存已清除且 SW 有时间处理
      setTimeout(() => {
        window.location.reload()
      }, 500)
      
    } catch (error) {
      console.error('[Cache] Clear failed:', error)
      // 如果 SW 通信失败，尝试手动兜底清除
      await fallbackClear()
    } finally {
      state.isClearing = false
    }
  }

  /**
   * 兜底清除方案：当 SW 不可用时直接清理本地存储并刷新
   */
  const fallbackClear = async () => {
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(cacheNames.map(name => caches.delete(name)))
      }
      localStorage.clear()
      window.location.reload()
    } catch (e) {
      console.error('[Cache] Fallback clear failed:', e)
    }
  }
  
  const dismissUpdate = () => {
    state.showUpdatePrompt = false
  }
  
  const onCacheCleared = () => {
    state.isClearing = false
    state.lastCleared = Date.now()
  }
  
  /**
   * 处理 Service Worker 激活消息
   * @param version 当前激活的版本号
   */
  const onSWActivated = async (version: string) => {
    state.currentVersion = version
    localStorage.setItem('sw-cache-version', version)
    
    // 验证当前控制器是否为最新版本
    try {
      const controller = await safeGetController()
      // 可以在这里添加额外的验证逻辑，如果需要的话
    } catch (error) {
      console.warn('[Cache] Unable to verify SW controller after activation:', error)
    }
  }
  
  // 初始化检查
  const init = () => {
    // 确保只在客户端执行
    if (!process.client) return
    
    const storedVersion = localStorage.getItem('sw-cache-version')
    const currentVersion = useRuntimeConfig().public.appVesion
    
    if (storedVersion && storedVersion !== currentVersion) {
      showUpdateNotification()
    }
  }
  
  // 在组件挂载时初始化
  if (process.client) {
    init()
  }
  
  return {
    state,
    showUpdateNotification,
    clearAllCaches,
    dismissUpdate,
    onCacheCleared,
    onSWActivated
  }
}