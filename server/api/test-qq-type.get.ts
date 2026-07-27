import { defineEventHandler, getQuery } from 'h3'
import { fetchAllPlaylists } from '~/composables/useMusicSource'

// 临时测试：用公共 API fetchAllPlaylists 验证 type 路由
export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const type = (q.type as string) || 'ygking'
  try {
    const list = await fetchAllPlaylists()
    return {
      type,
      totalPlaylists: list.length,
      apiPlaylists: list.filter(p => p.id.startsWith('api:')).map(p => ({
        id: p.id,
        name: p.name,
        cover: p.cover,
        songsCount: p.songs.length,
        firstSong: p.songs[0] ? {
          id: p.songs[0].id,
          title: p.songs[0].title,
          artist: p.songs[0].artist,
        } : null,
      })),
      localPlaylistsCount: list.filter(p => p.id.startsWith('local:')).length,
    }
  }
  catch (e: any) {
    return { type, error: e?.message ?? String(e) }
  }
})