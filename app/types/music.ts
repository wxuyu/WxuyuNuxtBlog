// 音乐播放器类型定义

export interface Song {
  id: string
  title: string
  artist: string
  album?: string
  cover: string
  duration: number
  url: string
  /** 歌词文件 URL 或原始 LRC 文本 */
  lrc?: string
}

export interface Playlist {
  id: string
  name: string
  cover: string
  songs: Song[]
  desc?: string
}

/** 播放模式 */
export enum PlayMode {
  /** 单曲循环 */
  REPEAT_ONE = 'repeat-one',
  /** 列表循环 */
  REPEAT_ALL = 'repeat-all',
  /** 随机播放 */
  SHUFFLE = 'shuffle',
}

/** 播放器状态 */
export enum PlayerStatus {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped',
}

/** 播放器浮窗状态 */
export enum FloatStatus {
  /** 最小化：仅圆形图标 */
  MINIMIZED = 'minimized',
  /** 收起：迷你播放条 */
  COLLAPSED = 'collapsed',
  /** 展开：完整面板（歌单 + 歌词 + 控制） */
  EXPANDED = 'expanded',
}

/** 数据源类型 */
export type MusicSourceType = 'local' | 'api' | 'hybrid'

/** API provider 类型 */
export type MusicApiProvider = 'netease' | 'qq' | 'spotify'

/** 网易云音质等级 */
export type NeteaseLevel
  = 'standard' | 'higher' | 'exhigh' | 'lossless'
  | 'hires' | 'jyeffect' | 'sky' | 'dolby' | 'jymaster'

/** QQ 音质等级 */
export type QQQuality = 'master' | 'atmos' | 'atmos_2' | 'atmos_51' | 'flac' | '320' | '128'

/**
 * 歌单元数据配置项
 * 用于在 app.config.ts 中为单个歌单 ID 附加自定义显示信息。
 * 拉取 API 后会用这里的 name / desc / cover 覆盖 API 返回的默认值。
 */
export interface PlaylistConfig {
  /** 平台歌单 ID（网易云为数字字符串、QQ 为数字） */
  id: string | number
  /** 自定义显示名（留空则使用 API 返回的歌单名） */
  name?: string
  /** 自定义描述（留空则使用 API 返回的描述） */
  desc?: string
  /** 自定义封面 URL（留空则使用 API 返回的封面） */
  cover?: string
  /** 自定义作者（留空则不设） */
  author?: string
  /** 是否禁用此歌单（默认 false） */
  disabled?: boolean
}

/** 网易云 API 数据源配置 */
export interface NeteaseApiConfig {
  provider: 'netease'
  /** 网易云后端地址（如用户自部署的 NeteaseCloudMusicApi Enhanced） */
  baseUrl: string
  /** 网易云 cookie（包含 MUSIC_U 等；高级音质/私人 FM 需要） */
  cookie?: string
  /** 音质等级（默认 exhigh） */
  level?: NeteaseLevel
  /**
   * 简单歌单 ID 列表（向后兼容）：纯数字 ID 字符串数组
   * 如果同时设置了 `playlists`，则忽略 `playlistIds`。
   */
  playlistIds?: string[]
  /**
   * 带元数据的歌单配置列表（推荐使用）。
   * 拉取后会将 API 返回的 name/desc/cover 与这里的自定义值合并。
   */
  playlists?: PlaylistConfig[]
  /** 是否使用解灰音源（/song/url/match）作为兜底 */
  unblock?: boolean
}

/** QQ 音乐 API 数据源配置 */
export interface QQApiConfig {
  provider: 'qq'
  /**
   * 后端实现类型。当前仅支持 'jsososo'（jsososo/QQMusicApi 公共实例，默认）。
   */
  type?: 'jsososo'
  /** QQ 音乐 API 地址（不同 type 默认值不同） */
  baseUrl?: string
  /** 音质（默认 320） */
  quality?: QQQuality
  /** 简单歌单 ID 列表（向后兼容）：数字数组 */
  playlistIds?: number[]
  /** 带元数据的歌单配置列表（推荐使用） */
  playlists?: PlaylistConfig[]
  /**
   * 是否同时获取逐字歌词（QRC）。
   */
  fetchQrc?: boolean
  /** 是否同时获取翻译 */
  fetchTrans?: boolean
  /** 是否同时获取罗马音（仅 qrc 生效） */
  fetchRoma?: boolean
}

/** Spotify 占位（暂未实装） */
export interface SpotifyApiConfig {
  provider: 'spotify'
  // 预留
  [key: string]: unknown
}

/**
 * app.config.ts 中 api 字段的实际形态：
 * api.provider 决定激活的 provider，netease/qq 子对象各含自己的配置。
 * 之所以用嵌套而不是扁平 union，是为了避免同名 playlistIds 冲突。
 */
export interface MusicApiConfigObject {
  provider: MusicApiProvider
  netease?: Partial<NeteaseApiConfig>
  qq?: Partial<QQApiConfig>
  spotify?: Partial<SpotifyApiConfig>
}

/** API 数据源配置（联合类型） */
export type MusicApiConfig = NeteaseApiConfig | QQApiConfig | SpotifyApiConfig

/** app.config.ts 实际使用的形态（provider + 嵌套子配置） */
export type MusicApiConfigNested = MusicApiConfigObject

/** 解析后的 API provider 基础信息（数据源路由用） */
export interface ApiSongRef {
  /** 平台 provider */
  provider: MusicApiProvider
  /** 平台原生 ID（网易云为数字 mid、QQ 为字符串 mid） */
  externalId: string
}

/** 音乐播放器配置（app.config.ts 中的 music 字段） */
export interface MusicPlayerConfig {
  /**
   * 数据源模式：
   *   'local'  — 仅本地 TS 数据
   *   'api'    — 仅平台 API（netease / qq / spotify）
   *   'hybrid' — 本地 + 云端混合（同时合并返回）
   */
  source: MusicSourceType
  /**
   * hybrid 模式下的子开关。
   * - enableLocal = true  → 拉取本地歌单
   * - enableApi   = true  → 拉取云端歌单
   * 两项同时 true 才会合并；只一项 true 时退化为单选。
   */
  enableLocal?: boolean
  enableApi?: boolean
  /** 歌单合并顺序：'local-first' (默认) | 'api-first' */
  mergeOrder?: 'local-first' | 'api-first'
  /** API 模式配置（嵌套形态：provider + 各 provider 子配置） */
  api?: MusicApiConfigNested
  /** 歌词显示配置 */
  lyrics: {
    /** 是否在歌曲列表中显示歌词 */
    show: boolean
  }
  /** 默认音量 (0-1) */
  defaultVolume?: number
  /** 默认播放模式 */
  defaultMode?: PlayMode
}

/** 解析后的 LRC 行 */
export interface LrcLine {
  time: number
  text: string
}

/** 歌曲基础信息（用于 API 查询返回） */
export interface SongMeta {
  id: string
  title: string
  artist: string
  album?: string
  cover: string
  duration: number
}

/** 音乐数据源接口（各平台实现此接口） */
export interface MusicDataSource {
  /** 获取歌单列表 */
  fetchPlaylists(): Promise<Playlist[]>
  /** 获取歌曲播放 URL */
  resolveSongUrl(songId: string): Promise<string>
  /** 获取歌词 */
  fetchLyric(songId: string): Promise<string>
  /**
   * 获取歌曲封面真实 URL。
   * 一些 API（如 QQ）歌曲元数据中返回的是 cover endpoint URL（JSON 响应），
   * 需要走另一接口拆解成真实可被 `<img src>` 使用的 URL。
   * 平台若已经在元数据里填了可直接使用的图片 URL，可返回原 song.cover。
   */
  resolveCover(songId: string): Promise<string>
}
