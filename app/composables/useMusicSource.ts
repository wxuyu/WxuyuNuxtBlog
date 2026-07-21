/**
 * useMusicSource — 音乐数据源抽象层
 *
 * 通过 app.config.ts 中的 music.source 配置切换：
 *   'local' → musicPlaylist.ts 本地数据
 *   'api'   → 音乐平台 API（netease / qq）
 */
import type { MusicDataSource, Playlist, Song } from '~/types/music'
import { localPlaylists } from '~/data/musicPlaylist'

/** 本地数据源实现 */
const localSource: MusicDataSource = {
  async fetchPlaylists(): Promise<Playlist[]> {
    return localPlaylists
  },
  async resolveSongUrl(songId: string): Promise<string> {
    // 本地模式：直接返回 songId（就是 url）
    return songId
  },
  async fetchLyric(_songId: string): Promise<string> {
    return ''
  },
}

/** API 数据源实现 */
const apiSource: MusicDataSource = {
  async fetchPlaylists(): Promise<Playlist[]> {
    const config = useAppConfig()
    const apiCfg = config.music?.api
    if (!apiCfg) return []

    // 使用博客部署的代理 API 避免 CORS
    return []
  },
  async resolveSongUrl(songId: string): Promise<string> {
    return ''
  },
  async fetchLyric(songId: string): Promise<string> {
    return ''
  },
}

/** 根据配置获取数据源 */
export function useMusicSource(): MusicDataSource {
  const config = useAppConfig()
  const sourceType = config.music?.source ?? 'local'

  if (sourceType === 'api') {
    return apiSource
  }

  return localSource
}

/** 便捷方法：获取所有歌单 */
export async function fetchAllPlaylists(): Promise<Playlist[]> {
  const source = useMusicSource()
  return source.fetchPlaylists()
}
