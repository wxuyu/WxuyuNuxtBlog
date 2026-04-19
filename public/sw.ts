// 核心修复：告诉 TypeScript，当前环境是 Service Worker，不是普通 Window
/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope;

// ========== 1. 类型定义 ==========
interface SwConfig {
  permanent: boolean;
  maxAge: number; // 秒
  escapeDoor: string;
  extensions: string[];
}

// ========== 2. 动态注入的版本号 ==========
// 构建时，此字符串将被 Vite 插件自动替换为当前时间戳
const CACHE_VERSION = `Service_WorkerV${Date.now().toString}`; 
const CACHE_NAME = `app-assets-${CACHE_VERSION}`;

// ========== 3. 运行时配置存储 ==========
let runtimeConfig: SwConfig | null = null;

// ========== 4. 工具函数 ==========
function isCacheableRequest(url: string): boolean {
  if (!runtimeConfig) return false;
  
  try {
    const { pathname, href } = new URL(url, self.location.origin);
    
    // 拦截逃生门
    if (runtimeConfig.escapeDoor && href.includes(runtimeConfig.escapeDoor)) return false;
    
    // 检查文件后缀
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && runtimeConfig.extensions.includes(ext)) return true;
    
    return false;
  } catch {
    return false;
  }
}

// ========== 5. 生命周期：安装 ==========
self.addEventListener('install', (event) => {
  // 强制跳过等待，直接进入 activate
  self.skipWaiting(); 
});

// ========== 6. 生命周期：激活 (清理旧缓存) ==========
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // 删除以前版本的缓存
          if (name !== CACHE_NAME) {
            console.log(`[SW] 清理旧版本缓存: ${name}`);
            return caches.delete(name);
          }
          return undefined;
        })
      );
    }).then(() => {
      // 激活后立刻接管所有页面
      return self.clients.claim();
    })
  );
});

// ========== 7. 拦截网络请求 (Fetch) ==========
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  
  // 只在 GET 请求且符合规则时拦截
  if (request.method !== 'GET' || !isCacheableRequest(request.url)) return;

  // 定义后台更新函数
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
      // 网络失败时，尝试返回缓存
      const cached = await cache.match(request);
      return cached || Response.error();
    }
  };

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(request);

      // 如果有缓存，检查是否过期
      if (cachedResponse) {
        if (runtimeConfig && !runtimeConfig.permanent) {
          const cachedTime = cachedResponse.headers.get('sw-cache-timestamp');
          if (cachedTime && (Date.now() - parseInt(cachedTime, 10) > runtimeConfig.maxAge * 1000)) {
            // 过期则走网络，并使用 waitUntil 确保后台更新完成
            event.waitUntil(fetchAndCache());
            return cachedResponse; 
          }
        }
        // 未过期或未开启过期限制，直接返回缓存，并在后台静默更新
        event.waitUntil(fetchAndCache());
        return cachedResponse;
      }

      // 无缓存，等待网络请求
      return await fetchAndCache();
    })
  );
});

// ========== 8. 通信：接收主线程配置与指令 ==========
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event;
  
  // 接收初始化配置
  if (data.type === 'INIT_CONFIG' && data.payload) {
    runtimeConfig = data.payload;
    console.log('[SW] 配置初始化成功', runtimeConfig);
  }

  // 手动清除缓存指令
  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] 手动清除缓存完成');
      })
    );
  }
});