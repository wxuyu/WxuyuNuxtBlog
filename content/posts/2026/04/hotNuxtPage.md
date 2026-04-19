---
title: 热搜页面（Nuxt版本）
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-04-13 14:00:00
updated: 2026-04-13 22:00:00
image: /image/PostCover/footerNuxtMeihua.avif
categories: [站点魔改]
tags: ['Nuxt', '页面']
recommend: true
---
## 前言
最近这段时间，我一直寻找一个新的功能而不需云服务器来进行托管的，而在[柳神](https://blog.liushen.fun)的博客中翻看时有这么一篇[文章](https://blog.liushen.fun/posts/891edc78/)。里面正好有一类没尝试过的东西，并且还是用json数据类型的，在查看仓库并且通过`codex`来为Nuxt适配，也就有这样一篇文章。

## 核心代码列表
- `/app/components/yjluo/hot/hotPageMain.vue`：主体框架，将其他的`vue`模块进行链接减少整体难维护
- `/app/components/yjluo/hot/hotPageHeader.vue`：卡片顶部栏，作为展示热搜来源、热搜类型、热搜总数、热搜更新时间四类数据
- `/app/components/yjluo/hot/hotPageLoading.vue`：整体加载文件，在切换的时候加载
- `/app/components/yjluo/hot/hotPagePagination.vue`：底部导航条，作为无损切换不同页面展示且无需重新加载
- `/app/components/yjluo/hot/hotCardList.vue`：卡片列表，作为链接`hotCardShow.vue`的工具
- `/app/components/yjluo/hot/hotCardShow.vue`：展示出热搜

## 核心代码
### 主页面&主模块
::tab{:tabs='["主页面", "主模块"]'}
#tab1
``` vue [hot.vue] lang="vue"
<script setup lang="ts">
import HotPageCardItem from '~/components/yjluo/hot/hotPageMain.vue';

const hotTab = ['哔哩哔哩', '微博', '抖音', '知乎', '36氪', '百度']
const layoutStore = useLayoutStore()
// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div class="HotPageMain">
    <tab :tabs="hotTab">
      <template v-slot:tab1>
        <HotPageCardItem -cache='true' -name-type='哔哩哔哩' -mini-name-type='bilibili' -categrory-type='热搜' />
      </template>
      <template v-slot:tab2>
        <HotPageCardItem -cache='true' -name-type='微博' -mini-name-type='weibo' -categrory-type='热搜' />
      </template>
      <template v-slot:tab3>
        <HotPageCardItem -cache='true' -name-type='抖音' -mini-name-type='douyin' -categrory-type='热搜' />
      </template>
      <template v-slot:tab4>
        <HotPageCardItem -cache='true' -name-type='知乎' -mini-name-type='zhihu' -categrory-type='热搜' />
      </template>
      <template v-slot:tab5>
        <HotPageCardItem -cache='true' -name-type='36氪' -mini-name-type='36kr' -categrory-type='热搜' />
      </template>
      <template v-slot:tab6>
        <HotPageCardItem -cache='true' -name-type='百度' -mini-name-type='baidu' -categrory-type='热搜' />
      </template>
    </tab>    
  </div>
</template>

<style lang="scss" scoped>
.HotPageMain {
  padding: 1rem;
}
</style>
```

#tab2
``` vue [hotPageMain.vue] lang="vue"
<script setup lang="ts">
import type { ApiResponse } from '~/types/hot'
import HotPageHeader from './header/hotPageHeader.vue';
import HotPageLoading from './body/hotPageLoading.vue';
import HotCardList from './body/hotCardList.vue';
import HotPagePagination from './body/hotPagePagination.vue';

const appConfig = useAppConfig()

const props = defineProps<{
  Cache: 'true' | 'false'
  NameType: '哔哩哔哩' | '微博' | '抖音' | '知乎' | '36氪' | '百度'
  MiniNameType: 'bilibili' | 'weibo' | 'douyin' | 'zhihu' | '36kr' | 'baidu'
  CategroryType: '热搜'
}>()

const requestHeaders = {}

const requestUrl = computed(() =>
  `${appConfig.hotGetConfig.Api}/${props.MiniNameType}`
)

const fetchKey = computed(() => `hot-${props.MiniNameType}-${props.Cache}`)

const {
  data: responseData,
  pending,
  error,
  refresh,
} = useFetch<ApiResponse>(requestUrl, {
  query: { cache: props.Cache },
  headers: requestHeaders,
  key: fetchKey,
  default: () => ({ total: 0, updateTime: '', data: [] }),
  server: false,
  lazy: false,
  watch: [requestUrl, () => props.Cache],
})

const hotList = computed(() => {
  const list = responseData.value?.data
  return Array.isArray(list) ? list : []
})

const hotTotal = computed(() => {
  return typeof responseData.value?.total === 'number'
    ? responseData.value.total
    : hotList.value.length
})

const updateTime = computed(() => responseData.value?.updateTime ?? '')

// 分页状态
const currentPage = ref(1)
const itemsPerPage = ref(20)

const totalPages = computed(() =>
  Math.max(1, Math.ceil(hotList.value.length / itemsPerPage.value))
)

const paginatedList = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage.value
  const end = start + itemsPerPage.value
  return hotList.value.slice(start, end)
})

function goToPage(page: number) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

function nextPage() {
  if (currentPage.value < totalPages.value) {
    currentPage.value++
  }
}

function prevPage() {
  if (currentPage.value > 1) {
    currentPage.value--
  }
}

// 当平台或缓存参数变化时，重置页码
watch(
  () => [props.MiniNameType, props.Cache],
  () => {
    currentPage.value = 1
  }
)

// 当数据变化时，修正页码
watch(hotList, () => {
  if (currentPage.value > totalPages.value) {
    currentPage.value = totalPages.value || 1
  }
})

// 状态消息
const statusMessage = computed(() => {
  if (pending.value) return '加载中...'
  if (error.value) {
    return error.value instanceof Error
      ? error.value.message
      : '加载失败'
  }
  if (!hotList.value.length) return '暂无数据'
  return ''
})
</script>

<template>
  <div class="cardMain">
    <HotPageHeader
      :mini-name-type="MiniNameType"
      :name-type="NameType"
      :categrory-type="CategroryType"
      :hot-total="hotTotal"
      :update-time="updateTime"
    />

    <div class="cardBody">
      <HotPageLoading
        v-if="pending || error || !hotList.length"
        :pending="pending"
        :error="error"
        :is-empty="!pending && !error && !hotList.length"
        :message="statusMessage"
        @retry="refresh"
      />

      <div v-else class="contentArea">
        <HotCardList
          :items="paginatedList"
          :current-page="currentPage"
          :items-per-page="itemsPerPage"
        />

        <HotPagePagination
          v-if="totalPages > 1"
          :current-page="currentPage"
          :total-pages="totalPages"
          @go="goToPage"
          @prev="prevPage"
          @next="nextPage"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$border-light: #eee;
$shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.05);
$bg-white: #fff;
$spacing-lg: 16px;
$radius-xl: 12px;

.cardMain {
  border: 1px solid $border-light;
  border-radius: $radius-xl;
  padding: $spacing-lg;
  background: $bg-white;
  box-shadow: $shadow-sm;
}

.cardBody {
  min-height: 120px;

  .contentArea {
    display: flex;
    flex-direction: column;
  }
}
</style>
```
::

### 分模块
::tab{:tabs='["hotPageHeader.vue", "hotPageLoading.vue", "hotPagePagination.vue", "hotCardList.vue", "hotCardShow.vue"]'}
#tab1
``` vue lang="vue"
<script setup lang="ts">
const props = defineProps<{
  miniNameType: 'bilibili' | 'weibo' | 'douyin' | 'zhihu' | '36kr' | 'baidu'
  nameType: '哔哩哔哩' | '微博' | '抖音' | '知乎' | '36氪' | '百度'
  categroryType: '热搜'
  hotTotal: number
  updateTime: string
}>()

const nowTimestamp = ref(Date.now())
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  timer = setInterval(() => {
    nowTimestamp.value = Date.now()
  }, 60 * 1000)
})

onBeforeUnmount(() => {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
})

const relativeUpdateText = computed(() => {
  if (!props.updateTime) return '暂无更新时间'

  const updated = new Date(props.updateTime).getTime()
  if (Number.isNaN(updated)) return '暂无更新时间'

  const diff = nowTimestamp.value - updated
  if (diff <= 0) return '刚刚更新'

  const totalMinutes = Math.floor(diff / 1000 / 60)
  const days = Math.floor(totalMinutes / (60 * 24))
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60)
  const minutes = totalMinutes % 60

  if (days > 0) return `${days}天前更新`
  if (hours === 0 && minutes === 0) return '刚刚更新'
  if (hours <= 0 && minutes > 0) return `${minutes}分钟前更新`
  if (hours > 0 && minutes === 0) return `${hours}小时前更新}`

  return `${hours}小时${minutes}分钟前更新`
})
</script>

<template>
  <div class="cardMainHeader">
    <div class="mainHeaderIcon">
      <NuxtImg
        :src="`/image/PageImageAssets/hot/${miniNameType}.avif`"
        :alt="nameType"
        width="32"
        height="32"
      />
    </div>

    <div class="mainHeaderName">
      <span>{{ nameType }}</span>
      <small class="category">{{ categroryType }}</small>
    </div>

    <div class="mainHeaderData">
      <div class="headerData">
        共 {{ hotTotal }} 条 · {{ relativeUpdateText }}
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
$text-tertiary: #999;
$border-lighter: #f5f5f5;
$spacing-md: 12px;
$spacing-lg: 16px;

.cardMainHeader {
  display: flex;
  align-items: center;
  gap: $spacing-md;
  margin-bottom: $spacing-lg;
  padding-bottom: $spacing-md;
  border-bottom: 1px solid $border-lighter;

  .mainHeaderName {
    flex: 1;
    display: flex;
    flex-direction: column;

    .category {
      color: $text-tertiary;
      font-size: 12px;
    }
  }

  .mainHeaderData {
    display: flex;
    align-items: flex-end;
    font-size: 12px;

    .headerData {
      font-weight: bold;
      position: relative;
    }
  }
}
</style>
```

#tab2
``` vue lang="vue"
<script setup lang="ts">
defineProps<{
  pending: boolean
  error: unknown
  isEmpty: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div
    class="status"
    :class="{
      loading: pending,
      error: !!error,
      empty: isEmpty
    }"
  >
    <span>{{ message }}</span>
    <button
      v-if="error"
      class="retryBtn"
      @click="emit('retry')"
    >
      重试
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #409eff;
$text-secondary: #666;
$bg-white: #fff;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-xl: 20px;
$radius-md: 6px;

.status {
  text-align: center;
  color: $text-secondary;
  padding: $spacing-xl 0;

  &.error {
    color: #e74c3c;
  }

  .retryBtn {
    display: inline-block;
    margin-top: $spacing-sm;
    margin-left: $spacing-md;
    padding: 4px $spacing-md;
    border: none;
    border-radius: $radius-md;
    background: $primary-color;
    color: $bg-white;
    cursor: pointer;
  }
}
</style>
```

#tab3
``` vue lang="vue"
<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'go', page: number): void
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<template>
  <div class="pagination">
    <button
      class="pageBtn"
      :disabled="currentPage === 1"
      @click="emit('prev')"
    >
      上一页
    </button>

    <div class="pageNumbers">
      <button
        v-for="page in totalPages"
        :key="page"
        class="pageNumber"
        :class="{ active: page === currentPage }"
        @click="emit('go', page)"
      >
        {{ page }}
      </button>
    </div>

    <button
      class="pageBtn"
      :disabled="currentPage === totalPages"
      @click="emit('next')"
    >
      下一页
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #409eff;
$border-light: #eee;
$border-lighter: #f5f5f5;
$bg-white: #fff;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$radius-sm: 4px;

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-lighter;

  .pageBtn {
    padding: $spacing-xs $spacing-md;
    border: 1px solid $border-light;
    border-radius: $radius-sm;
    background: $bg-white;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:not(:disabled):hover {
      background: $border-lighter;
    }
  }

  .pageNumbers {
    display: flex;
    gap: $spacing-xs;

    .pageNumber {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid $border-light;
      border-radius: $radius-sm;
      background: $bg-white;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: $border-lighter;
      }

      &.active {
        background: $primary-color;
        color: $bg-white;
        border-color: $primary-color;
      }
    }
  }
}
</style>
```

#tab4
``` vue lang="vue"
<script setup lang="ts">
import type { HotItem } from '~/types/hot'
import HotCardShow from './hotCardShow.vue';

defineProps<{
  items: HotItem[]
  currentPage: number
  itemsPerPage: number
}>()
</script>

<template>
  <div class="hotList">
    <HotCardShow
      v-for="(item, index) in items"
      :key="item.id || index"
      :item="item"
      :rank="(currentPage - 1) * itemsPerPage + index + 1"
    />
  </div>
</template>

<style lang="scss" scoped>
$spacing-md: 12px;

.hotList {
  display: flex;
  flex-direction: column;
  gap: $spacing-md;
}
</style>
```

#tab5
``` vue lang="vue"
<script setup lang="ts">
import type { HotItem } from '~/types/hot'

const props = defineProps<{
  item: HotItem
  rank: number
}>()

const itemLink = computed(() => {
  const url = props.item.url || props.item.mobileUrl || ''
  return typeof url === 'string' ? url.trim() : ''
})

const hasValidLink = computed(() => !!itemLink.value)

const rankClass = computed(() => ({
  top1: props.rank === 1,
  top2: props.rank === 2,
  top3: props.rank === 3,
}))

const descText = computed(() => {
  return props.item.desc?.trim() || '暂无描述'
})

const authorText = computed(() => {
  return props.item.author?.trim() || ''
})

const hotText = computed(() => {
  return props.item.hot ? String(props.item.hot) : ''
})
</script>

<template>
  <div class="hotItem">
    <component
      :is="hasValidLink ? 'a' : 'div'"
      class="hotItemLink"
      :href="hasValidLink ? itemLink : undefined"
      :target="hasValidLink ? '_blank' : undefined"
      :rel="hasValidLink ? 'noopener noreferrer' : undefined"
    >
      <div class="rank" :class="rankClass">
        {{ rank }}
      </div>

      <div class="content">
        <div class="title">{{ item.title }}</div>
        <div class="desc">{{ descText }}</div>

        <div v-if="authorText || hotText" class="meta">
          <span v-if="authorText">作者：{{ authorText }}</span>
          <span v-if="hotText">热度：{{ hotText }}</span>
        </div>
      </div>
    </component>
  </div>
</template>

<style lang="scss" scoped>
$text-primary: #222;
$text-secondary: #666;
$text-tertiary: #999;
$border-lightest: #f2f2f2;
$border-lighter: #f5f5f5;
$spacing-xs: 4px;
$spacing-md: 12px;
$radius-md: 6px;

.hotItem {
  border-bottom: 1px solid $border-lightest;
  padding-bottom: $spacing-md;

  &:last-child {
    border-bottom: none;
  }

  .hotItemLink {
    display: flex;
    gap: $spacing-md;
    text-decoration: none;
    color: inherit;

    .rank {
      width: 24px;
      height: 24px;
      min-width: 24px;
      font-size: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: $border-lighter;
      border-radius: $radius-md;
      transition: all 0.3s;
      color: #333;

      &.top1 {
        background-color: #ea444d;
        color: #fff;
      }

      &.top2 {
        background-color: #ed702d;
        color: #fff;
      }

      &.top3 {
        background-color: #eead3f;
        color: #fff;
      }
    }

    .content {
      flex: 1;
      min-width: 0;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
        word-break: break-word;
      }

      .desc {
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
        word-break: break-word;
      }

      .meta {
        display: flex;
        flex-wrap: wrap;
        gap: $spacing-md;
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }
}
</style>
```
::