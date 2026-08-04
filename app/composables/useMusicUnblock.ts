/**
 * useMusicUnblock — 音乐解灰代理抽象层
 *
 * 目的：解决 jsososo / song/urls 需要 vip cookie 才能拿 URL 的问题。
 *       不直接调 jsososo 的播放端点，改走解灰代理（用户自部署或第三方），
 *       拿到真实可播放的 URL。
 *
 * 当前状态：mock 实现 —— 返回 sentinel 占位 URL，触发 UI 拦截。
 *          未来用户替换真实代理时，只需修改下方 `MOCK_UNBLOCK_BASE_URL` 指向真实服务，
 *          或重写 `fetchUnblockUrl` 内部实现即可，调用方无感知。
 *
 * 接口契约（最终替换时需要保持一致）：
 *   fetchUnblockUrl(provider: 'qq' | 'netease', songmid: string, options?): Promise<UnblockResult>
 *
 * UnblockResult:
 *   { ok: true,  url: string, duration?: number, quality?: string }
 *   { ok: false, reason: 'unsupported' | 'rate-limited' | 'unavailable' | 'mock', fallbackUrl?: string }
 *
 * 关键字段：
 *   - `ok=false` 时调用方应：
 *       1. 不调用 audio.play()
 *       2. UI 显示 reason 对应的友好提示
 *       3. `fallbackUrl` 可选：例如内置错误提示 MP3
 *
 * mock 阶段实现要点：
 *   - 不发任何网络请求（避免后端不可达报错）
 *   - 总是返回 { ok: false, reason: 'mock', fallbackUrl: undefined }
 *   - console.warn 一次让开发者看到正在走 mock 路径
 */

import type { QQQuality } from '~/types/music'

/** 解灰结果（成功/失败统一形态） */
export interface UnblockResult {
  ok: boolean
  /** 成功：真实可播放 URL；失败：可能为 undefined 或 fallbackUrl */
  url?: string
  /** 失败原因 */
  reason?: 'unsupported' | 'rate-limited' | 'unavailable' | 'mock' | 'cookie-required'
  /** 失败时的兜底 URL（如内置提示音） */
  fallbackUrl?: string
  /** 调试用元信息 */
  meta?: {
    provider: 'qq' | 'netease'
    songmid: string
    duration?: number
    quality?: string
    /** mock 阶段：标记当前是 mock 实现，方便排查 */
    mock: boolean
    /** 调用解灰代理的时间戳 */
    requestedAt: number
  }
}

/**
 * 解灰代理 baseUrl。
 *
 * ⚠️ mock 阶段：留空，所有请求走 mock。
 * ✅ 接入真实代理：填入实际地址（如 https://your-unblock.example.com）
 *    并修改 `fetchUnblockUrl` 内部实现发送真实 HTTP 请求。
 */
const MOCK_UNBLOCK_BASE_URL = ''

/** 是否启用 mock 模式 */
const IS_MOCK = !MOCK_UNBLOCK_BASE_URL

let hasWarnedMock = false
function warnMockOnce() {
  if (!hasWarnedMock) {
    console.warn(
      '[useMusicUnblock] 当前为 mock 模式 —— 不会发送真实解灰请求，所有歌曲 URL 返回 ok=false reason=mock。\n'
      + '接入真实解灰代理：修改 useMusicUnblock.ts 中 MOCK_UNBLOCK_BASE_URL + fetchUnblockUrl 实现。',
    )
    hasWarnedMock = true
  }
}

/**
 * 解析 QQ 歌曲的真实播放 URL
 *
 * @param songmid   QQ 歌曲 mid
 * @param quality   音质（master / atmos / flac / 320 / 128 等）
 */
async function fetchQQUnblockUrl(songmid: string, quality: QQQuality): Promise<UnblockResult> {
  if (IS_MOCK) {
    warnMockOnce()
    return {
      ok: false,
      reason: 'mock',
      meta: {
        provider: 'qq',
        songmid,
        quality,
        mock: true,
        requestedAt: Date.now(),
      },
    }
  }

  // ✅ 真实代理接入示例（用户实现时参考）：
  // const url = `${MOCK_UNBLOCK_BASE_URL.replace(/\/$/, '')}/qq/url?songmid=${encodeURIComponent(songmid)}&quality=${quality}`
  // const resp = await $fetch<{ code: number, data?: { url: string }, msg?: string }>(url, { timeout: 8000 })
  // if (resp.code === 0 && resp.data?.url) {
  //   return { ok: true, url: resp.data.url, meta: { provider: 'qq', songmid, quality, mock: false, requestedAt: Date.now() } }
  // }
  // return { ok: false, reason: 'unavailable', meta: { provider: 'qq', songmid, quality, mock: false, requestedAt: Date.now() } }

  // 当前 mock 阶段：永不执行
  return {
    ok: false,
    reason: 'unsupported',
    meta: { provider: 'qq', songmid, quality, mock: true, requestedAt: Date.now() },
  }
}

/**
 * 解析网易云歌曲的真实播放 URL（预留接口，未来若切换 provider 也能用）
 */
async function fetchNeteaseUnblockUrl(songId: string): Promise<UnblockResult> {
  if (IS_MOCK) {
    return {
      ok: false,
      reason: 'mock',
      meta: { provider: 'netease', songmid: songId, mock: true, requestedAt: Date.now() },
    }
  }
  return {
    ok: false,
    reason: 'unsupported',
    meta: { provider: 'netease', songmid: songId, mock: true, requestedAt: Date.now() },
  }
}

/**
 * 统一入口：根据 songId 自动识别 provider 并调用对应解灰实现
 *
 * @param songId 带前缀的内部 songId（如 "api:qq:0039MnYb0qxYhV"）
 * @param quality QQ 音质（网易云忽略）
 */
export async function fetchUnblockUrl(songId: string, quality?: QQQuality): Promise<UnblockResult> {
  // 解析前缀：兼容 'api:qq:<mid>' / 'api:netease:<id>'
  const m = /^(?:api:)?(?:api:)?(qq|netease):(.+)$/.exec(songId)
  if (!m) {
    return {
      ok: false,
      reason: 'unsupported',
      meta: { provider: 'qq', songmid: songId, mock: IS_MOCK, requestedAt: Date.now() },
    }
  }

  const provider = m[1] as 'qq' | 'netease'
  const externalId = m[2]

  if (provider === 'qq') {
    return fetchQQUnblockUrl(externalId, quality ?? '320')
  }
  return fetchNeteaseUnblockUrl(externalId)
}

/**
 * composable 包装：便于在 setup 中解构
 */
export function useMusicUnblock() {
  return {
    fetchUnblockUrl,
    isMock: IS_MOCK,
  }
}