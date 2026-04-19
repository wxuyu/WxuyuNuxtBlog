// plugins/service-worker.client.ts
import { defineNuxtPlugin, useAppConfig, useRuntimeConfig } from '#app';
import { useCacheManager } from '~/composables/useCacheManager';

// 关键修改：使用静态 import 语句代替动态 Blob 生成
import swUrl from '../data/sw.ts?worker&url';

export default defineNuxtPlugin((nuxtApp) => {
  const appConfig = useAppConfig();
  const runtimeConfig = useRuntimeConfig();
  
  if (!process.client || !('serviceWorker' in navigator) || !appConfig.cache?.enabled) {
    return;
  }

  const registerSW = async () => {
    try {
      // 直接使用 Vite 构建并提取出来的 Worker URL
      const registration = await navigator.serviceWorker.register(swUrl, {
        scope: '/',
        updateViaCache: 'none', 
      });

      // 向 SW 发送配置（包含超级版本号）
      if (registration.active) {
        registration.active.postMessage({
          type: 'INIT_CONFIG',
          payload: {
            ...appConfig.cache,
            cacheVersion: runtimeConfig.public.cacheVersion,
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