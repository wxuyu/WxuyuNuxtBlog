// composables/useSteamAPIGet.ts
import blogConfig from '~~/blog.config'

// ==================== 基础类型定义 ====================

export type SteamStatus =
  | 'offline'
  | 'online'
  | 'away'
  | 'snooze'
  | 'busy'
  | 'trading'
  | 'playing'

export interface SteamAvatar {
  small: string
  medium: string
  large: string
}

export interface SteamCurrentGame {
  appid: number
  name: string
}

export interface SteamPlaytimeStats {
  totalForever: number
  totalTwoWeeks: number
}

export interface SteamUser {
  steamid: string
  username: string
  profileUrl: string
  avatar: SteamAvatar
  status: SteamStatus
  statusMessage: string
  currentGame?: SteamCurrentGame
  playtimeStats: SteamPlaytimeStats
}

export interface SteamGameAchievement {
  total: number
  unlocked: number
  percentage: number
}

export interface SteamGamePrice {
  amount: number
  currency: string
  displayPrice: string
}

export interface SteamGameImages {
  icon: string
  logo: string
  headerImage: string
  heroImage: string
  libraryHeroImage: string
}

export interface SteamGameDetail {
  appid: number
  name: string
  playtimeForever: number
  playtimeTwoWeeks: number
  price: SteamGamePrice
  images: SteamGameImages
  releaseDate: string
  shortDescription: string
  achievements?: SteamGameAchievement
}

export interface SteamGameTwoWeekSummary extends SteamGameDetail {}
export interface SteamGameAllTimeSummary extends SteamGameDetail {}

export interface SteamGamesList {
  totalCount: number
  recentCount: number
  recentGames: SteamGameTwoWeekSummary[]
  allGames: SteamGameAllTimeSummary[]
}

export interface SteamAchievementItem {
  name: string
  description: string
  unlocked: boolean
  unlockTime: number
  images: {
    icon: string
    iconGray: string
  }
}

export interface SteamGameAchievements {
  appid: number
  gameName: string
  total: number
  unlocked: number
  percentage: number
  items: SteamAchievementItem[]
}

export interface SteamAchievementsData {
  totalCount: number
  unlockedCount: number
  unlockedPercentage: number
  byGame: SteamGameAchievements[]
}

// ==================== API 响应类型 ====================

export interface SteamApiMetadata {
  cached: boolean
  cachedAt: string
  cacheExpiry: string
  fetchDuration: string
}

export interface SteamApiResponse<T> {
  success: boolean
  data?: T
  metadata?: SteamApiMetadata
  error?: string
  code?: string
}

export interface SteamUserResponse {
  user: SteamUser
}

export interface SteamGamesResponse {
  games: SteamGamesList
}

export interface SteamGameResponse {
  game: SteamGameDetail
}

export interface SteamAchievementsResponse {
  achievements: SteamAchievementsData
}

// ==================== Composable 返回类型 ====================

export interface SteamDataResult {
  user?: SteamUser
  games?: SteamGamesList
  achievements?: SteamAchievementsData
}

export interface SteamAllMetadata {
  user?: SteamApiMetadata
  games?: SteamApiMetadata
  achievements?: SteamApiMetadata
  gameDetail?: SteamApiMetadata
}

// ==================== 常量定义 ====================

export const steamStatusTextMap: Record<SteamStatus, string> = {
  offline: '离线',
  online: '在线',
  away: '离开',
  snooze: '打盹',
  busy: '忙碌',
  trading: '交易中',
  playing: '游戏中',
} as const

export const steamStatusColorMap: Record<SteamStatus, string> = {
  offline: '#90a0a6',
  online: '#4fc951',
  away: '#ffc72c',
  snooze: '#ffc72c',
  busy: '#ff6554',
  trading: '#6495ed',
  playing: '#26d07c',
} as const

// ==================== 工具函数 ====================

export const formatPlaytime = (hours: number): string => {
  return hours < 1 ? '< 1 小时' : `${Math.round(hours)} 小时`
}

export const formatSteamTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

// ==================== 内部缓存类型 ====================

type CacheEntry<T> = {
  data: SteamApiResponse<T>
  expiresAt: number
}

type FetchOptions = {
  force?: boolean
  ttl?: number
}

const DEFAULT_TTL = 60 * 1000
const GAME_DETAIL_TTL = 5 * 60 * 1000

// ==================== Composable 主函数 ====================

export const useSteamAPIGet = () => {
  // 共享状态：多个组件调用 composable 时复用同一份状态
  const loadingCount = useState<number>('steam-loading-count', () => 0)
  const error = useState<Error | null>('steam-error', () => null)
  const userData = useState<SteamUser | null>('steam-user-data', () => null)
  const gamesData = useState<SteamGamesList | null>('steam-games-data', () => null)
  const achievementsData = useState<SteamAchievementsData | null>('steam-achievements-data', () => null)
  const gameDetailMap = useState<Record<number, SteamGameDetail>>('steam-game-detail-map', () => ({}))
  const allMetadata = useState<SteamAllMetadata | null>('steam-all-metadata', () => null)

  // 内存缓存 + 请求去重
  const responseCache = useState<Record<string, CacheEntry<any>>>('steam-response-cache', () => ({}))
  const pendingRequests = useState<Record<string, Promise<any>>>('steam-pending-requests', () => ({}))

  const loading = computed(() => loadingCount.value > 0)

  const baseURL = computed(() => {
    return (blogConfig.Steam.status as string) || 'https://steam-api-profile-palomiku.netlify.app/api'
  })

  const endpoints = computed(() => ({
    user: `${baseURL.value}/steam-user`,
    games: `${baseURL.value}/steam-games`,
    game: (appid: number) => `${baseURL.value}/steam-game?appid=${appid}`,
    achievements: `${baseURL.value}/steam-achievements`,
  }))

  const setLoading = (value: boolean) => {
    if (value) {
      loadingCount.value += 1
    } else {
      loadingCount.value = Math.max(0, loadingCount.value - 1)
    }
  }

  const isCacheValid = (key: string) => {
    const entry = responseCache.value[key]
    return !!entry && entry.expiresAt > Date.now()
  }

  const getCache = <T>(key: string): SteamApiResponse<T> | null => {
    if (!isCacheValid(key)) return null
    return responseCache.value[key].data as SteamApiResponse<T>
  }

  const setCache = <T>(key: string, data: SteamApiResponse<T>, ttl = DEFAULT_TTL) => {
    responseCache.value[key] = {
      data,
      expiresAt: Date.now() + ttl,
    }
  }

  const clearCache = (key?: string) => {
    if (key) {
      delete responseCache.value[key]
      return
    }
    responseCache.value = {}
  }

  const fetchWithDedupe = async <T>(
    key: string,
    url: string,
    options: FetchOptions = {},
  ): Promise<SteamApiResponse<T> | null> => {
    const { force = false, ttl = DEFAULT_TTL } = options

    // 1. 优先返回缓存
    if (!force) {
      const cached = getCache<T>(key)
      if (cached) return cached
    }

    // 2. 有相同请求正在进行时，直接复用 Promise
    if (!force && pendingRequests.value[key]) {
      return pendingRequests.value[key] as Promise<SteamApiResponse<T> | null>
    }

    const requestPromise = (async () => {
      try {
        const response = await $fetch<SteamApiResponse<T>>(url, {
          method: 'GET',
          headers: {
            Accept: 'application/json',
          },
          // 不再强制 no-store，让服务端/CDN/浏览器仍有机会利用缓存策略
        })

        if (response?.success) {
          setCache(key, response, ttl)
        }

        return response
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err)
        console.error('[Steam] Fetch error:', message)
        return null
      } finally {
        delete pendingRequests.value[key]
      }
    })()

    pendingRequests.value[key] = requestPromise
    return requestPromise
  }

  const mergeMetadata = (patch: Partial<SteamAllMetadata>) => {
    allMetadata.value = {
      ...(allMetadata.value || {}),
      ...patch,
    }
  }

  const fetchUser = async (options: FetchOptions = {}) => {
    const res = await fetchWithDedupe<SteamUserResponse>(
      'steam:user',
      endpoints.value.user,
      { ttl: DEFAULT_TTL, ...options },
    )

    if (res?.success && res.data?.user) {
      userData.value = res.data.user
      mergeMetadata({ user: res.metadata })
    }

    return res
  }

  const fetchGames = async (limit?: number, options: FetchOptions = {}) => {
    const validLimit = limit && limit > 0 && limit <= 100 ? limit : undefined
    const url = validLimit
      ? `${endpoints.value.games}?limit=${validLimit}`
      : endpoints.value.games
    const key = `steam:games:${validLimit ?? 'default'}`

    const res = await fetchWithDedupe<SteamGamesResponse>(
      key,
      url,
      { ttl: DEFAULT_TTL, ...options },
    )

    if (res?.success && res.data?.games) {
      gamesData.value = res.data.games
      mergeMetadata({ games: res.metadata })
    }

    return res
  }

  const fetchAchievements = async (options: FetchOptions = {}) => {
    const res = await fetchWithDedupe<SteamAchievementsResponse>(
      'steam:achievements',
      endpoints.value.achievements,
      { ttl: DEFAULT_TTL, ...options },
    )

    if (res?.success && res.data?.achievements) {
      achievementsData.value = res.data.achievements
      mergeMetadata({ achievements: res.metadata })
    }

    return res
  }

  const fetchSteamData = async (
    limit?: number,
    options: FetchOptions = {},
  ): Promise<SteamApiResponse<SteamDataResult> & { allMetadata?: SteamAllMetadata }> => {
    setLoading(true)
    error.value = null

    try {
      const [userRes, gamesRes, achievementsRes] = await Promise.all([
        fetchUser(options),
        fetchGames(limit, options),
        fetchAchievements(options),
      ])

      if (!userRes?.success || !gamesRes?.success) {
        const errMsg = 'Failed to fetch required Steam data'
        error.value = new Error(errMsg)
        return {
          success: false,
          error: errMsg,
          code: 'FETCH_ERROR',
        }
      }

      return {
        success: true,
        data: {
          user: userRes.data?.user,
          games: gamesRes.data?.games,
          achievements: achievementsRes?.data?.achievements,
        },
        allMetadata: allMetadata.value || undefined,
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Steam] Fetch error:', message)

      const errorObj = err instanceof Error ? err : new Error(message)
      error.value = errorObj

      return {
        success: false,
        error: `Fetch failed: ${message}`,
        code: 'FETCH_ERROR',
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchGameDetail = async (
    appid: number,
    options: FetchOptions = {},
  ): Promise<SteamApiResponse<SteamGameDetail>> => {
    setLoading(true)

    try {
      const res = await fetchWithDedupe<SteamGameResponse>(
        `steam:game:${appid}`,
        endpoints.value.game(appid),
        { ttl: GAME_DETAIL_TTL, ...options },
      )

      if (res?.success && res.data?.game) {
        gameDetailMap.value[appid] = res.data.game
        mergeMetadata({ gameDetail: res.metadata })

        return {
          success: true,
          data: res.data.game,
          metadata: res.metadata,
        }
      }

      return {
        success: false,
        error: res?.error || 'Failed to fetch game details',
        code: 'FETCH_ERROR',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[Steam] Fetch game detail error:', message)

      return {
        success: false,
        error: `Fetch failed: ${message}`,
        code: 'FETCH_ERROR',
      }
    } finally {
      setLoading(false)
    }
  }

  const refreshUser = () => fetchUser({ force: true })
  const refreshGames = (limit?: number) => fetchGames(limit, { force: true })
  const refreshAchievements = () => fetchAchievements({ force: true })
  const refreshGameDetail = (appid: number) => fetchGameDetail(appid, { force: true })

  const getGameDetail = computed(() => {
    return (appid: number) => gameDetailMap.value[appid] || null
  })

  return {
    // 状态
    loading: readonly(loading),
    error: readonly(error),
    userData: readonly(userData),
    gamesData: readonly(gamesData),
    achievementsData: readonly(achievementsData),
    gameDetailMap: readonly(gameDetailMap),
    allMetadata: readonly(allMetadata),

    // 计算
    endpoints: readonly(endpoints),
    baseURL: readonly(baseURL),
    getGameDetail,

    // 方法
    fetchSteamData,
    fetchGameDetail,
    refreshUser,
    refreshGames,
    refreshAchievements,
    refreshGameDetail,
    clearCache,
    formatPlaytime,
    formatSteamTime,

    // 常量
    statusTextMap: steamStatusTextMap,
    statusColorMap: steamStatusColorMap,
  }
}

// ==================== 向后兼容别名导出 ====================

export const a = steamStatusTextMap
export const f = formatPlaytime
export const s = steamStatusColorMap
export const u = useSteamAPIGet

export default useSteamAPIGet