import type { Playlist } from '~/types/music'

/**
 * 本地歌单数据
 *
 * 配置方式（app.config.ts 中 music.*）：
 *   - 仅使用本地数据：source = 'local'
 *   - 本地 + 云端混合：source = 'hybrid', enableLocal = true
 *   - 仅使用云端：source = 'api' 或 source = 'hybrid' + enableLocal = false
 *
 * 添加歌曲：按 { id, title, artist, url, lrc, cover, duration } 格式追加
 *
 * 混合模式下，所有本地歌单 / 歌曲的 id 会自动加 'local:' 前缀避免与云端冲突。
 */

const favorites: Playlist = {
  id: 'favorites',
  name: '我的收藏',
  cover: '/image/MusicCover/BARRETE!(SLOWED%20+%20REVERB)%20.avif',
  desc: '常听的好歌',
  songs: [
    {
      id: 'barrete',
      title: 'BARRETE!(SLOWED + REVERB)',
      artist: 'CHASHKAKEFIRA&D4C',
      url: '/assets/music/songs/BARRETE.mp3',
      lrc: '/assets/music/lrc/BARRETE!(SLOWED%20+%20REVERB)-CHASHKAKEFIRA&D4C.lrc',
      cover: '/image/MusicCover/BARRETE!(SLOWED + REVERB) .avif',
      duration: 0,
    },
    {
      id: 'wu-ren-fu-wo',
      title: '无人扶我青云志',
      artist: 'ZMAGE-Y',
      url: '/assets/music/songs/ZMAGE-Y.mp3',
      lrc: '/assets/music/lrc/无人扶我青云志%20(ZMAGE-Y%20remix)%20(Remix)-ZMAGE-Y.lrc',
      cover: '/image/MusicCover/无人扶我青云志 (ZMAGE-Y remix).avif',
      duration: 0,
    },
  ],
}

/** 所有本地歌单 */
export const localPlaylists: Playlist[] = [favorites]

/** 兼容旧版：导出所有歌曲的扁平列表 */
export const musicList = localPlaylists.flatMap((p) => p.songs)
