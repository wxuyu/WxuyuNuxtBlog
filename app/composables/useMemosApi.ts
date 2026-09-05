/**
 * Memos API v1 客户端
 *
 * 仅支持 Memos v0.20+ 标准 API：{memos}/api/v1/memos
 * - 过滤方式：filter=CEL 表达式（creator == "users/xxx"） + 独立 state 参数
 * - 分页：pageToken
 *
 * 注：不同 v1 实例字段命名仍有差异（createTime vs displayTime、
 * tags vs property.tags），保留字段 fallback 以兼容各实例。
 */
import type { MemosAttachment, MemosMemo, MemosMemoRaw, MemosResource } from '~/types/memos'

/** 规范化单条 memo → 内部 MemosMemo */
function normalize(m: MemosMemoRaw): MemosMemo {
  // 附件字段：v1 标准用 attachments，旧版/部分实例用 resources
  const rawResources: MemosResource[] = (m.attachments ?? m.resources ?? []).map((r) => {
    const rr = r as MemosResource
    const src =
      rr.externalLink
      || rr.data?.url
      || rr.externalUrl_
      || rr.url
      || rr.src
      || ''
    return { ...rr, src }
  })

  // 创建时间（不同 v1 实例命名差异）
  let createdAt: Date
  if (m.createTime) {
    createdAt = new Date(m.createTime)
  } else if (m.displayTime) {
    createdAt = new Date(m.displayTime)
  } else {
    createdAt = new Date()
  }

  // 标签（v1: m.tags / m.property.tags，部分实例从 content 正则抽取）
  let tags: string[] = m.tags ?? []
  if (!tags.length && m.property?.tags) tags = m.property.tags
  if (!tags.length && m.content) {
    tags = Array.from(m.content.matchAll(/#([^\s#]+)/g)).map((mm) => mm[1])
  }

  // 创建者信息
  let creatorName = m.creatorName ?? ''
  let creatorAvatar = m.creatorAvatarUrl ?? ''
  if (!creatorName && typeof m.creator === 'string') {
    // v1 标准 creator 是 resourceName（"users/MineXine"），提取 username 作为显示名
    creatorName = m.creator.replace(/^users\//, '')
  } else if (m.creator && typeof m.creator === 'object') {
    creatorName = m.creator.name ?? ''
    creatorAvatar = m.creator.avatarUrl ?? creatorAvatar
  }

  // memo 唯一标识：v1 标准用 name（resourceName memos/{uid}），提取 UID；否则用 id
  const rawName = m.name ?? ''
  const uid = rawName.replace(/^memos\//, '') || String(m.id ?? '')

  return {
    id: uid,
    name: rawName,
    content: m.content ?? '',
    createdAt,
    creatorName,
    creatorAvatar,
    attachments: m.attachments ?? [],
    resources: rawResources,
    tags,
    visibility: m.visibility ?? 'PUBLIC',
  }
}

/** Memos v1 API 客户端 */
export class MemosClient {
  constructor(
    private baseUrl: string,
    private username: string,
  ) {}

  /** 拼接 API 路径 */
  private apiPath(): string {
    return `${this.baseUrl.replace(/\/+$/, '')}/api/v1/memos`
  }

  /**
   * 拉取单页 memos
   *
   * 请求模板：
   * {baseUrl}/api/v1/memos?filter=creator=="users/{username}"&state=NORMAL&pageSize=10&pageToken=xxx
   *
   * @param pageToken 分页 token（下一页时传上一次返回的 nextPageToken）
   * @param tag 可选标签过滤（追加 CEL filter）
   * @param state 状态过滤（NORMAL / ARCHIVED），默认 NORMAL
   */
  async list(params: { pageToken?: string, pageSize: number, tag?: string, state?: string }) {
    const { pageToken, pageSize, tag, state = 'NORMAL' } = params
    const query: Record<string, string | number> = {
      pageSize,
    }

    // CEL filter：creator resourceName 必传，tag 可选叠加
    const filters: string[] = [`creator == "users/${this.username}"`]
    if (tag) filters.push(`tag == "${tag}"`)
    query.filter = filters.join(' && ')
    query.state = state

    if (pageToken) query.pageToken = pageToken

    const url = `${this.apiPath()}?${new URLSearchParams(query as Record<string, string>).toString()}`
    const res = await $fetch<{
      memos?: MemosMemoRaw[]
      data?: MemosMemoRaw[]
      nextPageToken?: string
    }>(url)

    const rawList = res.memos ?? res.data ?? []
    const memos = rawList.map(normalize)
    return {
      memos,
      nextPageToken: res.nextPageToken,
      hasMore: Boolean(res.nextPageToken),
    }
  }

  /** 拉取所有公开 memos（标签过滤），自动分页直到全部 */
  async *iterateAll(tag?: string, pageSize = 10) {
    let pageToken: string | undefined
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const page = await this.list({ pageToken, pageSize, tag, state: 'NORMAL' })
      yield page.memos
      if (!page.hasMore) break
      pageToken = page.nextPageToken
      if (!pageToken) break
    }
  }
}
