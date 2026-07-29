<script setup lang="ts">
import type { ApiResponse, HotItem } from '~/types/hot'

const ITEMS_PER_PAGE = 20

useSeoMeta({ title: '热搜' })

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

const appConfig = useAppConfig()

// ── 卡片布局配置（默认 grid 竖向，可选 row 横向）──
const hotLayout = computed<'grid' | 'row'>(
  () => (appConfig.hotGetConfig as any)?.layout as 'grid' | 'row' ?? 'grid'
)

// ── 平台列表（tab 数据）──
const HOT_PLATFORMS = [
  { name: '哔哩哔哩', mini: 'bilibili' },
  { name: '微博',       mini: 'weibo' },
  { name: '抖音',       mini: 'douyin' },
  { name: '知乎',       mini: 'zhihu' },
  { name: '36氪',       mini: '36kr' },
  { name: '百度',       mini: 'baidu' },
] as const

const activeTab = ref(1)
const currentPlatform = computed(() => HOT_PLATFORMS[activeTab.value - 1])

const requestUrl = computed(() =>
  `${appConfig.hotGetConfig.Api}/${currentPlatform.value.mini}`
)

const {
  data: responseData,
  pending,
  error,
  refresh,
} = useFetch<ApiResponse>(requestUrl, {
  query: { cache: 'true' },
  key: computed(() => `hot-${currentPlatform.value.mini}`),
  default: () => ({ total: 0, updateTime: '', data: [] }),
  server: false,
  lazy: false,
})

const hotList = computed<HotItem[]>(() => {
  const list = responseData.value?.data
  return Array.isArray(list) ? list : []
})

const hotTotal = computed(() => {
  return typeof responseData.value?.total === 'number'
    ? responseData.value.total
    : hotList.value.length
})

const updateTime = computed(() => responseData.value?.updateTime ?? '')

// ── 状态 ──
const isReady = computed(() => !pending.value && !error.value)
const isEmpty = computed(() => isReady.value && hotList.value.length === 0)

// ── 分页 ──
const currentPage = ref(1)
const totalPages = computed(() =>
  Math.max(1, Math.ceil(hotList.value.length / ITEMS_PER_PAGE))
)
const pagedItems = computed(() => {
  const start = (currentPage.value - 1) * ITEMS_PER_PAGE
  return hotList.value.slice(start, start + ITEMS_PER_PAGE)
})
const showPagination = computed(() => isReady.value && totalPages.value > 1)

// 切换平台时重置页码
watch(activeTab, () => { currentPage.value = 1 })
watch(hotList, () => {
  if (currentPage.value > totalPages.value) currentPage.value = 1
})

// ── 骨架屏计数 ──
const skeletonCount = computed(() => Math.min(ITEMS_PER_PAGE, Math.max(6, hotTotal.value || 12)))

// ── 更新时间（相对） ──
const nowTimestamp = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  nowTimestamp.value = Date.now()
  timer = setInterval(() => { nowTimestamp.value = Date.now() }, 60_000)
})
onBeforeUnmount(() => { if (timer) clearInterval(timer) })

const relativeUpdateText = computed(() => {
  if (!updateTime.value) return '暂无更新时间'
  const updated = new Date(updateTime.value).getTime()
  if (Number.isNaN(updated)) return '暂无更新时间'
  const diff = nowTimestamp.value - updated
  if (diff <= 0) return '刚刚更新'
  const mins = Math.floor(diff / 1000 / 60)
  const days = Math.floor(mins / 1440)
  const hours = Math.floor((mins % 1440) / 60)
  if (days > 0) return `${days}天前更新`
  if (hours <= 0) return `${mins}分钟前更新`
  return `${hours}小时${mins % 60}分钟前更新`
})
</script>

<template>
  <div class="hot-main">

    <!-- tab 栏（circle 风格） -->
    <div class="hot-tabs">
      <div class="hot-tabs-list">
        <button
          v-for="(p, i) in HOT_PLATFORMS"
          :key="p.mini"
          :class="['hot-tab', { 'is-active': activeTab === i + 1 }]"
          @click="activeTab = i + 1"
        >
          <NuxtImg
            :src="`/image/PageImageAssets/hot/${p.mini}.avif`"
            :alt="p.name"
            width="20"
            height="20"
            class="hot-tab-icon"
          />
          <span>{{ p.name }}</span>
        </button>
      </div>
    </div>

    <!-- 骨架屏：跟随 layout 配置 -->
    <div
      v-if="!isReady && !error"
      :class="['hot-grid-container', { 'is-row': hotLayout === 'row' }]"
    >
      <div class="hot-grid hot-skeleton-grid">
        <div
          v-for="n in skeletonCount"
          :key="'skel-' + n"
          class="hot-skeleton"
          :style="{ animationDelay: `${n * 60}ms` }"
        />
      </div>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="hot-status hot-status--error">
      <Icon name="solar:siren-rounded-bold-duotone" class="hot-status-icon" />
      <span>数据获取失败，请稍后再试</span>
      <button class="hot-retry-btn" @click="refresh()">
        <Icon name="ph:arrow-clockwise-bold" />
        重试
      </button>
    </div>

    <!-- 空数据 -->
    <div v-else-if="isEmpty" class="hot-status hot-status--empty">
      <Icon name="ph:seal-question" class="hot-status-icon" />
      <span>暂无热搜数据</span>
    </div>

    <!-- 卡片区域 -->
    <div v-else :class="['hot-grid-container', { 'is-row': hotLayout === 'row' }]">
      <TransitionGroup name="hot-fade" tag="div" class="hot-grid">
        <ShowcaseHotCard
          v-for="(item, i) in pagedItems"
          :key="item.id || i"
          :item="item"
          :rank="(currentPage - 1) * ITEMS_PER_PAGE + i + 1"
          :platform="currentPlatform.name"
          :layout="hotLayout"
        />
      </TransitionGroup>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="hot-pagination">
      <ZPagination
        v-model="currentPage"
        :total-pages="totalPages"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ── 字体（复用 circle 字体） ── */
@font-face {
  font-family: '快看世界体';
  src: local('快看世界体'), url('/fonts/caijian/RSS.ttf') format('truetype');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}

.hot-main {
  margin: 1rem;
  --hot-font-slogn: var(--custom-slogn, none), '快看世界体', var(--thyuu--font-family-normal);
  --hot-color: hsl(var(--thyuu--color-font) / .5);

  /* ── 顶部标题 ── */
  .hot-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1em;

    &-title {
      font-family: var(--hot-font-slogn);
      font-size: 2.5em;
      color: hsl(var(--thyuu--color-font) / .3);
      -webkit-text-fill-color: transparent;
      -webkit-text-stroke: thin;
      height: .8em;
      line-height: 1.1;
      overflow: hidden;
      margin: 0;

      &::selection { color: #000; }
    }

    &-info {
      display: flex;
      align-items: center;
      gap: .5em;
      font-size: .85rem;
      color: var(--hot-color);
      font-family: var(--thyuu--font-family-normal);
      white-space: nowrap;
    }

    &-divider { opacity: .4; }
    &-muted { opacity: .4; }
  }

  /* ── tab 栏 ── */
  .hot-tabs {
    margin-bottom: 1em;
    overflow-x: auto;
    scrollbar-width: none;
    &::-webkit-scrollbar { display: none; }
  }

  .hot-tabs-list {
    display: inline-flex;
    gap: .4em;
    padding: .3em;
    border-radius: .6rem;
  }

  .hot-tab {
    display: inline-flex;
    align-items: center;
    gap: .35em;
    padding: .4em .85em;
    border: none;
    border-radius: .45rem;
    border: 1px solid var(--c-divider, hsl(0, 0%, 88%));
    border-radius: 0.4rem;
    background: var(--c-bg-2, hsl(0, 0%, 98%));
    color: var(--c-text-2);
    font-size: .82rem;
    font-weight: 500;
    cursor: pointer;
    white-space: nowrap;
    transition: all .18s ease;

    &:hover {
      border-color: hsl(var(--thyuu--main-color));
      color: hsl(var(--thyuu--main-color));
    }

    &.is-active {
      border-color: hsl(var(--thyuu--main-color));
      background: hsl(var(--thyuu--main-color) / 0.08);
      color: hsl(var(--thyuu--main-color));
      font-weight: 600;
      box-shadow: 0 1px 4px hsla(0, 0%, 0%, .08);
    }
  }

  .hot-tab-icon {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    object-fit: cover;
    flex: none;
  }

  /* ── 网格 / 横向列表 ── */
  .hot-grid-container {
    position: relative;

    &.is-row .hot-grid {
      display: flex;
      flex-direction: column;
      gap: .6em;
    }
  }

  .hot-grid {
    display: grid;
    gap: 1em;
    grid: auto / repeat(auto-fill, minmax(min(var(--thyuu--size-card-normal), 100%), 1fr));
    margin: 0;
  }

  /* ── 骨架屏 ── */
  .hot-skeleton-grid .hot-skeleton {
    min-height: 130px;
    border-radius: .5rem;
    background: linear-gradient(
      110deg,
      var(--c-bg-3, hsl(0deg 0% 95%)) 30%,
      var(--c-divider, hsl(0deg 0% 85%)) 50%,
      var(--c-bg-3, hsl(0deg 0% 95%)) 70%
    );
    background-size: 200% 100%;
    animation: hot-shimmer 1.5s infinite ease-in-out;
  }

  /* ── 状态提示 ── */
  .hot-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75em;
    padding: 4em 1em;
    color: var(--hot-color);
    font-family: var(--thyuu--font-family-normal);
    text-align: center;

    &-icon { font-size: 2.5em; opacity: .6; }
    &--error &-icon { color: hsl(0deg 70% 55%); }
    &--empty &-icon { font-size: 3.5em; }
  }

  .hot-retry-btn {
    display: inline-flex;
    align-items: center;
    gap: .4em;
    padding: .5em 1.2em;
    border: 1px solid var(--c-divider, hsl(0deg 0% 85%));
    border-radius: .4rem;
    background: var(--c-bg-2, hsl(0deg 0% 97%));
    color: inherit;
    font-size: .9rem;
    cursor: pointer;
    transition: background .2s;
    &:hover { background: var(--c-bg-1, hsl(0deg 0% 90%)); }
  }

  /* ── 分页 ── */
  .hot-pagination { margin-top: 1.5em; }
}

/* ── 入场动画 ── */
.hot-fade-enter-active { transition: opacity .4s ease, transform .4s ease; }
.hot-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
  position: absolute;
}
.hot-fade-enter-from { opacity: 0; transform: translateY(12px); }
.hot-fade-leave-to   { opacity: 0; transform: translateY(-8px); }

/* ── 骨架屏闪烁 ── */
@keyframes hot-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .hot-fade-enter-active,
  .hot-fade-leave-active { transition: none; }
  .hot-skeleton { animation: none !important; }
}
</style>
