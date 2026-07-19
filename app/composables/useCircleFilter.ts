/**
 * useCircleFilter — 使用 feeds.ts 中的友链数据筛选 API 返回的文章
 *
 * 匹配逻辑（双通道）：
 *   粗筛：article.link 包含 feedEntry.link（博客域名匹配）
 *   细筛：article.author 等于 feedEntry.title 或 feedEntry.author
 *
 * 返回：filteredArticles / filterGroups / selectedGroup / selectedFriend / matchedCount
 */
import type { FeedEntry, FeedGroup } from '~/types/feed'
import type { CircleArticleData } from '~/types/circle'
import feeds from '~/feeds'

/** 扁平的 FeedEntry + 所属分组名 */
export interface FlatFeedEntry {
  entry: FeedEntry
  groupName: string
}

/** 筛选器展示用的分组（含下属好友及各自的文章数） */
export interface CircleFilterGroup {
  name: string
  desc?: string
  /** 该分组匹配到的文章数 */
  articleCount: number
  /** 该分组下的好友列表 */
  friends: CircleFilterFriend[]
}

export interface CircleFilterFriend {
  author: string
  title: string
  link: string
  avatar: string
  /** 该好友匹配到的文章数 */
  articleCount: number
}

/** 将 feeds.ts 的分组树拍平为 (FeedEntry + groupName)[] */
function flattenFeeds(groups: FeedGroup[]): FlatFeedEntry[] {
  const result: FlatFeedEntry[] = []
  for (const group of groups) {
    for (const item of group.entries) {
      // FeedGroupEntry = FeedEntry | FeedGroup，这里只处理 FeedEntry
      if ('link' in item && 'author' in item) {
        result.push({ entry: item as FeedEntry, groupName: group.name })
      }
    }
  }
  return result
}

/** 预计算所有 feedEntry 的扁平列表（静态数据，只算一次） */
let _flatEntries: FlatFeedEntry[] | null = null
function getFlatEntries(): FlatFeedEntry[] {
  if (!_flatEntries) {
    _flatEntries = flattenFeeds(feeds as FeedGroup[])
  }
  return _flatEntries
}

/**
 * 判断一篇文章是否属于某个 FeedEntry
 * 粗筛：article.link 包含 entry.link（去掉协议和尾部斜杠后模糊匹配域名）
 * 细筛：article.author 匹配 entry.title / entry.author
 */
function matchArticleToFeed(
  article: CircleArticleData,
  flat: FlatFeedEntry,
): boolean {
  const { entry } = flat

  // 粗筛：link 包含关系
  if (entry.link && article.link) {
    // 归一化后比较：去协议、去尾部斜杠
    const normalize = (url: string) =>
      url.replace(/^https?:\/\//, '').replace(/\/+$/, '').toLowerCase()
    const articleHost = normalize(article.link)
    const entryHost = normalize(entry.link)

    if (articleHost.includes(entryHost) || entryHost.includes(articleHost)) {
      return true
    }
  }

  // 细筛：author 字段匹配
  const articleAuthor = article.author?.trim() ?? ''
  if (!articleAuthor) return false

  // 匹配 title（站点名称）
  if (entry.title && articleAuthor === entry.title.trim()) return true

  // 匹配 author（博主名）
  if (entry.author && articleAuthor === entry.author.trim()) return true

  return false
}

/** 构建 article → FlatFeedEntry 的匹配映射 */
function buildArticleFeedMap(
  articles: CircleArticleData[],
): Map<CircleArticleData, FlatFeedEntry> {
  const flatEntries = getFlatEntries()
  const map = new Map<CircleArticleData, FlatFeedEntry>()

  for (const article of articles) {
    for (const flat of flatEntries) {
      if (matchArticleToFeed(article, flat)) {
        map.set(article, flat)
        break // 一条文章只归属第一个匹配的 FeedEntry
      }
    }
  }

  return map
}

export default function useCircleFilter(articles: Ref<CircleArticleData[]>) {
  /** 当前选中的分组名（null = 全部） */
  const selectedGroup = ref<string | null>(null)
  /** 当前选中的好友 link（null = 全组） */
  const selectedFriendLink = ref<string | null>(null)

  /** 文章 → FeedEntry 映射 */
  const articleFeedMap = computed(() => buildArticleFeedMap(articles.value))

  /** 已匹配的文章数 */
  const matchedCount = computed(() => articleFeedMap.value.size)

  /** 未匹配的文章（不属于任何已知友链） */
  const unmatchedArticles = computed(() =>
    articles.value.filter((a) => !articleFeedMap.value.has(a)),
  )

  /** 筛选后的文章列表 */
  const filteredArticles = computed<CircleArticleData[]>(() => {
    // 全选
    if (!selectedGroup.value && !selectedFriendLink.value) {
      return articles.value
    }

    return articles.value.filter((article) => {
      const matched = articleFeedMap.value.get(article)
      if (!matched) {
        // 未匹配的文章在全选时才显示，选了分组后不显示
        return false
      }

      // 选了具体好友
      if (selectedFriendLink.value) {
        return matched.entry.link === selectedFriendLink.value
      }

      // 选了分组
      if (selectedGroup.value) {
        return matched.groupName === selectedGroup.value
      }

      return true
    })
  })

  /** 筛选器展示用的分组数据（含各好友文章数） */
  const filterGroups = computed<CircleFilterGroup[]>(() => {
    const feedsData = feeds as FeedGroup[]
    const map = articleFeedMap.value

    return feedsData.map((group) => {
      const friends: CircleFilterFriend[] = []

      for (const item of group.entries) {
        if (!('link' in item && 'author' in item)) continue
        const entry = item as FeedEntry

        // 统计该好友的文章数
        let count = 0
        for (const [, flat] of map) {
          if (flat.entry.link === entry.link) count++
        }

        friends.push({
          author: entry.author,
          title: entry.title || entry.sitenick || entry.author,
          link: entry.link,
          avatar: entry.avatar,
          articleCount: count,
        })
      }

      // 分组文章总数
      const groupCount = friends.reduce((sum, f) => sum + f.articleCount, 0)

      return {
        name: group.name,
        desc: group.desc,
        articleCount: groupCount,
        friends,
      }
    })
  })

  /** 选中的项目名称 */
  const selectedLabel = computed(() => {
    if (selectedFriendLink.value) {
      for (const g of filterGroups.value) {
        const f = g.friends.find((f) => f.link === selectedFriendLink.value)
        if (f) return f.title
      }
    }
    if (selectedGroup.value) return selectedGroup.value
    return '全部'
  })

  /** 重置筛选 */
  function resetFilter() {
    selectedGroup.value = null
    selectedFriendLink.value = null
  }

  /** 选择分组 */
  function selectGroup(name: string | null) {
    selectedGroup.value = name
    selectedFriendLink.value = null
  }

  /** 选择好友 */
  function selectFriend(link: string | null) {
    selectedFriendLink.value = link
    // 同时设置所属分组用于高亮
    if (link) {
      for (const g of filterGroups.value) {
        if (g.friends.some((f) => f.link === link)) {
          selectedGroup.value = g.name
          break
        }
      }
    }
  }

  return {
    filteredArticles,
    matchedCount,
    unmatchedArticles,
    filterGroups,
    selectedGroup,
    selectedFriendLink,
    selectedLabel,
    resetFilter,
    selectGroup,
    selectFriend,
  }
}
