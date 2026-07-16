// plugins/sw.client.ts
import { toRaw } from 'vue';
import { h, render, ref } from 'vue'; // 🔼 引入 Vue 的渲染 API

export default defineNuxtPlugin((nuxtApp) => {
  const config = useAppConfig().serviceWorker;
  const runtimeConfig = useRuntimeConfig();

  if (!config.enabled || !('serviceWorker' in navigator)) return;

  // ========== 1. 修复：监听控制器变化，带防抖保护 ==========
  // 使用 sessionStorage 防止同一版本 SW 更新触发多次 reload
  const RELOAD_KEY = 'sw:reloaded_version';

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    const currentVersion = runtimeConfig.public.swBuildTime as string || '';

    // 已经为这个版本重载过，跳过
    if (currentVersion && sessionStorage.getItem(RELOAD_KEY) === currentVersion) {
      console.log('[SW] Already reloaded for version', currentVersion, '- skipping');
      return;
    }

    console.log('[SW] Controller changed, reloading to apply new version...');
    sessionStorage.setItem(RELOAD_KEY, currentVersion);
    // 延迟一帧确保 sessionStorage 写入完成
    requestAnimationFrame(() => {
      window.location.reload();
    });
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
              const newVersion = runtimeConfig.public.swBuildTime as string || '';
              showUpdatePrompt(newVersion);
            }
          });
        }
      });
    }
  });
});