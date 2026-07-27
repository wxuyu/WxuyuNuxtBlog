/**
 * useMusicSource — 音乐数据源抽象层
 *
 * 通过 app.config.ts 中的 music.source 配置切换：
 *   'local'  → 仅 musicPlaylist.ts 本地数据
 *   'api'    → 仅音乐平台 API（netease / qq）
 *   'hybrid' → 本地 + 云端混合（按 music.enableLocal / music.enableApi 子开关合并）
 *
 * 合并规则：
 *   - 两路同时成功 → 按 music.mergeOrder 拼接（默认 local 在前）
 *   - 一路失败 → 静默回退到另一路，错误进 console.warn
 *   - 同时关（enableLocal=false && enableApi=false）→ 返回空歌单
 *   - local 歌单 id 自动加 'local:' 前缀，api 歌单加 'api:<provider>:' 前缀，避免混合 id 冲突
 *
 * 设计要点：
 *   - fetchPlaylists() 只拉歌单元信息（id/name/cover/desc/歌曲 id+title+artist）；
 *     真正的 url/lrc 在用户点播时由 resolveSongUrl/fetchLyric 按需拉取，避免被限流。
 *   - QQ 音乐天然支持 CORS，可直接 $fetch；网易云需用户自部署后端代理。
 *   - 网易云 url：/song/url/v1?level=... ；歌词：/lyric
 *   - QQ url：/api/song/url?quality=... ；歌词：/api/lyric
 */
import type {
  ApiSongRef,
  MusicApiConfig,
  MusicApiConfigNested,
  MusicDataSource,
  NeteaseApiConfig,
  NeteaseLevel,
  Playlist,
  PlaylistConfig,
  QQApiConfig,
  QQQuality,
  Song,
} from '~/types/music'
import { localPlaylists } from '~/data/musicPlaylist'

// ============================================================================
// 通用工具
// ============================================================================

/** 给歌单 id 加前缀，避免混合时冲突 */
function prefixPlaylistId(provider: string, playlist: Playlist): Playlist {
  const prefix = `${provider}:`
  if (playlist.id.startsWith(prefix)) return playlist
  return {
    ...playlist,
    id: prefix + playlist.id,
    songs: playlist.songs.map(s => ({
      ...s,
      id: prefix + s.id,
    })),
  }
}

/** 从带前缀的 songId 解析出 ApiSongRef */
function parseApiRef(songId: string): ApiSongRef | null {
  // 形如 'api:netease:12345' / 'api:qq:0039MnYb0qxYhV' / 双层 'api:api:qq:...'（hybrid 模式）
  const m = /^(?:api:)?api:(netease|qq|spotify):(.+)$/.exec(songId)
  if (!m) return null
  return { provider: m[1] as ApiSongRef['provider'], externalId: m[2] }
}

/** 构造带前缀的 id */
function makeApiSongId(provider: ApiSongRef['provider'], externalId: string): string {
  return `api:${provider}:${externalId}`
}

/**
 * 用 app.config.ts 中定义的元数据覆盖 API 返回的 Playlist。
 * 覆盖规则（name/desc/cover/author）：
 *   - meta 中留空/undefined → 保留 API 返回值
 *   - meta 中为空字符串 → 保留 API 返回值（避免误清空）
 *   - meta 中为非空字符串 → 覆盖 API 返回值
 * disabled=true 的歌单会返回 null（被上拉取后过滤）
 */
function applyMetaOverrides(playlist: Playlist, meta?: PlaylistConfig): Playlist {
  if (!meta) return playlist
  return {
    ...playlist,
    name: (meta.name && meta.name.trim()) ? meta.name : playlist.name,
    desc: (meta.desc && meta.desc.trim()) ? meta.desc : playlist.desc,
    cover: (meta.cover && meta.cover.trim()) ? meta.cover : playlist.cover,
  }
}

/** 兜底：清空（不抛错） */
async function silentEmpty<T>(reason: string): Promise<T> {
  console.warn(`[useMusicSource] ${reason}`)
  return [] as unknown as T
}

// ============================================================================
// 本地数据源
// ============================================================================

const localSource: MusicDataSource = {
  async fetchPlaylists(): Promise<Playlist[]> {
    return localPlaylists
  },
  async resolveSongUrl(songId: string): Promise<string> {
    // 混合模式下，songId 可能带 'local:' 前缀，需剥离
    const cleanId = songId.replace(/^local:/, '')
    // 本地模式：直接返回 songId（就是 url）
    return cleanId
  },
  async fetchLyric(_songId: string): Promise<string> {
    return ''
  },
  async resolveCover(songId: string): Promise<string> {
    // 本地模式下 cover 已在 song.cover 中填了真实路径；为了不依赖外部 store，
    // 调用方应直接用 song.cover。这里返回空字符串作为兑底。
    // 需要实际 URL 时，调用方可在 globalPlaylist 中查。
    const cleanId = songId.replace(/^local:/, '')
    // 试从 localPlaylists 中查
    for (const p of localPlaylists) {
      const s = p.songs.find(x => x.id === cleanId)
      if (s) return s.cover ?? ''
    }
    return ''
  },
}

// ============================================================================
// 网易云 provider
// ============================================================================

const DEFAULT_NETEASE_LEVEL: NeteaseLevel = 'exhigh'

/**
 * 拉取单个歌单的所有歌曲详情
 * 网易云歌单详情只返回部分 tracks，需要 trackIds 拉全后再 /song/detail 一次
 *
 * @param meta 来自 app.config.ts 的歌单元数据（可选），用于覆盖 API 返回的 name/desc/cover
 */
async function fetchNeteasePlaylist(
  baseUrl: string,
  playlistId: string,
  cookie?: string,
  meta?: PlaylistConfig,
): Promise<Playlist | null> {
  try {
    const detailUrl = `${baseUrl.replace(/\/$/, '')}/playlist/detail?id=${encodeURIComponent(playlistId)}`
    const detail = await $fetch<any>(detailUrl, { headers: cookie ? { cookie } : {} })
    const pl = detail?.playlist
    if (!pl) return null

    // 拿全部 trackIds（歌单详情只返回部分 tracks，trackIds 是全的）
    const trackIds: number[] = Array.isArray(pl.trackIds) ? pl.trackIds.map((t: any) => t.id) : []
    if (trackIds.length === 0) {
      return applyMetaOverrides({
        id: playlistId,
        name: pl.name ?? '网易云歌单',
        cover: pl.coverImgUrl ? `${pl.coverImgUrl}?param=300y300` : '',
        desc: pl.description ?? '',
        songs: [],
      }, meta)
    }

    // 批量查歌曲详情（每次最多 100 个 id；这里 50/批较稳）
    const batchSize = 50
    const songs: Song[] = []
    for (let i = 0; i < trackIds.length; i += batchSize) {
      const batch = trackIds.slice(i, i + batchSize).join(',')
      const songUrl = `${baseUrl.replace(/\/$/, '')}/song/detail?ids=${batch}`
      const resp = await $fetch<any>(songUrl, { headers: cookie ? { cookie } : {} })
      const list: any[] = resp?.songs ?? []
      for (const s of list) {
        songs.push(mapNeteaseSong(s))
      }
    }

    return applyMetaOverrides({
      id: playlistId,
      name: pl.name ?? '网易云歌单',
      cover: pl.coverImgUrl ? `${pl.coverImgUrl}?param=300y300` : '',
      desc: pl.description ?? '',
      songs,
    }, meta)
  }
  catch (e) {
    console.warn(`[useMusicSource] 网易云歌单 ${playlistId} 拉取失败:`, e)
    return null
  }
}

/** 网易云 /song/detail 单曲 → 本地 Song（url/lrc 不在这里取） */
function mapNeteaseSong(s: any): Song {
  const id = String(s.id)
  return {
    id: makeApiSongId('netease', id),
    title: s.name ?? '',
    artist: Array.isArray(s.ar) ? s.ar.map((a: any) => a.name).filter(Boolean).join(' / ') : '',
    album: s.al?.name ?? '',
    cover: s.al?.picUrl ? `${s.al.picUrl}?param=300y300` : '',
    duration: Math.floor((s.dt ?? 0) / 1000),
    url: '', // 懒加载：resolveSongUrl 时再填
    lrc: '', // 懒加载：fetchLyric 时再填
  }
}

/** 网易云 /song/url/v1?level=... → 真实 url */
async function resolveNeteaseUrl(baseUrl: string, externalId: string, level: NeteaseLevel, cookie?: string): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/song/url/v1?id=${encodeURIComponent(externalId)}&level=${level}`
  const resp = await $fetch<any>(url, { headers: cookie ? { cookie } : {} })
  const item = resp?.data?.[0]
  return item?.url ?? ''
}

/** 网易云 /lyric → LRC 文本（不取逐字） */
async function fetchNeteaseLyric(baseUrl: string, externalId: string, cookie?: string): Promise<string> {
  const url = `${baseUrl.replace(/\/$/, '')}/lyric?id=${encodeURIComponent(externalId)}`
  const resp = await $fetch<any>(url, { headers: cookie ? { cookie } : {} })
  return resp?.lrc?.lyric ?? ''
}

// ============================================================================
// QQ provider — type: 'ygking'（api.ygking.top，向后兼容默认）
// ============================================================================
// 实际响应结构（参考 playlist.json）：
//   顶层：{ code: 0, data: { code, subcode, dirinfo, songlist, songlist_size, ... } }
//   dirinfo：{ id, title, picurl(/600), desc, songnum, listennum, creator.nick, ... }
//   songlist[]：{ id, mid, name, interval, time_public,
//                 singer:[{mid,name,...}],
//                 album:{id,mid,name,...},
//                 file:{media_mid, size_new[14]},
//                 pay:{pay_play,...} }
//
// 修复历史（基于 2026-07-22 真实数据样本）：
//   - 歌单元数据在 `data.dirinfo` 不是 `data.name`
//   - 歌曲标题是 `s.name` 不是 `s.title`
//   - 歌曲封面走 `/api/song/cover?mid=...&size=300` 返回 `{data.url}`
//   - 歌曲 URL 走 `/api/song/url?mid=...&quality=...` 返回 `{data: {mid: url}}` map
//   - 歌词走 `/api/lyric?mid=...&qrc=1&trans=1&roma=1` 返回 `{data:{lyric, trans, roma}}`

const DEFAULT_QQ_BASE_YGKING = 'https://api.ygking.top'
const DEFAULT_QQ_BASE_SANSENJIAN = 'http://localhost:3200'
const DEFAULT_QQ_QUALITY: QQQuality = '320'

/** 歌单封面尺寸：dirinfo.picurl 末尾是 /600，替换为 /300 / 800 */
function resizeQQPlaylistCover(picurl: string, size: 300 | 800 = 300): string {
  if (!picurl) return ''
  return picurl.replace(/\/(?:600|300|800)$/, `/${size}`)
}

/** 拉取单个 QQ 歌单 → 本地 Playlist（ygking 实现） */
async function fetchQQPlaylistYGKing(
  baseUrl: string,
  playlistId: number,
  meta?: PlaylistConfig,
): Promise<Playlist | null> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/playlist?id=${encodeURIComponent(String(playlistId))}`
    const resp = await $fetch<any>(url)
    // 顶层 {code, data:{code, subcode, dirinfo, songlist, ...}}
    const data = resp?.data
    if (!data) return null
    // 业务级 code（0 成功；其他失败）
    if (data.code !== undefined && data.code !== 0) {
      console.warn(`[useMusicSource] QQ 歌单 ${playlistId} 业务失败: code=${data.code} subcode=${data.subcode} msg=${data.msg}`)
      return null
    }
    const dirinfo = data.dirinfo ?? {}
    const songlist: any[] = Array.isArray(data.songlist) ? data.songlist : []

    // 歌单封面作为歌曲封面的兑底
    const playlistCover = resizeQQPlaylistCover(dirinfo.picurl, 300)

    // 歌曲 → 本地 Song
    const mappedSongs: Song[] = songlist
      .filter((s: any) => s && s.mid) // 过滤掉没有 mid 的
      .map((s: any) => mapQQSong(s, baseUrl))

    // 性能优化：不并发拉 22 首 cover（以前要 6.4s）。所有歌曲封面初始为空，
    // 真实封面在用户进入 songs 视图后由 enrichSongCovers 按需拉取（前12首），
    // 以及 _loadSong 时懒加载（播放到哪首补哪首）。
    const songs: Song[] = mappedSongs.map((s) => ({ ...s, cover: '' }))

    return applyMetaOverrides({
      id: String(playlistId),
      name: dirinfo.title ?? 'QQ 歌单',
      cover: playlistCover,
      desc: dirinfo.desc ?? '',
      songs,
    }, meta)
  }
  catch (e) {
    console.warn(`[useMusicSource] QQ 歌单 ${playlistId} 拉取失败:`, e)
    return null
  }
}

/** QQ songlist[].song → 本地 Song（ygking / sansenjian 共享字段映射） */
function mapQQSong(s: any, _baseUrl: string): Song {
  const mid = s.mid ?? s.songmid ?? ''
  return {
    id: makeApiSongId('qq', mid),
    // 关键修复：QQ 用 s.name（不是 s.title，s.title 是另一字段但多数情况相同）
    title: s.name ?? s.songname ?? s.title ?? '',
    // sansenjian: singer 为字符串 '歌手1 / 歌手2' 或数组
    artist: Array.isArray(s.singer)
      ? s.singer.map((x: any) => x.name ?? x).filter(Boolean).join(' / ')
      : (typeof s.singer === 'string' ? s.singer : ''),
    album: s.album?.name ?? s.albumname ?? '',
    // 封面：留空，由 fetchQQPlaylist 阶段并发调 resolveQQCover 填充
    // （之前是拼 /api/song/cover 端点 URL，但那是 JSON 接口不是图片，会破图）
    cover: '',
    duration: s.interval ?? s.duration ?? 0,
    url: '', // 懒加载：_loadSong 时由 resolveSongUrl 填充
    lrc: '', // 懒加载：_loadSong 时由 fetchLyric 填充
  }
}

/** 实际拿歌曲封面（ygking：/api/song/cover） */
async function resolveQQCoverYGKing(baseUrl: string, mid: string): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/song/cover?mid=${encodeURIComponent(mid)}&size=300`
    const resp = await $fetch<any>(url)
    return resp?.data?.url ?? ''
  }
  catch {
    return ''
  }
}

/** QQ /api/song/url?mid=...&quality=... → 真实 url
 *  实际响应：{ code: 0, data: { "mid_xxxx": "https://..." }, quality: "320" }
 */
async function resolveQQUrlYGKing(baseUrl: string, mid: string, quality: QQQuality): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/api/song/url?mid=${encodeURIComponent(mid)}&quality=${quality}`
    const resp = await $fetch<any>(url)
    // 响应是 { mid: url } map
    const map = resp?.data
    if (map && typeof map === 'object' && !Array.isArray(map)) {
      return map[mid] ?? map[Object.keys(map)[0]] ?? ''
    }
    // 数组形式 []{mid, url} 兑底
    if (Array.isArray(map) && map.length > 0) {
      const item = map.find((x: any) => x.mid === mid) ?? map[0]
      return item?.url ?? ''
    }
    return ''
  }
  catch (e) {
    console.warn(`[useMusicSource] QQ 歌曲 ${mid} url 获取失败:`, e)
    return ''
  }
}

/** QQ /api/lyric?mid=...&qrc=1&trans=1 → LRC 文本
 *  实际响应：{ code: 0, data: { mid, id, lyric, trans, roma } }
 */
async function fetchQQLyricYGKing(
  baseUrl: string,
  mid: string,
  options: { qrc?: boolean, trans?: boolean, roma?: boolean },
): Promise<string> {
  try {
    const params = new URLSearchParams({ mid })
    if (options.qrc) params.set('qrc', '1')
    if (options.trans) params.set('trans', '1')
    if (options.roma) params.set('roma', '1')
    const url = `${baseUrl.replace(/\/$/, '')}/api/lyric?${params.toString()}`
    const resp = await $fetch<any>(url)
    const data = resp?.data
    if (!data) return ''
    // 主歌词：默认 lyric（带时间戳的 LRC）
    // qrc 优先：如果 qrc=1 且 roma 字段存在，roma 是 QRC XML
    let result = data.lyric ?? ''
    if (options.trans && data.trans) result += '\n' + data.trans
    if (options.roma && data.roma) result += '\n' + data.roma
    return result
  }
  catch (e) {
    console.warn(`[useMusicSource] QQ 歌曲 ${mid} 歌词获取失败:`, e)
    return ''
  }
}

// ============================================================================
// QQ provider — type: 'sansenjian'（自部署 @sansenjian/qq-music-api）
// ============================================================================
// API 文档来源：https://sansenjian.github.io/qq-music-api/api/playlist.html
// 默认端口 3200；需本地或服务器自部署（`npm i -g @sansenjian/qq-music-api`
// 或 `npm i @sansenjian/qq-music-api && node node_modules/@sansenjian/qq-music-api/dist/app.js`）。
//
// 关键端点（query string）：
//   GET /getSongListDetail?disstid=<id>         歌单详情 + 歌曲列表
//      响应：{ code, data: { dissname, desc, songlist:[{songname, singer, mid?, songmid?, ...}] } }
//   GET /getMusicPlay?songmid=<mid>             歌曲播放 URL
//      响应：{ code, data: { url, size, quality } }
//   GET /getLyric?songmid=<mid>&isFormat=1      歌词（LRC 时间戳格式）
//      响应：{ code, data: { lyric, trans } }
//   GET /getImageUrl?id=<songmid|albummid>&size=500x500   封面真实图片 URL
//      响应：{ code, data: <图片 url 字符串或对象> }
//
// 字段映射注意事项：
//   - songlist[] 文档示例只列了 songname + singer，但实际响应通常含 mid/songmid（用于播放/歌词）
//     若 mid 缺失则歌曲被过滤（无法解析 URL/歌词）
//   - 歌单封面由 `/getImageUrl?id=<disstid>&size=500x500` 单独拉取（响应 data 字段为字符串 URL）
//   - 歌手字段可能是字符串 '歌手1 / 歌手2' 或数组 [{name}]，mapQQSong 已兼容

/**
 * 拉取 sansenjian 歌单封面 → 真实图片 URL
 */
async function fetchQQPlaylistCoverSansenjian(baseUrl: string, disstid: string): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/getImageUrl?id=${encodeURIComponent(disstid)}&size=500x500`
    const resp = await $fetch<any>(url)
    const data = resp?.data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object' && typeof data.url === 'string') return data.url
    return ''
  }
  catch {
    return ''
  }
}

/** 拉取单个 sansenjian QQ 歌单 → 本地 Playlist */
async function fetchQQPlaylistSansenjian(
  baseUrl: string,
  playlistId: number | string,
  meta?: PlaylistConfig,
): Promise<Playlist | null> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/getSongListDetail?disstid=${encodeURIComponent(String(playlistId))}`
    const resp = await $fetch<any>(url)
    const data = resp?.data
    if (!data) return null
    if (resp?.code !== undefined && resp.code !== 0) {
      console.warn(`[useMusicSource] sansenjian 歌单 ${playlistId} 业务失败: code=${resp.code} msg=${resp.msg}`)
      return null
    }

    const dissname: string = data.dissname ?? data.title ?? 'QQ 歌单'
    const desc: string = data.desc ?? ''
    const songlist: any[] = Array.isArray(data.songlist) ? data.songlist : []

    // 拉歌单封面（sansenjian 不在详情里返回 picurl，需额外请求）
    const playlistCover = await fetchQQPlaylistCoverSansenjian(baseUrl, String(playlistId))

    const mappedSongs: Song[] = songlist
      .filter((s: any) => s && (s.mid || s.songmid))
      .map((s: any) => mapQQSong(s, baseUrl))

    const songs: Song[] = mappedSongs.map((s) => ({ ...s, cover: '' }))

    return applyMetaOverrides({
      id: String(playlistId),
      name: dissname,
      cover: playlistCover,
      desc,
      songs,
    }, meta)
  }
  catch (e) {
    console.warn(`[useMusicSource] sansenjian 歌单 ${playlistId} 拉取失败:`, e)
    return null
  }
}

/** sansenjian 歌曲封面（/getImageUrl?id=songmid） */
async function resolveQQCoverSansenjian(baseUrl: string, mid: string): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/getImageUrl?id=${encodeURIComponent(mid)}&size=500x500`
    const resp = await $fetch<any>(url)
    const data = resp?.data
    if (typeof data === 'string') return data
    if (data && typeof data === 'object' && typeof data.url === 'string') return data.url
    return ''
  }
  catch {
    return ''
  }
}

/** sansenjian 歌曲 URL（/getMusicPlay?songmid=...） */
async function resolveQQUrlSansenjian(baseUrl: string, mid: string, _quality: QQQuality): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/getMusicPlay?songmid=${encodeURIComponent(mid)}`
    const resp = await $fetch<any>(url)
    return resp?.data?.url ?? ''
  }
  catch (e) {
    console.warn(`[useMusicSource] sansenjian 歌曲 ${mid} url 获取失败:`, e)
    return ''
  }
}

/** sansenjian 歌词（/getLyric?songmid=...&isFormat=1）
 *  options.trans 生效：追加翻译到主歌词后（用换行分隔）。
 *  options.qrc/roma：sansenjian 不区分，返回同一种 LRC，忽略。
 */
async function fetchQQLyricSansenjian(
  baseUrl: string,
  mid: string,
  options: { trans?: boolean },
): Promise<string> {
  try {
    const url = `${baseUrl.replace(/\/$/, '')}/getLyric?songmid=${encodeURIComponent(mid)}&isFormat=1`
    const resp = await $fetch<any>(url)
    const data = resp?.data
    if (!data) return ''
    let result = data.lyric ?? ''
    if (options.trans && data.trans) result += '\n' + data.trans
    return result
  }
  catch (e) {
    console.warn(`[useMusicSource] sansenjian 歌曲 ${mid} 歌词获取失败:`, e)
    return ''
  }
}

// ============================================================================
// API 工厂
// ============================================================================

/**
 * 根据 api 配置构造 MusicDataSource
 */
function buildApiDataSource(apiCfg: MusicApiConfigNested | undefined): MusicDataSource {
  if (!apiCfg) {
    return {
      async fetchPlaylists() { return silentEmpty('api 配置为空', Playlist as never) },
      async resolveSongUrl() { return '' },
      async fetchLyric() { return '' },
    }
  }

  if (apiCfg.provider === 'netease') {
    // app.config.ts 中按 provider 把子配置嵌套在 netease/qq 子键下
    const cfg: NeteaseApiConfig = {
      provider: 'netease',
      baseUrl: apiCfg.netease?.baseUrl ?? '',
      cookie: apiCfg.netease?.cookie || undefined,
      level: apiCfg.netease?.level,
      playlistIds: apiCfg.netease?.playlistIds,
      playlists: apiCfg.netease?.playlists,
      unblock: apiCfg.netease?.unblock,
    }
    const baseUrl = cfg.baseUrl
    const cookie = cfg.cookie
    const level = cfg.level ?? DEFAULT_NETEASE_LEVEL
    // 优先使用 playlists（带元数据），回退到 playlistIds（简单 ID 列表）
    const metaList: PlaylistConfig[] = (() => {
      if (cfg.playlists && cfg.playlists.length > 0) return cfg.playlists
      if (cfg.playlistIds && cfg.playlistIds.length > 0) {
        return cfg.playlistIds.map(id => ({ id }))
      }
      return []
    })()

    return {
      async fetchPlaylists(): Promise<Playlist[]> {
        if (!baseUrl) return silentEmpty('网易云 baseUrl 未配置', Playlist as never)
        if (metaList.length === 0) {
          console.warn('[useMusicSource] 网易云未配置 playlists/playlistIds，返回空歌单')
          return []
        }
        const results = await Promise.all(
          metaList.map(meta => fetchNeteasePlaylist(baseUrl, String(meta.id), cookie, meta)),
        )
        // 过滤掉 disabled=true 和 null 的项
        return results.filter((p, i): p is Playlist => {
          if (p === null) return false
          if (metaList[i].disabled) return false
          return true
        })
      },
      async resolveSongUrl(songId: string): Promise<string> {
        if (!baseUrl) return ''
        const ref = parseApiRef(songId)
        if (!ref || ref.provider !== 'netease') return ''
        return resolveNeteaseUrl(baseUrl, ref.externalId, level, cookie)
      },
      async fetchLyric(songId: string): Promise<string> {
        if (!baseUrl) return ''
        const ref = parseApiRef(songId)
        if (!ref || ref.provider !== 'netease') return ''
        return fetchNeteaseLyric(baseUrl, ref.externalId, cookie)
      },
      async resolveCover(songId: string): Promise<string> {
        // 网易云 cover 已在 song.cover 中填了真实图片 URL（picUrl?param=300y300），
        // 调用方应直接使用 song.cover。这里返回空表示“无需额外处理”。
        return ''
      },
    }
  }

  if (apiCfg.provider === 'qq') {
    const cfg: QQApiConfig = {
      provider: 'qq',
      baseUrl: apiCfg.qq?.baseUrl || undefined,
      quality: apiCfg.qq?.quality,
      playlistIds: apiCfg.qq?.playlistIds,
      playlists: apiCfg.qq?.playlists,
      fetchQrc: apiCfg.qq?.fetchQrc,
      fetchTrans: apiCfg.qq?.fetchTrans,
      fetchRoma: apiCfg.qq?.fetchRoma,
    }
    const qqType = cfg.type ?? 'ygking'
    const baseUrl = cfg.baseUrl
      ?? (qqType === 'sansenjian' ? DEFAULT_QQ_BASE_SANSENJIAN : DEFAULT_QQ_BASE_YGKING)
    const quality = cfg.quality ?? DEFAULT_QQ_QUALITY
    // 优先使用 playlists（带元数据），回退到 playlistIds（简单 ID 列表）
    const metaList: PlaylistConfig[] = (() => {
      if (cfg.playlists && cfg.playlists.length > 0) return cfg.playlists
      if (cfg.playlistIds && cfg.playlistIds.length > 0) {
        return cfg.playlistIds.map(id => ({ id }))
      }
      return []
    })()

    // 按 type 选择 provider 实现
    const fetchPlaylist = qqType === 'sansenjian' ? fetchQQPlaylistSansenjian : fetchQQPlaylistYGKing
    const resolveUrl = qqType === 'sansenjian' ? resolveQQUrlSansenjian : resolveQQUrlYGKing
    const fetchLyric = qqType === 'sansenjian' ? fetchQQLyricSansenjian : fetchQQLyricYGKing
    const resolveCover = qqType === 'sansenjian' ? resolveQQCoverSansenjian : resolveQQCoverYGKing

    return {
      async fetchPlaylists(): Promise<Playlist[]> {
        if (metaList.length === 0) {
          console.warn('[useMusicSource] QQ 未配置 playlists/playlistIds，返回空歌单')
          return []
        }
        const results = await Promise.all(
          metaList.map(meta => fetchPlaylist(baseUrl, meta.id, meta)),
        )
        return results.filter((p, i): p is Playlist => {
          if (p === null) return false
          if (metaList[i].disabled) return false
          return true
        })
      },
      async resolveSongUrl(songId: string): Promise<string> {
        const ref = parseApiRef(songId)
        if (!ref || ref.provider !== 'qq') return ''
        return resolveUrl(baseUrl, ref.externalId, quality)
      },
      async fetchLyric(songId: string): Promise<string> {
        const ref = parseApiRef(songId)
        if (!ref || ref.provider !== 'qq') return ''
        return fetchLyric(baseUrl, ref.externalId, {
          qrc: cfg.fetchQrc ?? false,
          trans: cfg.fetchTrans ?? false,
          roma: cfg.fetchRoma ?? false,
        })
      },
      async resolveCover(songId: string): Promise<string> {
        const ref = parseApiRef(songId)
        if (!ref || ref.provider !== 'qq') return ''
        return resolveCover(baseUrl, ref.externalId)
      },
    }
  }

  // spotify 暂未实装
  return {
    async fetchPlaylists() { return silentEmpty('spotify 暂未实装', Playlist as never) },
    async resolveSongUrl() { return '' },
    async fetchLyric() { return '' },
  }
}

// ============================================================================
// 配置解析
// ============================================================================

/**
 * 解析配置，决定要拉哪些源、合并顺序
 */
function resolveSourceFlags(): {
  pullLocal: boolean
  pullApi: boolean
  order: 'local-first' | 'api-first'
} {
  const config = useAppConfig()
  const music = (config.music ?? {}) as {
    source?: 'local' | 'api' | 'hybrid'
    enableLocal?: boolean
    enableApi?: boolean
    mergeOrder?: 'local-first' | 'api-first'
  }
  const mode = music.source ?? 'local'

  if (mode === 'local') return { pullLocal: true, pullApi: false, order: 'local-first' }
  if (mode === 'api') return { pullLocal: false, pullApi: true, order: 'api-first' }

  const pullLocal = music.enableLocal !== false
  const pullApi = music.enableApi !== false
  const order = music.mergeOrder ?? 'local-first'
  return { pullLocal, pullApi, order }
}

/** 安全拉取单个源，失败时返回空数组 */
async function safeFetch(source: MusicDataSource, label: string): Promise<Playlist[]> {
  try {
    const list = await source.fetchPlaylists()
    return Array.isArray(list) ? list : []
  }
  catch (e) {
    console.warn(`[useMusicSource] ${label} 数据源拉取失败:`, e)
    return []
  }
}

/**
 * 合并两个歌单列表并去重（按 id）
 */
function mergePlaylists(a: Playlist[], b: Playlist[]): Playlist[] {
  const seen = new Set<string>()
  const out: Playlist[] = []
  for (const pl of [...a, ...b]) {
    if (!seen.has(pl.id)) {
      seen.add(pl.id)
      out.push(pl)
    }
  }
  return out
}

// ============================================================================
// 混合数据源
// ============================================================================

const hybridSource: MusicDataSource = (() => {
  // api 子源（每次调用时构造，读取最新 config）
  function apiSubSource(): MusicDataSource {
    const config = useAppConfig()
    return buildApiDataSource(config.music?.api as MusicApiConfigNested | undefined)
  }

  return {
    async fetchPlaylists(): Promise<Playlist[]> {
      const { pullLocal, pullApi, order } = resolveSourceFlags()
      if (!pullLocal && !pullApi) {
        console.warn('[useMusicSource] hybrid 模式下 enableLocal 和 enableApi 都为 false，返回空歌单')
        return []
      }
      if (pullLocal && !pullApi) return localPlaylists
      if (pullApi && !pullLocal) {
        return safeFetch(apiSubSource(), 'api').then(list => list.map(p => prefixPlaylistId('api', p)))
      }
      const [rawLocal, rawApi] = await Promise.all([
        safeFetch(localSource, 'local'),
        safeFetch(apiSubSource(), 'api'),
      ])
      const taggedLocal = rawLocal.map(p => prefixPlaylistId('local', p))
      const taggedApi = rawApi.map(p => prefixPlaylistId('api', p))
      return order === 'api-first'
        ? mergePlaylists(taggedApi, taggedLocal)
        : mergePlaylists(taggedLocal, taggedApi)
    },
    async resolveSongUrl(songId: string): Promise<string> {
      if (songId.startsWith('local:')) return localSource.resolveSongUrl(songId)
      if (songId.startsWith('api:')) return apiSubSource().resolveSongUrl(songId)
      const config = useAppConfig()
      const mode = (config.music?.source ?? 'local') as string
      return mode === 'api' ? apiSubSource().resolveSongUrl(songId) : localSource.resolveSongUrl(songId)
    },
    async fetchLyric(songId: string): Promise<string> {
      if (songId.startsWith('local:')) return localSource.fetchLyric(songId)
      if (songId.startsWith('api:')) return apiSubSource().fetchLyric(songId)
      return ''
    },
    async resolveCover(songId: string): Promise<string> {
      if (songId.startsWith('local:')) return localSource.resolveCover(songId)
      if (songId.startsWith('api:')) return apiSubSource().resolveCover(songId)
      return ''
    },
  }
})()

// ============================================================================
// 公共工厂
// ============================================================================

/**
 * 按需补齐某歌单指定索引范围内歌曲的真实封面 URL。
 * 性能优化：fetchPlaylists 阶段所有歌曲 cover 都用 playlistCover 兑底，
 * 调用方在用户进入 songs 视图 / 滚动列表时调本函数补齐
 * （建议首批 8 首 + 滚动到底追加下一批）。
 *
 * @param playlist 歌单对象（会被原地修改 songs[].cover）
 * @param indexes  要补齐的歌曲索引数组
 * @param cfg     可选并发限制，默认 4
 */
export async function enrichSongCovers(
  playlist: Playlist,
  indexes: number[],
  cfg: { concurrency?: number } = {},
): Promise<void> {
  if (!playlist.songs.length || !indexes.length) return
  const concurrency = Math.max(1, cfg.concurrency ?? 4)
  const config = useAppConfig()
  const apiCfg = config.music?.api as MusicApiConfigNested | undefined
  if (!apiCfg?.qq?.baseUrl) return
  const baseUrl = apiCfg.qq.baseUrl
  const qqType = apiCfg.qq?.type ?? 'ygking'
  const resolveCover = qqType === 'sansenjian' ? resolveQQCoverSansenjian : resolveQQCoverYGKing

  // 仅处理 api 歌单
  if (!playlist.id.startsWith('api:')) return

  const queue = [...new Set(indexes.filter((i) => i >= 0 && i < playlist.songs.length))]
  const inFlight: Promise<void>[] = []

  async function worker(): Promise<void> {
    while (queue.length) {
      const i = queue.shift()
      if (i === undefined) return
      const song = playlist.songs[i]
      const ref = parseApiRef(song.id)
      if (!ref) continue
      try {
        const url = await resolveCover(baseUrl, ref.externalId)
        if (url) {
          song.cover = url
        }
      }
      catch {
        // 兑底保持 playlistCover，不报错
      }
    }
  }

  for (let i = 0; i < Math.min(concurrency, queue.length); i++) {
    inFlight.push(worker())
  }
  await Promise.all(inFlight)
}

/** 根据配置获取数据源 */
export function useMusicSource(): MusicDataSource {
  const config = useAppConfig()
  const sourceType = config.music?.source ?? 'local'

  if (sourceType === 'api') {
    const apiCfg = config.music?.api as MusicApiConfigNested | undefined
    const base = buildApiDataSource(apiCfg)
    return {
      async fetchPlaylists() {
        const list = await safeFetch(base, 'api')
        return list.map(p => prefixPlaylistId('api', p))
      },
      async resolveSongUrl(songId: string) {
        if (songId.startsWith('local:')) return localSource.resolveSongUrl(songId)
        return base.resolveSongUrl(songId)
      },
      async fetchLyric(songId: string) {
        if (songId.startsWith('local:')) return localSource.fetchLyric(songId)
        return base.fetchLyric(songId)
      },
      async resolveCover(songId: string) {
        if (songId.startsWith('local:')) return localSource.resolveCover(songId)
        return base.resolveCover(songId)
      },
    }
  }
  if (sourceType === 'hybrid') return hybridSource
  return localSource
}

/** 便捷方法：获取所有歌单 */
export async function fetchAllPlaylists(): Promise<Playlist[]> {
  const source = useMusicSource()
  return source.fetchPlaylists()
}
