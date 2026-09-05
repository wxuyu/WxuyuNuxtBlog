/**
 * Memos API v1 类型定义
 *
 * 只支持标准 Memos v0.20+ API：{memos}/api/v1/memos
 * 注：不同 v1 实例字段命名仍有差异（createTime/displayTime、
 * tags/property.tags 等），保留字段 fallback。
 */

/** 单条 memo 的原始响应结构（v1 字段并集） */
export interface MemosMemoRaw {
  /** v1 标准：resourceName 是 memo 唯一标识（memos/{id}），部分实例另有数字 id */
  name?: string
  id?: string | number
  content?: string
  creatorId?: string | number
  creatorName?: string
  creatorAvatarUrl?: string
  visibility?: 'PUBLIC' | 'PRIVATE' | 'PROTECTED'
  /** 创建时间（不同实例命名差异） */
  createTime?: string
  displayTime?: string
  /** 创建者（字符串 resourceName 或对象） */
  creator?: string | { id: string | number, name: string, avatarUrl?: string }
  /** 附件（v1 标准字段名） */
  attachments?: MemosAttachment[]
  /** 资源（部分实例 / 旧字段名） */
  resources?: MemosResource[]
  /** 标签（部分实例在 property.tags 里） */
  tags?: string[]
  reactions?: MemosReaction[]
  property?: {
    tags?: string[]
    [k: string]: unknown
  }
}

/** Memos 附件（v1 标准字段：attachments 数组元素） */
export interface MemosAttachment {
  /** resourceName（attachments/{id}） */
  name?: string
  createTime?: string
  filename?: string
  /** base64 内容（内联附件） */
  content?: string
  /** 外部链接（外链附件，直接可用） */
  externalLink?: string
  type?: string
  size?: string | number
  memo?: string
}

/** Memos 资源（旧版 / 部分实例的字段名） */
export interface MemosResource {
  id?: string | number
  name?: string
  type?: string
  filename?: string
  filename_?: string
  data?: { url?: string, size?: string }
  externalLink?: string
  externalUrl_?: string
  url?: string
  src?: string
  mimeType?: string
}

/** Memos v1 反应项 */
export interface MemosReaction {
  id?: string | number
  creatorId?: string | number
  reactionType?: string
  contentId?: string
}

/** 分页响应 */
export interface MemosListResponse {
  memos?: MemosMemoRaw[]
  data?: MemosMemoRaw[]
  nextPageToken?: string
}

/** 规范化为内部统一形态 */
export interface MemosMemo {
  id: string
  /** v1 resourceName（memos/{uid}） */
  name: string
  content: string
  createdAt: Date
  creatorName: string
  creatorAvatar: string
  /** 原始附件（v1 标准 attachments），含 filename/externalLink/type 等 */
  attachments: MemosAttachment[]
  /** 仅图片类附件的统一 src 列表（外部链接或 base64） */
  resources: MemosResource[]
  tags: string[]
  visibility: 'PUBLIC' | 'PRIVATE' | 'PROTECTED'
}

/** 组件 props */
export interface MemosTimelineProps {
  /** Memos 实例地址（含协议，无末尾斜杠） */
  memos?: string
  /** Memos 用户名（用于 CEL filter: creator == "users/{username}"） */
  username?: string
  /** 初始每页条数 */
  limit?: number
  /** 标签过滤（点击标签后只显示该标签） */
  tagFilter?: string
  /** 布局模式：'list' 单列 | 'masonry' 瀑布流 */
  layout?: 'list' | 'masonry'
}
