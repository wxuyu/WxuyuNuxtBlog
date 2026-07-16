---
title: 用元宝写一个ServiceWorker
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-04-21 14:00:00
updated: 2026-04-21 22:00:00
image:
categories: [站点魔改]
tags: ['Nuxt', '页面']
---
## 前言
在前几个月的时候，原本打算使用ServiceWorker来对字体、图片以及部分耗时长的文件来进行缓存，解决在非缓存下的等待时间长问题。因为一些原因导致了没去使用，在前几天我通过元宝来解决这个问题，顺便写了一个要求清单来给大家思考
``` text [思考] lang="text"
清除之前的思考并重新开发，遵循以下全部要求进行开发一个基于Nuxt SSG模式 + ServiceWorker的TS模块
1.缓存整站的图片、字体后，当自身没有任何新东西的时候，不在继续缓存
2.在更新时，自动清除客户端中全部缓存并通过悬浮提示框提示，需要在提示末尾处添加一个手动清除按钮，以免无法自动清除。同时自动清除通过强制刷新策略来进行清除，无论用户是否需要自主刷新。同时悬浮提示框需要使用文字提示
3.全局版本号依靠构建时间（runtimeConfig.public.buildTime）来作为版本号（V年.月.日.时.分），同时在构建出版本号后需要解析到runtimeConfig.public.swBuildTime，每当客户端版本号出现变动时启用要求二
4.需要在app.config.ts中添加配置项，包含是否永久缓存（若不需要请额外增加一个缓存时间）、逃生门（需要使用["", ""]作为配置项，用于配置特定请求忽略）、关闭ServiceWorker选项、额外缓存文件类型
5.不许在Ctrl + R时出现重新加载的提示
文字提示：本站已更新至多少版本号（将已经生成好的版本号放在此处），请重新加载以免出现不可预料的问题，刷新缓存（缓存刷新功能放在此处）
```

## 配置&逻辑
### Nuxt配置
``` ts [nuxt.config.ts] lang="ts"
// 基础模块导入
import fsp from 'fs/promises' // 用于文件读写
import fs from 'fs' // 用于即时读写

// 1. 基于构建时间生成纯净版本号
function generateBuildTimeVersion(): string {
  const now = new Date()
  const pad = (num: number) => num.toString().padStart(2, '0')
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1)
  const day = pad(now.getDate())
  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())
  // 确保这里只返回纯粹的版本号，不带任何多余字符
  return `V${year}.${month}.${day}.${hours}.${minutes}` 
}

// 基础数据导入与构建Log设置（以防版本号未析出）
const masterVersion = generateBuildTimeVersion()
console.log(`[Build] Master Version Generated: ${masterVersion}`)

// 2. 强化版 SW 版本注入插件
function createSwBuildPlugin(swEntry: string, buildVersion: string) {
  return {
    name: 'vite-plugin-sw-version-injector',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === 'virtual:sw-version') return id
      return null
    },
    async load(id: string) {
      if (id === 'virtual:sw-version') {
        let versionBase = Math.floor(Math.random() * 1000000);
        console.log(`[SW Build] Generated base: ${versionBase}. Pausing 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const finalVersion = `${versionBase}-${Date.now()}`;
        console.log(`[SW Build] Injected version: ${finalVersion}`);
        return `export const BUILD_VERSION = '${finalVersion}';`;
      }
      return null
    },

    transform(code: string, id: string) {
      if (id === swEntry) {
        const cleanVersion = buildVersion.trim(); // 清理首尾空格
        
        // 步骤A：直接替换占位符，无视外面套的几层引号
        let updatedCode = code.replace(/__INJECTED_VERSION__/g, cleanVersion);
        
        // 步骤B：清除可能不小心拼接到一起的旧前缀 (如 'app-assets-V2026...' 变回 'V2026...')
        updatedCode = updatedCode.replace(/app-assets-+/g, ''); 
        
        // 步骤C：兜底安全替换，防止出现双引号版本
        updatedCode = updatedCode.replace(/"__INJECTED_VERSION__"/g, `'${cleanVersion}'`);

        return updatedCode;
      }
      return code
    }
  }
}

// 3.独立构建 Service Worker 的函数
async function buildServiceWorker(
  outputDir: string, 
  isDev: boolean, 
  buildVersion?: string // 🔽 核心修复 3：将参数设为可选，兼容新旧调用方式
) {
  const { build } = await import('vite')
  const swEntry = resolve(process.cwd(), './app/utils/sw.ts') 
  const swOutput = resolve(outputDir, 'sw.js')

 console.log(`[SW] ${isDev ? 'Dev' : 'Prod'} mode: Building Service Worker...`)

  await build({
    configFile: false,
    build: {
      ssr: false,
      outDir: outputDir,
      emptyOutDir: false, 
      minify: isDev ? false : true, 
      lib: {
        entry: swEntry,
        name: 'sw',
        formats: ['iife'],
        fileName: () => 'sw.js'
      },
      rollupOptions: {
        external: ['virtual:sw-version'], 
        output: {
          entryFileNames: 'sw.js',
          inlineDynamicImports: true
        }
      }
    },
    plugins: buildVersion ? [createSwBuildPlugin(swEntry, buildVersion)] : [] 
  })

  await fsp.access(swOutput).catch(() => {
    throw new Error(`[SW] Build failed: ${swOutput} not found`)
  })
  console.log(`[SW] Build complete -> ${swOutput}`)
}

export default defineNuxtConfig({
  // 已有的配置不动
  runtimeConfig: {
    public: {
      // 已有的配置不动
      swBuildTime: masterVersion
		},
  }
  hooks: {
    // 已有的配置不动
    'nitro:init': (nitro) => {
      // =========================================================
      // 核心修复：在 Nitro 初始化时，强行将版本号打入运行时配置的最底层
      // 这会穿透并覆盖所有的 .env 文件和环境变量默认值
      // =========================================================
      nitro.options.runtimeConfig.public.swBuildTime = masterVersion;
      
      console.log(`[Nitro] RuntimeConfig public.swBuildTime forcibly set to: ${masterVersion}`);

      // 继续处理 app.config.ts 的物理文件补丁
      try {
        const appConfigPath = resolve(process.cwd(), 'app.config.ts')
        let content = fs.readFileSync(appConfigPath, 'utf-8')
        
        const searchRegex = /serviceWorkerVersion:\s*['"][^'"]*['"]/
        const replaceValue = `serviceWorkerVersion: '${masterVersion}'`
        
        if (content.match(searchRegex)) {
          content = content.replace(searchRegex, replaceValue)
          fs.writeFileSync(appConfigPath, content, 'utf-8')
          console.log(`[AppConfig] Patched to: ${masterVersion}`)
        } else {
          console.warn('[AppConfig] Warning: Pattern not found')
        }
      } catch (e) {
        console.error('[AppConfig] File patch failed:', e)
      }

      // 构建 Service Worker
      nitro.hooks.hook('compiled', async () => {
        await buildServiceWorker(nitro.options.output.publicDir, nitro.options.dev, masterVersion)
      })
    }
  }
})
```

### APP配置
``` ts [app.Config.ts] lang="ts"
  serviceWorker: {
    // 1. 主开关：设为 false 时，客户端将注销并停止所有 Service Worker
    enabled: true, 
    
    // 2. 缓存规则
    cacheRules: {
      // 需要拦截缓存的文件后缀
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'woff2', 'woff', 'ttf'],
      // 额外需要缓存的 MIME 类型
      mimeTypes: ['image', 'font'],
      escapeDoors: ['/api/recent-comments', '/api/stats']
    },
    
    // 3. 永久缓存开关与过期时间（单位：秒）
    // 若 permanent 为 true，则无视 maxAge；若为 false，超过 maxAge 的资源会被重新拉取
    permanent: true, 
    maxAge: 3600 * 24 * 30, // 30天
    
    // 4. 逃生门 (Escape Door)
    // 当请求 URL 包含此前缀时，Service Worker 将彻底放行，不做任何拦截
    // 可用于动态大文件下载或需要实时获取的后端接口
    escapeDoor: ['/api/recent-comments'], 
    
    // 5. 版本号 (由构建时自动注入，此处仅为类型提示)
    // 在 sw.ts 中我们会通过模板字符串自动生成时间戳
  },
```

## 核心代码
### 客户端插件
``` ts [sw.client.ts] lang="ts"
// plugins/sw.client.ts
import { toRaw } from 'vue';
import { h, render, ref } from 'vue'; // 🔼 引入 Vue 的渲染 API

export default defineNuxtPlugin((nuxtApp) => {
  const config = useAppConfig().serviceWorker;
  const runtimeConfig = useRuntimeConfig();

  if (!config.enabled || !('serviceWorker' in navigator)) return;

  // ========== 1. 修复：监听控制器变化，解决 Ctrl+R 状态错乱 ==========
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    console.log('[SW] Controller changed, reloading page to apply new version...');
    // 当有新的 Service Worker 接管页面时，强制刷新以清理旧状态
    window.location.reload(); 
  });

  const sendConfigToSw = (registration: ServiceWorkerRegistration) => {
    const sw = registration.active || registration.waiting || registration.installing;
    if (sw) {
      const rawRules = toRaw(config.cacheRules); 
      const payload = {
        permanent: config.permanent,
        maxAge: config.maxAge,
        escapeDoors: rawRules.escapeDoors.map(String), 
        extensions: rawRules.extensions.map(String)
      };
      
      sw.postMessage({
        type: 'INIT_CONFIG',
        payload
      });
    }
  };

  // ========== 2. 优化：基于 Vue h() 的现代化小弹窗 ==========
  const showUpdatePrompt = (newVersion: string) => {
    // 避免重复创建
    if (document.getElementById('sw-update-container')) return;

    const container = document.createElement('div');
    container.id = 'sw-update-container';
    document.body.appendChild(container);

    // 使用 ref 来控制 Vue 组件内部的响应式状态（如果需要的话）
    const visible = ref(true);

    const vnode = h('div', { 
      class: 'fixed bottom-4 right-4 z-[9999] transition-all duration-300 ease-out',
      style: { opacity: visible.value ? '1' : '0', transform: visible.value ? 'translateY(0)' : 'translateY(20px)' }
    }, [
      h('div', { class: 'bg-white dark:bg-zinc-900 shadow-2xl rounded-xl p-4 w-80 border border-zinc-200 dark:border-zinc-800' }, [
        // 标题
        h('h3', { class: 'font-bold text-zinc-800 dark:text-zinc-100 mb-2 flex items-center gap-2' }, [
          h('span', { class: 'w-2 h-2 bg-green-500 rounded-full animate-pulse' }),
          '站点更新可用'
        ]),
        // 版本号信息
        h('p', { class: 'text-sm text-zinc-600 dark:text-zinc-400 mb-1' }, [
          '最新版本：',
          h('code', { class: 'text-xs bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded-md font-mono' }, newVersion)
        ]),
        // 提示文字
        h('p', { class: 'text-xs text-zinc-500 dark:text-zinc-500 mb-4' }, 
          '请重新加载以免出现不可预料的问题。'
        ),
        // 按钮组
        h('div', { class: 'flex gap-2 justify-end' }, [
          h('button', {
            class: 'px-4 py-1.5 text-sm rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors',
            onClick: () => {
              visible.value = false;
              setTimeout(() => {
                render(null, container);
                container.remove();
              }, 300); // 等待过渡动画结束
            }
          }, '稍后再说'),
          h('button', {
            class: 'px-4 py-1.5 text-sm rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-medium transition-colors shadow-sm',
            onClick: () => {
              window.location.reload();
            }
          }, '立即刷新'),
          h('button', {
            class: 'px-4 py-1.5 text-sm rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors shadow-sm',
            onClick: () => {
              const sw = navigator.serviceWorker.controller;
              if (sw) {
                sw.postMessage({ type: 'CLEAR_CACHE' });
                sw.addEventListener('statechange', () => {
                  window.location.reload();
                });
              } else {
                window.location.reload();
              }
            }
          }, '清除缓存')
        ])
      ])
    ]);

    render(vnode, container);
  };

  nuxtApp.hook('app:mounted', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('[SW] 注册失败:', err);
      return null;
    });

    if (registration) {
      if (registration.active) {
        sendConfigToSw(registration);
      } else {
        registration.addEventListener('activate', () => {
          sendConfigToSw(registration);
        });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              const newVersion = runtimeConfig.public.swVersion;
              showUpdatePrompt(`${newVersion}`);
            }
          });
        }
      });
    }
  });
});
```

### 服务引擎
``` ts [sw.ts] lang="ts"
// src/sw.ts
declare const self: ServiceWorkerGlobalScope;
// ========== 1. 类型定义 ==========
export interface SwConfig {
  permanent: boolean;
  maxAge: number; 
  escapeDoors: string[]; 
  extensions: string[];
}

// ========== 2. 版本号 (由构建插件注入) ==========
let BUILD_VERSION = '__INJECTED_VERSION__';
if (typeof BUILD_VERSION === 'undefined') {
  BUILD_VERSION = `${Date.now()}-fallback`;
}

// 直接使用完整版本号作为缓存名，清晰明了
const CACHE_NAME = `app-assets-${BUILD_VERSION}`;

// ... 文件其余部分完全不变 ...

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
```