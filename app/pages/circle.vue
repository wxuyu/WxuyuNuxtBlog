<script setup lang="ts">
import type { CircleArticleData, CircleStatisticalData } from '~/types/circle'

/** 每页显示条数 */
const ITEMS_PER_PAGE = 10

useSeoMeta({
  title: '塘文集锦',
})

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

// --- 数据层 ---
const linkType = ref<CircleType>('moments')
const { data, status, error, refresh } = useCircle(linkType)

const circleItems = computed<CircleArticleData[]>(
  () => data.value?.article_data ?? [],
)

const circleCount = computed<CircleStatisticalData>(
  () => data.value?.statistical_data ?? {
    friends_num: 0, active_num: 0, error_num: 0,
    article_num: 0, last_updated_time: '',
  },
)

const totalArticles = computed(() => circleCount.value.article_num)
const totalFriends = computed(() => circleCount.value.friends_num)

// --- 筛选器（feeds.ts 友链数据过滤 API 文章） ---
const {
  filteredArticles,
  matchedCount: filteredMatchedCount,
  filterGroups,
  selectedGroup,
  selectedFriendLink,
  selectedLabel,
  resetFilter,
  selectGroup,
  selectFriend,
} = useCircleFilter(circleItems)

// 筛选后的文章总数
const filteredTotal = computed(() => filteredArticles.value.length)

// --- 加载/错误/空状态 ---
const isReady = computed(() => status.value === 'success' && !error.value)
const isEmpty = computed(() => isReady.value && filteredArticles.value.length === 0)

// --- 分页（基于筛选后的文章） ---
const { page, totalPages } = usePagination(filteredArticles, {
  perPage: ITEMS_PER_PAGE,
  bindQuery: 'page',
})

const showPagination = computed(() => isReady.value && totalPages.value > 1)

// --- 共享时间源（避免每张卡片独立 useNow） ---
const sharedNow = useNow({ interval: 60_000 })

// --- Grid 均衡：跨页借调卡片，缩小同行摘要高度差 ---
function rebalanceGrid(items: CircleArticleData[]): CircleArticleData[] {
  if (items.length < 2) return items

  const result = [...items]

  // 只对偶数位配对同行的两张卡片（CSS Grid 2 列布局）
  for (let i = 0; i + 1 < result.length; i += 2) {
    const a = result[i]
    const b = result[i + 1]
    const lenA = a.summary?.length ?? 0
    const lenB = b.summary?.length ?? 0

    // 差值超过 50% 且短的一方为空洞，则从后续页找替换
    const ratio = Math.max(lenA, lenB) > 0
      ? Math.min(lenA, lenB) / Math.max(lenA, lenB)
      : 1

    if (ratio < 0.5) {
      const shortIdx = lenA < lenB ? i : i + 1
      const shortLen = Math.min(lenA, lenB)

      // 从第 3 张开始找摘要长度相近的替补
      for (let j = i + 2; j < result.length; j++) {
        const candidateLen = result[j].summary?.length ?? 0
        const diff = Math.abs(candidateLen - shortLen)
        const maxLen = Math.max(candidateLen, Math.max(lenA, lenB))
        const candidateRatio = maxLen > 0 ? diff / maxLen : 0

        if (candidateRatio < 0.4) {
          // 交换
          ;[result[shortIdx], result[j]] = [result[j], result[shortIdx]]
          break
        }
      }
    }
  }

  return result
}

const balancedItems = computed(() => rebalanceGrid(filteredArticles.value))
const balancedPaged = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE
  return balancedItems.value.slice(start, start + ITEMS_PER_PAGE)
})

// --- 骨架屏计数 ---
const skeletonCount = computed(() => Math.min(ITEMS_PER_PAGE, Math.max(4, totalArticles.value || 6)))

// 鼠标横向滚动 / Shift + 纵向滚轮事件
import emblaCarouselVue from 'embla-carousel-vue'
import { WheelGesturesPlugin } from 'embla-carousel-wheel-gestures'
import Autoplay from 'embla-carousel-autoplay'
// @keep-sorted
const [carouselEl, carouselApi] = emblaCarouselVue({
	containScroll: false,
	loop: true,
	skipSnaps: true,
}, [
	Autoplay({ stopOnInteraction: false, stopOnMouseEnter: true }),
	WheelGesturesPlugin(),
])

useEventListener(carouselEl, 'wheel', (e) => {
	const delta = e.deltaX + (e.shiftKey ? e.deltaY : 0)
	if (Math.abs(delta) < 80)
		return
	delta > 0 ? carouselApi.value?.scrollNext() : carouselApi.value?.scrollPrev()
}, { passive: true })
</script>

<template>
  <div class="circle-main">
    <!-- 顶部标题栏 -->
    <!-- <div class="circle-header">
      <h1 class="circle-header-title">RSS 动态聚合</h1>
      <div class="circle-header-info">
        <template v-if="isReady">
          <span>{{ totalArticles }} 篇文章</span>
          <span class="circle-header-divider">·</span>
          <span>{{ totalFriends }} 个友链</span>
        </template>
        <span v-else class="circle-header-muted">加载中…</span>
      </div>
    </div> -->
    <!-- 骨架屏 -->
    <div v-if="!isReady && !error" class="circle-grid circle-skeleton-grid">
      <div
        v-for="n in skeletonCount"
        :key="'skel-' + n"
        class="circle-skeleton"
        :style="{ animationDelay: `${n * 80}ms` }"
      />
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="circle-status circle-status--error">
      <Icon name="solar:siren-rounded-bold-duotone" class="circle-status-icon" />
      <span>数据获取失败，请稍后再试</span>
      <button class="circle-retry-btn" @click="refresh()">
        <Icon name="ph:arrow-clockwise-bold" />
        重试
      </button>
    </div>

    <!-- 空数据 -->
    <div v-else-if="isEmpty" class="circle-status circle-status--empty">
      <Icon name="ph:fish-light" class="circle-status-icon" />
      <span>暂无匹配文章</span>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="circle-grid-container">
      <!-- 筛选栏 -->
      <ShowcaseCircleFilterBar
        :groups="filterGroups"
        :selected-group="selectedGroup"
        :selected-friend-link="selectedFriendLink"
        :selected-label="selectedLabel"
        :total-count="totalArticles"
        :matched-count="filteredMatchedCount"
        @select-group="selectGroup"
        @select-friend="selectFriend"
        @reset="resetFilter"
      />

      <TransitionGroup name="circle-fade" tag="div" class="circle-grid">
        <ShowcaseRssFeedCard
          v-for="item in balancedPaged"
          :key="item.floor"
          :data="item"
          :now="sharedNow"
        />
      </TransitionGroup>
    </div>

    <!-- 分页（仅 ready + 多页时显示） -->
    <div v-if="showPagination" class="circle-pagination">
      <ZPagination
        v-model="page"
        :total-pages="totalPages"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ---- 字体 ---- */
@font-face {
    font-family: '快看世界体';
    src: local('快看世界体'),
         url('/fonts/caijian/RSS.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}

.circle-swiper {
  margin: 1rem;
  .circle-swiper-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 2rem;
    height: 3rem;
    margin-bottom: -0.2rem;
    mask-image: linear-gradient(#FFF, transparent);
    color: var(--c-text-3);

    >.title {
      font-size: 3rem;
      font-weight: bold;
      line-height: 1;
    }
  }
	.at-slide-hover {
		opacity: 0;
		transition: opacity 0.2s;
	}

	&:hover .at-slide-hover,
	&:focus-within .at-slide-hover {
		opacity: 1;
	}
  .circle-swiper-body {
    --fadeout-width: 1.5rem;

    position: relative;
    overflow: hidden;
    padding: 2px 0;
    mask-image: linear-gradient(to var(--end), transparent, #FFF var(--fadeout-width), #FFF calc(100% - var(--fadeout-width)), transparent);
    cursor: grab;
    user-select: none;

    .slide-list {
      display: flex;
      scroll-snap-type: x mandatory;
    }
  }
}

/* ---- 变量 ---- */
.circle-main {
  margin: 1rem;
  --circle-font-slogn: var(--custom-slogn, none), '快看世界体', var(--thyuu--font-family-normal);
  --circle-font-normal: var(--custom-fonts, none), 'Misans VF', 'Noto Sans SC', 'PingFang SC', sans-serif;
  --circle-color: hsl(var(--thyuu--color-font) / .5);

  /* ---- 顶部 ---- */
  .circle-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1em;

    &-title {
      font-family: var(--circle-font-slogn);
      font-size: 2.5em;
      color: hsl(var(--thyuu--color-font) / .3);
      -webkit-text-fill-color: transparent;
      -webkit-text-stroke: thin;
      height: .8em;
      line-height: 1.1;
      overflow: hidden;
      margin: 0;

      &::selection {
        color: #000;
      }
    }

    &-info {
      display: flex;
      align-items: center;
      gap: .5em;
      font-size: .85rem;
      color: var(--circle-color);
      font-family: var(--circle-font-normal);
      white-space: nowrap;
    }

    &-divider { opacity: .4; }
    &-muted { opacity: .4; }
  }

  /* ---- 网格 ---- */
  .circle-grid-container {
    position: relative;
  }

  .circle-grid {
    display: grid;
    gap: 1em;
    grid: auto / repeat(auto-fill, minmax(min(var(--thyuu--size-card-normal), 100%), 1fr));
    margin: 0;
  }

  /* ---- 骨架屏 ---- */
  .circle-skeleton-grid {
    .circle-skeleton {
      min-height: 140px;
      border-radius: .5rem;
      background: linear-gradient(
        110deg,
        var(--c-bg-3, hsl(0deg 0% 95%)) 30%,
        var(--c-divider, hsl(0deg 0% 85%)) 50%,
        var(--c-bg-3, hsl(0deg 0% 95%)) 70%
      );
      background-size: 200% 100%;
      animation: circle-shimmer 1.5s infinite ease-in-out;
    }
  }

  /* ---- 状态提示 ---- */
  .circle-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75em;
    padding: 4em 1em;
    color: var(--circle-color);
    font-family: var(--circle-font-normal);
    text-align: center;

    &-icon {
      font-size: 2.5em;
      opacity: .6;
    }

    &--error &-icon {
      color: hsl(0deg 70% 55%);
    }

    &--empty &-icon {
      font-size: 3.5em;
    }
  }

  .circle-retry-btn {
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

    &:hover {
      background: var(--c-bg-1, hsl(0deg 0% 90%));
    }
  }

  /* ---- 分页 ---- */
  .circle-pagination {
    margin-top: 1.5em;
  }
}

/* ---- 入场动画 ---- */
.circle-fade-enter-active {
  transition: opacity .4s ease, transform .4s ease;
}

.circle-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
  position: absolute; /* 防止离开时 jank */
}

.circle-fade-enter-from {
  opacity: 0;
  transform: translateY(12px);
}

.circle-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

/* ---- 骨架屏闪烁 ---- */
@keyframes circle-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 无障碍：减少动画 ---- */
@media (prefers-reduced-motion: reduce) {
  .circle-fade-enter-active,
  .circle-fade-leave-active {
    transition: none;
  }

  .circle-skeleton {
    animation: none !important;
  }
}
</style>
