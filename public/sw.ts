// public/sw.ts
/// <reference lib="webworker" />

// =========================================================
// 1. 基础配置 (在实际 CI/CD 构建时，这里可以通过脚本替换为当前时间戳)
// =========================================================
const CACHE_VERSION = '__BUILD_TIME__'; // 构建时替换为 Date.now().toString()
const CACHE_NAME = `app-assets-${CACHE_VERSION}`;

// 从主线程接收配置 (通过 postMessage 或 importScripts 注入，这里为了解耦直接重写一份映射)
// 注意：SW 无法直接读取 app.config.ts，通常需要构建时同步或通过 message 传递
// 这里我们采用构建时写入的策略，如果你需要动态读取，需要在客户端注册时通过 postMessage 发给 SW
const CONFIG = {
  permanent: true,
  maxAge: 3600 * 24 * 30,
  escapeDoor: '/api/bypass/',
  extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'woff2', 'woff', 'ttf']
};

// =========================================================
// 2. 工具函数：判断是否为可缓存资源
// =========================================================
function isCacheableRequest(url: string): boolean {
  try {
    const { pathname, href } = new URL(url, self.location.origin);
    
    // 拦截逃生门
    if (CONFIG.escapeDoor && href.includes(CONFIG.escapeDoor)) return false;
    
    // 检查文件后缀
    const ext = pathname.split('.').pop()?.toLowerCase();
    if (ext && CONFIG.extensions.includes(ext)) return true;
    
    return false;
  } catch {
    return false;
  }
}

// =========================================================
// 3. 生命周期：安装 (Install)
// =========================================================
self.addEventListener('install', (event: ExtendableEvent) => {
  // 强制跳过等待，直接进入 activate 状态
  self.skipWaiting();
});

// =========================================================
// 4. 生命周期：激活 (Activate) - 清理旧缓存的最佳时机
// =========================================================
self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          // 如果缓存名不是当前版本，直接删除（全量清理）
          if (name !== CACHE_NAME) {
            console.log(`[SW] 清理旧版本缓存: ${name}`);
            return caches.delete(name);
          }
        })
      );
    }).then(() => {
      // 通知所有客户端（网页）更新已完成
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({ type: 'UPDATE_COMPLETE' });
        });
      });
    }).then(() => {
      // 立刻接管所有未被控制的页面
      return self.clients.claim();
    })
  );
});

// =========================================================
// 5. 拦截网络请求 (Fetch)
// =========================================================
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event;
  const url = request.url;

  // 只拦截 GET 请求且符合缓存规则的资源
  if (request.method !== 'GET' || !isCacheableRequest(url)) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      // 查找当前缓存中是否已有该请求
      const cachedResponse = await cache.match(request);

      // --- 策略：Stale-While-Revalidate (后台更新，前台优先速度) ---
      
      // 无论是否有缓存，都在后台发起网络请求更新
      const fetchPromise = fetch(request).then((networkResponse) => {
        if (networkResponse.ok) {
          // 克隆响应并存入缓存 (无新东西时，这里会存入相同的东西，无害且保证了 maxAge 的刷新)
          cache.put(request, networkResponse.clone());
        }
        return networkResponse;
      }).catch(() => {
        // 网络失败，如果没缓存就回退到 default
        return cachedResponse || fetch(request);
      });

      // 如果有缓存，立即返回缓存（不等待网络请求完成，保证图片秒加载）
      if (cachedResponse) {
        // 检查是否过期（如果开启了非永久缓存）
        if (!CONFIG.permanent) {
          const cachedTime = cachedResponse.headers.get('sw-cache-timestamp');
          if (cachedTime && (Date.now() - parseInt(cachedTime, 10) > CONFIG.maxAge * 1000)) {
            // 已过期，直接返回网络请求
            return fetchPromise;
          }
        }
        return cachedResponse;
      }

      // 如果没有缓存，等待网络请求完成
      return fetchPromise;
    })
  );
});

// =========================================================
// 6. 通信：接收主线程指令
// =========================================================
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  const { data } = event;
  
  // 手动清除缓存指令
  if (data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('[SW] 手动清除缓存完成');
      })
    );
  }
});