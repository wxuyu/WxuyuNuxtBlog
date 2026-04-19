// plugins/sw.client.ts
interface UpdatePromptOptions {
  needsRefresh: boolean;
  onRefresh: () => void;
  onClearCache: () => void;
}

// 简单的悬浮提示框 UI 渲染函数 (纯原生 TS，不依赖 UI 框架)
function showUpdatePrompt(options: UpdatePromptOptions) {
  const { needsRefresh, onRefresh, onClearCache } = options;
  
  // 防止重复创建
  if (document.getElementById('sw-update-prompt')) return;

  const promptEl = document.createElement('div');
  promptEl.id = 'sw-update-prompt';
  promptEl.style.cssText = `
    position: fixed; bottom: 20px; right: 20px; z-index: 9999;
    background: #1a1a1a; color: white; padding: 16px 24px; border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15); font-family: sans-serif;
    display: flex; align-items: center; gap: 12px; transition: all 0.3s ease;
  `;

  const message = document.createElement('span');
  message.textContent = needsRefresh ? '发现新版本，请刷新页面！' : '需要清理旧缓存？';

  const refreshBtn = document.createElement('button');
  refreshBtn.textContent = '立即刷新';
  refreshBtn.style.cssText = 'padding: 6px 12px; background: #007aff; color: white; border: none; border-radius: 4px; cursor: pointer;';
  refreshBtn.onclick = onRefresh;

  const clearBtn = document.createElement('button');
  clearBtn.textContent = '手动清除';
  clearBtn.style.cssText = 'padding: 6px 12px; background: #555; color: white; border: none; border-radius: 4px; cursor: pointer; margin-left: 8px;';
  clearBtn.onclick = () => {
    onClearCache();
    promptEl.remove();
  };

  promptEl.appendChild(message);
  promptEl.appendChild(refreshBtn);
  promptEl.appendChild(clearBtn);
  document.body.appendChild(promptEl);
}

export default defineNuxtPlugin((nuxtApp) => {
  const config = useAppConfig().serviceWorker;
  
  // 如果主开关关闭，则注销所有 SW 并返回
  if (!config.enabled && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(regs => {
      regs.forEach(reg => reg.unregister());
    });
    return;
  }

  if ('serviceWorker' in navigator) {
    
    // 1. 注册 Service Worker
    nuxtApp.hook('app:mounted', () => {
      navigator.serviceWorker.register('/sw.js').catch(err => {
        console.error('[SW] 注册失败:', err);
      });
    });

    // 2. 监听来自 SW 的消息
    navigator.serviceWorker.addEventListener('message', (event) => {
      const { data } = event;
      
      // 情况 A：SW 通知主线程有更新，需要弹窗提示刷新
      if (data.type === 'NEW_VERSION_DETECTED') {
        showUpdatePrompt({
          needsRefresh: true,
          onRefresh: () => window.location.reload(),
          onClearCache: () => {
            // 通知 SW 清空缓存
            const sw = navigator.serviceWorker.controller;
            if (sw) sw.postMessage({ type: 'CLEAR_CACHE' });
          }
        });
      }
      
      // 情况 B：SW 确认更新已完成，通知主线程刷新
      if (data.type === 'UPDATE_COMPLETE') {
        window.location.reload();
      }
    });

    // 3. 监听 controllerchange (例如用户关闭了 SW，或者其他标签页接管了控制权)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // 可以在这里触发一些全局状态更新，比如隐藏提示框
    });
  }
});