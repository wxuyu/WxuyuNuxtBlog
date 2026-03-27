---
title: 游戏展示页面
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-03-21 10:00:00
updated: 2026-03-22 10:00:00
image: /image/PostCover/footerNuxtMeihua.avif
categories:
  - 博客魔改
tags:
  - Nuxt
  - 魔改
  - 美化
recommend: true
---

## 核心代码

### 数据获取
``` ts [useSteamAPI.ts] lang="ts"
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
```

### 页面组件
::tab{:tabs='["用户面板", "信息面板", "游戏面板"]'}
#tab1
``` vue [avatar.vue] lang="vue"
<script setup lang="ts">
const { 
  fetchSteamData, 
  fetchGameDetail,
  userData, 
  statusTextMap, 
  statusColorMap 
} = useSteamAPIGet()

// 初始加载数据
onMounted(async () => {
  // 获取基础数据
  await fetchSteamData(10)
  
  // 如果用户正在游戏中，获取游戏详情
  if (userData.value?.currentGame) {
    await fetchGameDetail(userData.value.currentGame.appid)
  }
})
</script>

<template>
  <div class="SteamUser">
    <div class="SteamUserHeader">
      <NuxtImg class="UserHeaderAvatar" :src="`${userData?.avatar.large}`" />
      <div class="UserHeaderInfo">
        <div class="HeaderInfoRow">
          <h2 class="RowUserName">
            {{ userData?.username }}
          </h2>
          <div class="RowBadgeGroup">
            <div class="RowBadgeCard" :style="`--status-color: ${statusColorMap[userData?.status]}`">
              <span class="BadgeCardDot" />
              {{ statusTextMap[userData?.status] }}
            </div>
          </div>
        </div>
        <p class="StatusInfoText" v-show="userData?.status === 'offline'">当前该用户已{{ statusTextMap[userData?.status] }}</p>
        <a class="StatusInfoUrl" :href="userData?.profileUrl" target="_blank"> 访问 Steam 个人资料 → </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamUser {
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: .8em;
  padding: 1em;
  transition: border-color .3s ease;
  @media (max-width: 767px) {
    padding: .75em;
  }
  .SteamUserHeader {
    align-items: flex-start;
    display: flex;
    gap: 1em;
    @media (max-width: 767px) {
      gap: .75em;
    }
    .UserHeaderAvatar {
      border: 2px solid var(--c-primary);
      border-radius: 50%;
      flex-shrink: 0;
      height: 100px;
      -o-object-fit: cover;
      object-fit: cover;
      width: 100px;
      @media (max-width: 767px) {
        height: 80px;
        width: 80px;
      }
      @media (max-width: 480px) {
        height: 70px;
        width: 70px;
      }
    }
    .UserHeaderInfo {
      flex: 1;
      min-width: 0;
      .HeaderInfoRow {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: .75em;
        margin-bottom: .5em;
        @media (max-width: 767px) {
          gap: .5em;
          margin-bottom: .4em;
        }
        .RowUserName {
          color: var(--c-text);
          font-size: 1.25em;
          font-weight: 600;
          margin: 0;
          word-break: break-word;
          @media (max-width: 480px) {
            font-size: 1em;
          }
          @media (max-width: 767px) {
            font-size: 1.1em;
          }
        }
        .RowBadgeGroup {
          align-items: center;
          display: flex;
          gap: .5em;
          .RowBadgeCard {
            align-items: center;
            background: color-mix(in srgb, var(--status-color) 15%, transparent);
            border-radius: 1em;
            color: var(--status-color);
            display: inline-flex;
            font-size: .875em;
            font-weight: 500;
            gap: .5em;
            padding: .25em .75em;
            white-space: nowrap;
            @media (max-width: 767px) {
              font-size: .8em;
              padding: .2em .6em;
            }
            .BadgeCardDot {
              animation: pulse-a9cdcf99 1.5s ease-in-out infinite;
              background: var(--status-color);
              border-radius: 50%;
              display: inline-block;
              height: 6px;
              width: 6px;
            }
          }
        }
      }
      .StatusInfoText {
        color: var(--c-text-2);
        font-size: .85em;
        font-weight: 400;
        margin: .125em 0 0;
        @media (max-width: 480px) {
          font-size: .8em;
        }
      }
      .StatusInfoUrl {
        color: var(--c-primary);
        display: inline-block;
        font-size: .875em;
        font-weight: 500;
        margin-top: .5em;
        text-decoration: none;
        transition: opacity .2s;
      }
    }
  }
}
</style>
```

#tab2
``` vue [overview.vue] lang="vue"
<script setup lang="ts">
const { 
  fetchSteamData, 
  fetchGameDetail,
  formatPlaytime, 
  formatSteamTime,
  userData, 
  gamesData, 
  achievementsData,
  statusTextMap, 
  statusColorMap 
} = useSteamAPIGet()

const overviewListItemData = [
  {
    icon: 'ph:game-controller-bold',
    label: '游戏总数量',
    value: computed(() => formatNumber(gamesData.value?.totalCount) || '--'),
    type: '数量'
  },{
    icon: 'ph:timer-bold',
    label: '游玩总时长',
    value: computed(() => formatNumber(userData.value?.playtimeStats.totalForever) || '--'),
    type: '时间'
  },{
    icon: 'ph:calendar-fill',
    label: '两周总时长',
    value: computed(() => formatNumber(userData.value?.playtimeStats.totalTwoWeeks) || '--'),
    type: '时间'
  }
]

// 初始加载数据
onMounted(async () => {
  // 获取基础数据
  await fetchSteamData(10)
  
  // 如果用户正在游戏中，获取游戏详情
  if (userData.value?.currentGame) {
    await fetchGameDetail(userData.value.currentGame.appid)
  }
})
</script>

<template>
  <div class="SteamStatus-overviewList">
    <div class="overviewListItem" v-for="item in overviewListItemData">
      <Icon class="ItemIcon" :name="item.icon"/>
      <div class="ItemInfo">
        <div class="ItemInfoLabel">
          {{ item.label }}
        </div>
        <div class="ItemInfoValue" v-show="item.type === '数量'">
          {{ item.value }} 个
        </div>
        <div class="ItemInfoValue" v-show="item.type === '时间'">
          {{ item.value }} 小时
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamStatus-overviewList{ 
  box-shadow: var(--ld-shadow);
  display: flex;
  flex-direction: row;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.8em;
  gap: 0.8em;
  padding: 0.8em 1em;
  transition: box-shadow 0.2s;
  @media (max-width: 600px) {
    flex-direction: column;
    gap: .4em;
    padding: .8em 1em;
  }
  .overviewListItem{
    align-items: center;
    display: flex;
    flex: 1 1 0%;
    gap: 0.6em;
    padding: 0.3em 0px;
    @media (max-width: 600px) {
      flex: auto;
      gap: .6em;
      padding: .3em 0;
    }
    .ItemIcon {
      font-size: 28px;
      color: var(--c-primary);
      flex-shrink: 0;
    }
    .ItemInfo {
      display: flex;
      flex-direction: column;
      flex: 1 1 0%;
      gap: 0px;
      .ItemInfoLabel {
        color: var(--c-text-2);
        font-size: 0.75em;
        font-weight: 600;
        @media (max-width: 600px) {
          font-size: 0.7em;
        }
      }
      .ItemInfoValue {
        color: var(--c-primary);
        font-size: 0.95em;
        font-weight: 700;
        line-height: 1.2;
        @media (max-width: 600px) {
          font-size: .85em;
        }
      }
    }
  }
}
.overviewListItem:not(:last-child) {
  padding-right: 0.8em;
  border-right: 1px solid var(--c-border);
  @media (max-width: 600px) {
    border-bottom: 1px solid var(--c-border);
    border-right: none;
    padding-bottom: .4em;
    padding-right: 0;
  }
}
</style>
```

#tab3
::tab{:tabs='["最近游玩", "全部游戏"]'}
#tab1
``` vue [recentGames.vue] lang="vue"
<script setup lang="ts">
import GameTitle from './gameTitle.vue';

const { 
  fetchSteamData, 
  fetchGameDetail,
  formatPlaytime, 
  formatSteamTime,
  userData, 
  gamesData, 
  achievementsData,
  statusTextMap, 
  statusColorMap 
} = useSteamAPIGet()

// 初始加载数据
onMounted(async () => {
  // 获取基础数据
  await fetchSteamData(10)
  
  // 如果用户正在游戏中，获取游戏详情
  if (userData.value?.currentGame) {
    await fetchGameDetail(userData.value.currentGame.appid)
  }
})

const textAPI = gamesData.value?.recentGames
</script>

<template>
  <div class="SteamGameMain">
    <GameTitle title="最近游玩" icon="game-controller-bold" :sub-title="`显示最近两周玩的${gamesData?.recentCount}款游戏`"/>
    <div class="SteamGameList">
      <a class="GameListCard" v-for="game in gamesData?.recentGames" :href="`https://steamcommunity.com/app/${game.appid}`" target="_blank">
        <div class="ListCardHeader">
          <NuxtImg class="CardHeaderImage" :src="game.images.headerImage" />
        </div>
        <div class="ListCardBody">
          <div class="CardBodyInfo">
            <h3 class="BodyInfoTitle">{{ game.name }}</h3>
            <div class="BodyInfoStatus">
              <div class="InfoStatusRow">
                <div class="StatusRowText">
                  <div class="RowTextLabel">
                    总时长
                  </div>
                  <div class="RowTextValue">
                    {{ game.playtimeForever }}h
                  </div>
                </div>
                <Badge class="StatusRowBadge" :text="`最近${ game.playtimeTwoWeeks }h`" />
              </div>
            </div>
          </div>
          <div class="ListCardAchievements">
            <div class="CardAchievementsInfo">
              <div class="AchievementsInfoLabel">
                <Icon class="InfoLabelIcon" name="i-ph:trophy-bold" :style="`color: ${game.achievements?.percentage === game.achievements?.total}`"/>
                <span class="InfoLabelCount">
                  {{ game.achievements?.unlocked }} / {{ game.achievements?.total }}
                </span>
              </div>
              <span class="GamePriceNumber">{{ game.price.displayPrice }}</span>
            </div>
            <div class="CardAchievementsProgress">
              <div class="AchievementsProgressContainer" style="height: 6px;">
                <div class="ProgressCcontainerBar" :style="`width: ${game.achievements?.percentage}%`" />
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamGameMain{
  .SteamGameList {
    display: flex;
    flex-direction: column;
    gap: .5em;
    min-width: 0;
    overflow: auto hidden;
    padding-bottom: .5em;
    scroll-behavior: smooth;
    width: 100%;
    @media (max-width: 767px) {
      gap: .4em;
      padding-bottom: .4em;
    }
    .GameListCard {
      background: var(--ld-bg-card);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      height: 120px;
      overflow: hidden;
      position: relative;
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      width: 100%;
      @media (max-width: 640px) {
        flex-direction: column;
        height: auto;
      }
      .ListCardHeader {
        flex-shrink: 0;
        max-width: 220px;
        min-width: 140px;
        overflow: hidden;
        position: relative;
        width: 35%;
        @media (max-width: 640px) {
          height: 140px;
          max-width: none;
          width: 100%;
        }
        .CardHeaderImage {
          height: 100%;
          -o-object-fit: cover;
          object-fit: cover;
          transition: transform .4s ease;
          width: 100%;
        }
      }
      .ListCardBody {
        flex: 1;
        justify-content: space-between;
        min-width: 0;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        @media (max-width: 640px) {
          gap: 16px;
          padding: 12px;
        }
        .CardBodyInfo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          .BodyInfoTitle {
            color: var(--c-text);
            display: -webkit-box;
            font-size: 1rem;
            font-weight: 700;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            line-height: 1.3;
            margin: 0;
            overflow: hidden;
            -webkit-box-orient: vertical;
          }
          .BodyInfoStatus {
            color: var(--c-text-2);
            flex-wrap: wrap;
            font-size: .85rem;
            gap: 12px;
            .InfoStatusRow {
              align-items: center;
              display: flex;
              gap: 6px;
              .StatusRowText {
                align-items: baseline;
                display: flex;
                gap: 4px;
                .RowTextLabel {
                  color: var(--c-text-2);
                  font-size: .9em;
                  font-weight: 600;
                  margin-bottom: .2em;
                  font-synthesis: weight style;
                }
                .RowTextValue {
                  color: var(--c-text-1);
                  font-family: var(--font-monospace, monospace);
                  font-weight: 600;
                  font-size: 1.5em;
                }
              }
              .StatusRowBadge:not([href]) {
                background-color: var(--c-primary-soft, color-mix(in srgb, var(--c-primary) 10%, transparent));
                border-color: var(--c-primary-light, color-mix(in srgb, var(--c-primary) 30%, transparent));
                color: var(--c-primary);
              }
            }
          }
        }
        .ListCardAchievements {
          margin-top: auto;
          .CardAchievementsInfo {
            align-items: center;
            display: flex;
            font-size: .8rem;
            justify-content: space-between;
            margin-bottom: 6px;
            .AchievementsInfoLabel {
              align-items: center;
              color: var(--c-text-2);
              display: flex;
              gap: 6px;
            }
          }
          .CardAchievementsProgress {
            align-items: center;
            display: flex;
            gap: .5rem;
            width: 100%;
            .AchievementsProgressContainer {
              background: var(--c-bg-2);
              border-radius: 2px;
              cursor: pointer;
              flex: 1;
              min-width: 0;
              overflow: visible;
              position: relative;
              transition: background-color .15s ease;
              -webkit-user-select: none;
              -moz-user-select: none;
              user-select: none;
              .ProgressCcontainerBar {
                background: var(--c-primary);
                border-radius: 2px;
                height: 100%;
                position: relative;
                transition: width .1s linear;
              } 
            }
          }
        }
      }
    }
  }
}
.InfoLabelIcon {
    color: #10b981;
}
</style>
```

#tab2
``` vue [allGame.vue] lang="vue"
<script setup lang="ts">
import GameTitle from './gameTitle.vue';

const { 
  fetchSteamData, 
  fetchGameDetail,
  formatPlaytime, 
  formatSteamTime,
  userData, 
  gamesData, 
  achievementsData,
  statusTextMap, 
  statusColorMap
} = useSteamAPIGet()

// 初始加载数据
onMounted(async () => {
  // 获取基础数据
  await fetchSteamData(10)
  
  // 如果用户正在游戏中，获取游戏详情
  if (userData.value?.currentGame) {
    await fetchGameDetail(userData.value.currentGame.appid)
  }
})
</script>

<template>
  <div class="SteamGameMain">
    <GameTitle title="游戏库" icon="stack-bold" :sub-title="`显示游玩时长最多的${gamesData?.totalCount}款游戏`"/>
    <div class="SteamGameList">
      <a class="GameListCard" v-for="game in gamesData?.allGames" :href="`https://steamcommunity.com/app/${game.appid}`" target="_blank">
        <div class="ListCardHeader">
          <NuxtImg class="CardHeaderImage" :src="game.images.headerImage" />
        </div>
        <div class="ListCardBody">
          <div class="CardBodyInfo">
            <h3 class="BodyInfoTitle">{{ game.name }}</h3>
            <div class="BodyInfoStatus">
              <div class="InfoStatusRow">
                <div class="StatusRowText">
                  <div class="RowTextLabel">
                    总时长
                  </div>
                  <div class="RowTextValue">
                    {{ game.playtimeForever }}h
                  </div>
                </div>
                <Badge class="StatusRowBadge" :text="`最近${ game.playtimeTwoWeeks }h`" />
              </div>
            </div>
          </div>
          <div class="ListCardAchievements">
            <div class="CardAchievementsInfo">
              <div class="AchievementsInfoLabel">
                <Icon class="InfoLabelIcon" name="i-ph:trophy-bold" :style="`color: ${game.achievements?.percentage === game.achievements?.total}`"/>
                <span class="InfoLabelCount">
                  {{ game.achievements?.unlocked }} / {{ game.achievements?.total }}
                </span>
              </div>
            </div>
            <div class="CardAchievementsProgress">
              <div class="AchievementsProgressContainer" style="height: 6px;">
                <div class="ProgressCcontainerBar" :style="`width: ${game.achievements?.percentage}%`" />
              </div>
            </div>
          </div>
        </div>
      </a>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamGameMain{
  .SteamGameList {
    display: flex;
    flex-direction: column;
    gap: .5em;
    min-width: 0;
    overflow: auto hidden;
    padding-bottom: .5em;
    scroll-behavior: smooth;
    width: 100%;
    @media (max-width: 767px) {
      gap: .4em;
      padding-bottom: .4em;
    }
    .GameListCard {
      background: var(--ld-bg-card);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      height: 120px;
      overflow: hidden;
      position: relative;
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      width: 100%;
      @media (max-width: 640px) {
        flex-direction: column;
        height: auto;
      }
      .ListCardHeader {
        flex-shrink: 0;
        max-width: 220px;
        min-width: 140px;
        overflow: hidden;
        position: relative;
        width: 35%;
        @media (max-width: 640px) {
          height: 140px;
          max-width: none;
          width: 100%;
        }
        .CardHeaderImage {
          height: 100%;
          -o-object-fit: cover;
          object-fit: cover;
          transition: transform .4s ease;
          width: 100%;
        }
      }
      .ListCardBody {
        flex: 1;
        justify-content: space-between;
        min-width: 0;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        @media (max-width: 640px) {
          gap: 16px;
          padding: 12px;
        }
        .CardBodyInfo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          .BodyInfoTitle {
            color: var(--c-text);
            display: -webkit-box;
            font-size: 1rem;
            font-weight: 700;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            line-height: 1.3;
            margin: 0;
            overflow: hidden;
            -webkit-box-orient: vertical;
          }
          .BodyInfoStatus {
            color: var(--c-text-2);
            flex-wrap: wrap;
            font-size: .85rem;
            gap: 12px;
            .InfoStatusRow {
              align-items: center;
              display: flex;
              gap: 6px;
              .StatusRowText {
                align-items: baseline;
                display: flex;
                gap: 4px;
                .RowTextLabel {
                  color: var(--c-text-2);
                  font-size: .9em;
                  font-weight: 600;
                  margin-bottom: .2em;
                  font-synthesis: weight style;
                }
                .RowTextValue {
                  color: var(--c-text-1);
                  font-family: var(--font-monospace, monospace);
                  font-weight: 600;
                  font-size: 1.5em;
                }
              }
              .StatusRowBadge:not([href]) {
                background-color: var(--c-primary-soft, color-mix(in srgb, var(--c-primary) 10%, transparent));
                border-color: var(--c-primary-light, color-mix(in srgb, var(--c-primary) 30%, transparent));
                color: var(--c-primary);
              }
            }
          }
        }
        .ListCardAchievements {
          margin-top: auto;
          .CardAchievementsInfo {
            align-items: center;
            display: flex;
            font-size: .8rem;
            justify-content: space-between;
            margin-bottom: 6px;
            .AchievementsInfoLabel {
              align-items: center;
              color: var(--c-text-2);
              display: flex;
              gap: 6px;
            }
          }
          .CardAchievementsProgress {
            align-items: center;
            display: flex;
            gap: .5rem;
            width: 100%;
            .AchievementsProgressContainer {
              background: var(--c-bg-2);
              border-radius: 2px;
              cursor: pointer;
              flex: 1;
              min-width: 0;
              overflow: visible;
              position: relative;
              transition: background-color .15s ease;
              -webkit-user-select: none;
              -moz-user-select: none;
              user-select: none;
              .ProgressCcontainerBar {
                background: var(--c-primary);
                border-radius: 2px;
                height: 100%;
                position: relative;
                transition: width .1s linear;
              } 
            }
          }
        }
      }
    }
  }
}
.InfoLabelIcon {
    color: #10b981;
}
</style>
```
::

::

## 更新日志

**V0.20260327.78999.68.90WER_PRE**
- 1.对`最近游戏`模块增加滚动功能，可以通过Shift + 空格或者滑动来查看
- 2.对`顶部标题`模块的右侧新增`tip显示`，可以通过写入`sub-tip`配置项来进行调用

**V0.20260323.14599.11.0_PRE**
- 1.优化后端API获取模块中对于链接请求重复过多的问题

**V0.20260322.7688.8.0_PRE**
- 1.优化`用户面板`、`信息面板`、`最近游戏`、`全部游戏`四个模块的移动端不同尺寸的适配
- 2.分离`最近游戏`、`全部游戏`两个模块的顶部信息栏，添加到`顶部标题`的模块中，并且进行特殊化配置项(即`defineProps`写法)
- 3.对`最近游戏`、`全部游戏`的成就显示与具体百分比显示，并且在`最近游戏`中新增价格显示(即`price`配置)

**V0.20260322.6788.7.0_PRE**
- 1.对`游戏面板`进行分离模块，新增`最近游戏`与`全游戏`的模块，并且优化两个逻辑

**V0.20260321.6358.2.0_PRE**
- 1.优化`用户面板`、`信息面板`、`游戏面板`三个模块的加载与逻辑运算，并且接入后端API获取模块(`V0.20260321.6358.1.0_PRE`更新内容第二项)
- 2.优化`用户面板`、`信息面板`、`游戏面板`三个模块的样式，并且重构`vue template`与`scss`的具体写法
- 3.修复在获取API的过程中出现的样式错乱
- 4.优化后端API获取模块中的数据

**V0.20260321.6358.1.0_PRE**
- 1.新增`用户面板`、`信息面板`、`游戏面板`模块的基础框架（用于测试数据是否正常）
- 2.新增后端API获取模块
