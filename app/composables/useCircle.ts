import type { CircleApiResponse } from '~/types/circle'

const CIRCLE_API_URL = 'https://circle.api.wxuyu.top/all'

/**
 * 获取朋友圈 RSS 聚合数据
 *
 * 设计要点（彻底解决 SSR 阶段请求失败 / 客户端重复请求问题）：
 * 1. `server: false` — 该 API 部署在外部域名，SSR 环境往往不可达，
 *    关闭服务端预取可避免「服务端失败 → 客户端再请求一次」的循环。
 * 2. `lazy: true` — 客户端挂载后才发起请求，不阻塞首屏渲染。
 * 3. 静态 `key` — 同一会话内多次访问共享 payload 缓存，杜绝重复请求。
 * 4. `default` 工厂 — 在请求完成前提供稳定的空结构，模板可安全访问 `data.value`。
 * 5. `getCachedData` — 优先复用 Nuxt payload/static 缓存，进一步避免重复请求。
 *
 * 分页由调用方在客户端通过 `usePagination` 自行处理，
 * 该 composable 不再耦合 `page` 参数。
 */
export default function useCircle() {
  const { data, status, error, refresh } = useFetch<CircleApiResponse>(
    CIRCLE_API_URL,
    {
      key: 'circle-all-data',
      server: false,
      lazy: true,
      deep: false,
      default: () => ({ statistical_data: { friends_num: 0, active_num: 0, error_num: 0, article_num: 0, last_updated_time: '' }, article_data: [] }),
      getCachedData(key, nuxtApp) {
        return nuxtApp.payload.data[key] ?? nuxtApp.static.data[key]
      },
    },
  )

  return { data, status, error, refresh }
}
