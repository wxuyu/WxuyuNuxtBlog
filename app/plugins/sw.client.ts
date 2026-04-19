// plugins/service-worker.client.ts
import { defineNuxtPlugin, useAppConfig, useRuntimeConfig } from '#app';
import { useCacheManager } from '~/composables/useCacheManager';

export default defineNuxtPlugin((nuxtApp) => {
  const appConfig = useAppConfig();
  const runtimeConfig = useRuntimeConfig();
  
  if (!process.client || !('serviceWorker' in navigator) || !appConfig.cache?.enabled) {
    return;
  }

  const registerSW = async () => {
    try {
      // 动态导入 SW 代码并内联注册
      const swModule = await import('../data/sw.ts?raw');
      const blob = new Blob([swModule.default], { type: 'application/javascript' });
      const swUrl = URL.createObjectURL(blob);

      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none', 
      });

      URL.revokeObjectURL(swUrl);

      // 向 SW 发送配置（包含超级版本号）
      if (registration.active) {
        registration.active.postMessage({
          type: 'INIT_CONFIG',
          payload: {
            ...appConfig.cache,
            cacheVersion: useRuntimeConfig().public.appVesion, // 传入 120 位随机数
            maxAgeSeconds: (appConfig.cache.maxAge || 7 * 24 * 60 * 60 * 1000) / 1000,
          },
        });
      }

      // 监听更新
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const cacheManager = useCacheManager();
              cacheManager.showUpdateNotification();
            }
          });
        }
      });

    } catch (error) {
      console.error('[SW] Registration failed:', error);
    }
  };

  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
});