// composables/useSteamAPIGet.ts

import type { FetchError } from 'ofetch'
import blogConfig from '~~/blog.config'

// ==================== 基础类型定义 ====================

export type SteamStatus = 'offline' | 'online' | 'away' | 'snooze' | 'busy' | 'trading' | 'playing'

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

export interface SteamGameSummary {
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

export interface SteamGamesList {
  totalCount: number
  recentCount: number
  recentGames: SteamGameSummary[]
  allGames: SteamGameSummary[]
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

/**
 * 状态文本映射 (原 h)
 */
export const steamStatusTextMap: Record<SteamStatus, string> = {
  offline: "离线",
  online: "在线",
  away: "离开",
  snooze: "打盹",
  busy: "忙碌",
  trading: "交易中",
  playing: "游戏中"
} as const

/**
 * 状态颜色映射 (原 p)
 */
export const steamStatusColorMap: Record<SteamStatus, string> = {
  offline: "#90a0a6",
  online: "#4fc951",
  away: "#ffc72c",
  snooze: "#ffc72c",
  busy: "#ff6554",
  trading: "#6495ed",
  playing: "#26d07c"
} as const

// ==================== 工具函数 ====================

/**
 * 格式化游戏时长 (原 l)
 * @param hours 小时数
 * @returns 格式化后的字符串
 */
export const formatPlaytime = (hours: number): string => {
  return hours < 1 ? "< 1 小时" : `${Math.round(hours)} 小时`
}

/**
 * 格式化时间戳为可读日期
 */
export const formatSteamTime = (timestamp: number): string => {
  return new Date(timestamp * 1000).toLocaleDateString('zh-CN')
}

// ==================== Composable 主函数 ====================

/**
 * Steam API 获取 Composable (原 g)
 * 适配 Nuxt 3，使用 $fetch 和 useRuntimeConfig
 */
export const useSteamAPIGet = () => {
  const config = useRuntimeConfig()
  
  // 响应式状态
  const loading = ref(false)
  const error = ref<Error | null>(null)
  const userData = ref<SteamUser | null>(null)
  const gamesData = ref<SteamGamesList | null>(null)
  const gameDetail = ref<SteamGameDetail | null>(null)
  const achievementsData = ref<SteamAchievementsData | null>(null)
  const allMetadata = ref<SteamAllMetadata | null>(null)

  // 从 Nuxt Runtime Config 获取 API 基础 URL，提供默认值
  const baseURL = computed(() => {
    return (blogConfig.Steam.status as string) || "https://steam-api-profile-palomiku.netlify.app/api"
  })

  // API 端点计算属性
  const endpoints = computed(() => ({
    user: `${baseURL.value}/steam-user`,
    games: `${baseURL.value}/steam-games`,
    game: (appid: number) => `${baseURL.value}/steam-game?appid=${appid}`,
    achievements: `${baseURL.value}/steam-achievements`
  }))

  /**
   * 基础请求方法 (原 o)
   * 使用 Nuxt 的 $fetch (ofetch)
   */
  const fetchSteamAPI = async <T>(url: string): Promise<SteamApiResponse<T> | null> => {
    try {
      const response = await $fetch<SteamApiResponse<T>>(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json'
        },
        cache: 'no-store'
      })
      
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Steam] Fetch error:", errorMessage)
      return null
    }
  }

  /**
   * 获取 Steam 数据（批量获取用户、游戏列表、成就）
   * @param limit 游戏数量限制 (1-100)，仅影响 allGames
   */
  const fetchSteamData = async (limit?: number): Promise<SteamApiResponse<SteamDataResult> & { allMetadata?: SteamAllMetadata }> => {
    loading.value = true
    error.value = null
    
    try {
      // 构建游戏端点 URL，支持限制数量
      const gamesEndpoint = (limit && limit > 0 && limit <= 100) 
        ? `${endpoints.value.games}?limit=${limit}` 
        : endpoints.value.games

      // 并行请求三个端点
      const [userRes, gamesRes, achievementsRes] = await Promise.all([
        fetchSteamAPI<SteamUserResponse>(endpoints.value.user),
        fetchSteamAPI<SteamGamesResponse>(gamesEndpoint),
        fetchSteamAPI<SteamAchievementsResponse>(endpoints.value.achievements)
      ])

      // 验证必需数据
      if (!userRes?.success || !gamesRes?.success) {
        const errMsg = "Failed to fetch required Steam data"
        error.value = new Error(errMsg)
        return {
          success: false,
          error: errMsg,
          code: "FETCH_ERROR"
        }
      }

      // 组装数据
      const resultData: SteamDataResult = {
        user: userRes.data?.user,
        games: gamesRes.data?.games,
        achievements: achievementsRes?.data?.achievements
      }

      const metaData: SteamAllMetadata = {
        user: userRes.metadata,
        games: gamesRes.metadata,
        achievements: achievementsRes?.metadata
      }

      // 更新响应式状态
      userData.value = resultData.user
      gamesData.value = resultData.games
      achievementsData.value = resultData.achievements
      allMetadata.value = metaData

      return {
        success: true,
        data: resultData,
        allMetadata: metaData
      }
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Steam] Fetch error:", errorMessage)
      
      const errorObj = err instanceof Error ? err : new Error(String(err))
      error.value = errorObj
      
      return {
        success: false,
        error: `Fetch failed: ${errorMessage}`,
        code: "FETCH_ERROR"
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 获取单个游戏详情
   * @param appid 游戏 AppID
   */
  const fetchGameDetail = async (appid: number): Promise<SteamApiResponse<SteamGameDetail>> => {
    loading.value = true
    
    try {
      const response = await fetchSteamAPI<SteamGameResponse>(endpoints.value.game(appid))
      
      if (response?.success && response.data) {
        gameDetail.value = response.data.game
        
        // 更新元数据
        if (allMetadata.value) {
          allMetadata.value.gameDetail = response.metadata
        } else {
          allMetadata.value = { gameDetail: response.metadata }
        }
        
        return {
          success: true,
          data: response.data.game,
          metadata: response.metadata
        }
      }
      
      return {
        success: false,
        error: response?.error || "Failed to fetch game details",
        code: "FETCH_ERROR"
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      console.error("[Steam] Fetch game detail error:", errorMessage)
      
      return {
        success: false,
        error: `Fetch failed: ${errorMessage}`,
        code: "FETCH_ERROR"
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 刷新特定数据（支持部分刷新）
   */
  const refreshUser = async () => {
    const res = await fetchSteamAPI<SteamUserResponse>(endpoints.value.user)
    if (res?.success) {
      userData.value = res.data.user
      if (allMetadata.value) allMetadata.value.user = res.metadata
    }
    return res
  }

  const refreshGames = async (limit?: number) => {
    const url = limit ? `${endpoints.value.games}?limit=${limit}` : endpoints.value.games
    const res = await fetchSteamAPI<SteamGamesResponse>(url)
    if (res?.success) {
      gamesData.value = res.data.games
      if (allMetadata.value) allMetadata.value.games = res.metadata
    }
    return res
  }

  const refreshAchievements = async () => {
    const res = await fetchSteamAPI<SteamAchievementsResponse>(endpoints.value.achievements)
    if (res?.success) {
      achievementsData.value = res.data.achievements
      if (allMetadata.value) allMetadata.value.achievements = res.metadata
    }
    return res
  }

  return {
    // 状态 (readonly)
    loading: readonly(loading),
    error: readonly(error),
    userData: readonly(userData),
    gamesData: readonly(gamesData),
    gameDetail: readonly(gameDetail),
    achievementsData: readonly(achievementsData),
    allMetadata: readonly(allMetadata),
    
    // 计算属性
    endpoints: readonly(endpoints),
    baseURL: readonly(baseURL),
    
    // 方法
    fetchSteamData,
    fetchGameDetail,
    fetchSteamAPI,
    formatPlaytime,
    formatSteamTime,
    refreshUser,
    refreshGames,
    refreshAchievements,
    
    // 便捷常量
    statusTextMap: steamStatusTextMap,
    statusColorMap: steamStatusColorMap
  }
}

// ==================== 向后兼容的别名导出 ====================

/**
 * 状态文本映射别名 (原 h as a)
 * @deprecated 建议使用 useSteamAPIGet().statusTextMap 或直接使用 steamStatusTextMap
 */
export const a = steamStatusTextMap

/**
 * 格式化函数别名 (原 l as f)
 * @deprecated 建议使用 useSteamAPIGet().formatPlaytime 或直接使用 formatPlaytime
 */
export const f = formatPlaytime

/**
 * 状态颜色映射别名 (原 p as s)
 * @deprecated 建议使用 useSteamAPIGet().statusColorMap 或直接使用 steamStatusColorMap
 */
export const s = steamStatusColorMap

/**
 * Composable 别名 (原 g as u)
 * @deprecated 建议直接使用 useSteamAPIGet
 */
export const u = useSteamAPIGet

// 默认导出
export default useSteamAPIGet