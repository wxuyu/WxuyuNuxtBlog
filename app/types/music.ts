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
export type MusicSourceType = 'local' | 'api'

/** API 数据源配置 */
export interface MusicApiConfig {
  provider: 'netease' | 'qq' | 'spotify'
  /** 歌单 ID */
  playlistId: string
  /** 备用歌单 ID 列表 */
  extraPlaylistIds?: string[]
}

/** 音乐播放器配置（app.config.ts 中的 music 字段） */
export interface MusicPlayerConfig {
  /** 数据源：local = 本地 TS 数据，api = 平台 API */
  source: MusicSourceType
  /** API 模式配置 */
  api?: MusicApiConfig
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
}
