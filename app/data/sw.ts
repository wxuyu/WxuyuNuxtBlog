// workers/sw.ts
import { clientsClaim } from 'workbox-core';
import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, StaleWhileRevalidate, NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// 声明全局变量类型
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ url: string; revision: string | null }>;
  __APP_CONFIG__: {
    enabled: boolean;
    cachePrefix: string;
    cacheVersion: string; // 接收 120 位的超级版本号
    maxAgeSeconds: number;
    maxEntries: number;
    extraFileTypes: string[];
  };
};

// 1. 缓存名称优化：使用外部传入的唯一标识符
const CACHE_NAME = `${self.__APP_CONFIG__?.cachePrefix || 'nuxt-ultimate-cache'}-${self.__APP_CONFIG__?.cacheVersion || Date.now()}`;

// 2. 立即接管页面，无需刷新
clientsClaim();

// 3. 清理旧版本的预缓存文件
cleanupOutdatedCaches();

/**
 * 动态决定是否应用缓存策略
 * @param request FetchEvent 的请求对象
 * @returns boolean
 */
const shouldHandleRequest = (request: Request): boolean => {
  const config = self.__APP_CONFIG__;
  
  // 如果配置未加载或缓存被禁用，直接跳过
  if (!config || !config.enabled) return false;
  
  const url = new URL(request.url);
  
  // 只处理 GET 请求
  if (request.method !== 'GET') return false;
  
  // 排除 Chrome 扩展和第三方非必要请求
  if (url.protocol === 'chrome-extension:') return false;
  
  return true;
};

// 4. 预缓存 Nuxt SSG 生成的静态资源 (manifest 由打包工具自动注入)
precacheAndRoute(self.__WB_MANIFEST || []);

// 5. 注册路由策略：图片和字体 (Cache First)
registerRoute(
  ({ request, url }) => {
    if (!shouldHandleRequest(request)) return false;
    
    const isImage = request.destination === 'image' || 
                    /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);
    const isFont = request.destination === 'font' || 
                   /\.(woff2?|ttf|eot|otf)$/i.test(url.pathname);
                   
    return isImage || isFont;
  },
  new CacheFirst({
    cacheName: `${CACHE_NAME}-assets`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: self.__APP_CONFIG__?.maxEntries || 200,
        maxAgeSeconds: self.__APP_CONFIG__?.maxAgeSeconds || 30 * 24 * 60 * 60, // 默认30天
      }),
    ],
  })
);

// 6. 注册路由策略：Google Fonts API (Stale While Revalidate)
registerRoute(
  ({ url }) => url.origin === 'https://fonts.googleapis.com' || url.origin === 'https://fonts.gstatic.com',
  new StaleWhileRevalidate({
    cacheName: `${CACHE_NAME}-google-fonts`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 7 * 24 * 60 * 60, // 7天
      }),
    ],
  })
);

// 7. 注册路由策略：API 请求或动态内容 (Network First)
registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new NetworkFirst({
    cacheName: `${CACHE_NAME}-resources`,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60, // 1天
      }),
    ],
    networkTimeoutSeconds: 3, // 如果3秒内网络无响应，则使用缓存
  })
);

// 8. 监听消息事件，用于与客户端通信
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (!event.data) return;

  switch (event.data.type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
      
    case 'CLEAR_ALL_CACHES':
      event.waitUntil(
        (async () => {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(name => caches.delete(name))
          );
          
          // 通知所有客户端清除完成
          const clients = await self.clients.matchAll();
          clients.forEach(client => {
            client.postMessage({ type: 'CACHE_CLEARED' });
          });
        })()
      );
      break;
  }
});

// 9. 激活时清理兜底：确保万无一失
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      const validCacheNames = new Set([CACHE_NAME, `${CACHE_NAME}-assets`, `${CACHE_NAME}-google-fonts`, `${CACHE_NAME}-resources`]);
      
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!validCacheNames.has(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })()
  );
});