// plugins/sw.client.ts
// 1. 引入 toRaw 用于解除 Vue 的响应式代理
import { toRaw } from 'vue';

export default defineNuxtPlugin((nuxtApp) => {
  const config = useAppConfig().serviceWorker;

  if (!config.enabled || !('serviceWorker' in navigator)) return;

  const sendConfigToSw = (registration: ServiceWorkerRegistration) => {
    const sw = registration.active || registration.waiting || registration.installing;
    if (sw) {
      // 2. 核心修复：将数据脱敏，转化为纯JS对象，去除 Vue 的 Proxy 包装
      const payload = toRaw(config.cacheRules); 
      
      sw.postMessage({
        type: 'INIT_CONFIG',
        payload: {
          permanent: config.permanent,
          maxAge: config.maxAge,
          escapeDoor: config.escapeDoor,
          // 确保数组等嵌套结构也被正确深拷贝脱敏
          extensions: JSON.parse(JSON.stringify(payload.extensions)) 
        }
      });
    }
  };

  const showUpdatePrompt = (onRefresh: () => void, onClearCache: () => void) => {
    if (document.getElementById('sw-update-prompt')) return;
    
    const promptEl = document.createElement('div');
    promptEl.id = 'sw-update-prompt';
    Object.assign(promptEl.style, {
      position: 'fixed', bottom: '20px', right: '20px', zIndex: '9999',
      background: '#1a1a1a', color: 'white', padding: '16px 24px', borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontFamily: 'sans-serif',
      display: 'flex', alignItems: 'center', gap: '12px', transition: 'all 0.3s ease'
    });

    const message = document.createElement('span');
    message.textContent = '发现新版本，请刷新页面！';

    const refreshBtn = document.createElement('button');
    refreshBtn.textContent = '立即刷新';
    Object.assign(refreshBtn.style, { padding: '6px 12px', background: '#007aff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' });
    refreshBtn.onclick = onRefresh;

    const clearBtn = document.createElement('button');
    clearBtn.textContent = '手动清除';
    Object.assign(clearBtn.style, { padding: '6px 12px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', marginLeft: '8px' });
    clearBtn.onclick = () => { onClearCache(); promptEl.remove(); };

    promptEl.appendChild(message);
    promptEl.appendChild(refreshBtn);
    promptEl.appendChild(clearBtn);
    document.body.appendChild(promptEl);
  };

  nuxtApp.hook('app:mounted', async () => {
    const registration = await navigator.serviceWorker.register('/sw.js').catch(err => {
      console.error('[SW] 注册失败:', err);
      return null;
    });

    if (registration) {
      // 确保 SW 激活后再发送配置
      if (registration.active) {
        sendConfigToSw(registration);
      } else {
        // 如果还没激活，等它激活后再发
        registration.addEventListener('activate', () => {
          sendConfigToSw(registration);
        });
      }

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              showUpdatePrompt(
                () => window.location.reload(),
                () => {
                  if (registration.active) {
                    registration.active.postMessage({ type: 'CLEAR_CACHE' });
                  }
                }
              );
            }
          });
        }
      });
    }
  });
});