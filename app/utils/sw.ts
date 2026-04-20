// src/sw.ts

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// ========== 1. 类型定义 ==========
export interface SwConfig {
  permanent: boolean;
  maxAge: number; // 秒
  escapeDoors: string[]; // 🔼 升级为数组，支持多个逃生门
  extensions: string[];
}

// ========== 2. 版本号生成 (打包时自动固化) ==========
const CACHE_VERSION = (() => {
  // 结合时间戳与 6 位随机数，确保每次打包唯一且无法被浏览器强缓存
  return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;
})();
const CACHE_NAME = `app-assets-${CACHE_VERSION}`;

// ========== 3. 运行时配置存储 ==========
let runtimeConfig: SwConfig | null = null;

// ========== 4. 工具函数 ==========
function isCacheableRequest(url: string): boolean {
  if (!runtimeConfig) return false;
  
  try {
    const { pathname, href } = new URL(url, self.location.origin);
    
    // 🔼 遍历逃生门数组，只要有一个匹配就放行
    if (runtimeConfig.escapeDoors.some(door => door && href.includes(door))) {
      return false;
    }
    
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && runtimeConfig.extensions.includes(ext)) return true;
    
    return false;
  } catch {
    return false;
  }
}

// ========== 5. 生命周期：安装 ==========
self.addEventListener('install', (event: ExtendableEvent) => {
  self.skipWaiting(); 
});

// ========== 6. 生命周期：激活 ==========
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            console.log(`[SW] 清理旧版本缓存: ${name}`);
            return caches.delete(name);
          }
          return undefined;
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// ========== 7. 拦截网络请求 (Fetch) ==========
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  
  if (request.method !== 'GET' || !isCacheableRequest(request.url)) return;

  const fetchAndCache = async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      const networkResponse = await fetch(request);
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone();
        const headers = new Headers(responseClone.headers);
        headers.append('sw-cache-timestamp', Date.now().toString());
        
        const modifiedResponse = new Response(responseClone.body, {
          status: responseClone.status,
          statusText: responseClone.statusText,
          headers
        });
        await cache.put(request, modifiedResponse);
      }
      return networkResponse;
    } catch {
      const cached = await cache.match(request);
      return cached || Response.error();
    }
  };

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      if (cachedResponse) {
        if (runtimeConfig && !runtimeConfig.permanent) {
          const cachedTime = cachedResponse.headers.get('sw-cache-timestamp');
          if (cachedTime && (Date.now() - parseInt(cachedTime, 10) > runtimeConfig.maxAge * 1000)) {
            event.waitUntil(fetchAndCache());
            return cachedResponse; 
          }
        }
        event.waitUntil(fetchAndCache());
        return cachedResponse;
      }

      return await fetchAndCache();
    })
  );
});

// ========== 8. 通信：接收主线程配置与指令 ==========
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event;
  
  if (data.type === 'INIT_CONFIG' && data.payload) {
    runtimeConfig = data.payload;
    console.log('[SW] 配置初始化成功', runtimeConfig);
  }

  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] 手动清除缓存完成');
      })
    );
  }
});