// src/sw.ts

/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// ========== 1. 类型定义 ==========
export interface SwConfig {
  permanent: boolean;
  maxAge: number; // 秒
  escapeDoors: string[]; 
  extensions: string[];
}

// ========== 2. 版本号生成 (由 Vite 构建插件自动注入) ==========
// 我们会通过插件将下方的变量替换为实际内容
let BUILD_VERSION = '__INJECTED_VERSION__';
if (typeof BUILD_VERSION === 'undefined') {
  // 防止在特殊构建环境下报错
  BUILD_VERSION = `${Date.now()}-fallback`;
}

const CACHE_VERSION = BUILD_VERSION;
const CACHE_NAME = `app-assets-${CACHE_VERSION}`;

// ========== 3. 运行时配置存储 ==========
let runtimeConfig: SwConfig | null = null;

// ========== 4. 工具函数 ==========
function isCacheableRequest(url: string): boolean {
  if (!runtimeConfig) return false;
  
  try {
    const { pathname, href } = new URL(url, self.location.origin);
    
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