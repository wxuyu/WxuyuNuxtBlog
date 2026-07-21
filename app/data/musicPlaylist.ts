import type { Playlist } from '~/types/music'

/**
 * 本地歌单数据
 *
 * 配置方式：在 app.config.ts 中设置 music.source = 'local'
 * 添加歌曲：按 { id, title, artist, url, lrc, cover, duration } 格式追加
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
      cover: '/image/MusicCover/BARRETE!(SLOWED%20+%20REVERB)%20.avif',
      duration: 0,
    },
    {
      id: 'wu-ren-fu-wo',
      title: '无人扶我青云志',
      artist: 'ZMAGE-Y',
      url: '/assets/music/songs/ZMAGE-Y.mp3',
      lrc: '/assets/music/lrc/无人扶我青云志%20(ZMAGE-Y%20remix)%20(Remix)-ZMAGE-Y.lrc',
      cover: '/image/MusicCover/无人扶我青云志%20(ZMAGE-Y%20remix).avif',
      duration: 0,
    },
  ],
}

/** 所有本地歌单 */
export const localPlaylists: Playlist[] = [favorites]

/** 兼容旧版：导出所有歌曲的扁平列表 */
export const musicList = localPlaylists.flatMap((p) => p.songs)
