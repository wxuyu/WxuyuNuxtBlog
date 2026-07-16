<script setup lang="ts">
import type { CircleArticleData, CircleStatisticalData } from '~/types/circle'

/** 每页显示条数 */
const ITEMS_PER_PAGE = 10

useSeoMeta({
  title: '追更历史',
})

import RssFeedCard from '~/components/showcase/RssFeedCard.vue'

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

// 数据源：useCircle 返回 { data, status, error, refresh }
// data 类型为 CircleApiResponse，需取 .article_data
const { data, status, error, refresh } = useCircle()

// 安全解构出文章列表
const circleItems = computed<CircleArticleData[]>(
  () => data.value?.article_data ?? [],
)

// 安全解构出统计对象（API 返回单个对象，非数组）
const circleCount = computed<CircleStatisticalData>(
  () => data.value?.statistical_data ?? { friends_num: 0, active_num: 0, error_num: 0, article_num: 0, last_updated_time: '' },
)

// 从统计对象直接取值
const totalArticles = computed(() => circleCount.value.article_num)
const totalFriends = computed(() => circleCount.value.friends_num)

// 加载中
const isLoading = computed(
  () => status.value !== 'success' && !error.value,
)

// 客户端分页
const { page, listPaged, totalPages } = usePagination(circleItems, {
  perPage: ITEMS_PER_PAGE,
  bindQuery: 'page',
})
</script>

<template>
  <div class="circle-main">
    <div class="circle-header">
      <h6 class="circle-header-title">
        RSS动态聚合
      </h6>
      <div class="circle-header-info">
        <span>{{ totalArticles }} 篇文章</span>
        <span class="circle-header-info-divider">·</span>
        <span>{{ totalFriends }} 个友链</span>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="isLoading" class="circle-status">
      <Icon name="ph:spinner-gap-bold" class="circle-spin" />
      <span>加载中…</span>
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="circle-status circle-status--error">
      <Icon name="solar:siren-rounded-bold-duotone" />
      <span>数据获取失败，请稍后再试</span>
      <ZButton icon="ph:arrow-clockwise-bold" text="重试" @click="refresh()" />
    </div>

    <!-- 空数据 -->
    <div v-else-if="circleItems.length === 0" class="circle-status">
      <span>暂无聚合数据</span>
    </div>

    <!-- 列表 + 分页 -->
    <template v-else>
      <div class="circle-grid">
        <RssFeedCard
          v-for="item in listPaged"
          :key="item.floor"
          :data="item"
        />
      </div>

      <ZPagination
        v-if="totalPages > 1"
        v-model="page"
        :total-pages="totalPages"
      />
    </template>
  </div>
</template>

<style lang="scss" scoped>
@font-face {
    font-family: '快看世界体';
    src: local('快看世界体'),
         url('/fonts/caijian/RSS.ttf') format('truetype');
    font-weight: normal;
    font-style: normal;
    font-display: swap;
}
.circle-main {
  margin: 1rem;
  --thyuu--font-family-slogn: var(--custom-slogn, none), '快看世界体', var(--thyuu--font-family-normal);
  --thyuu--font-family-normal: var(--custom-fonts, none), 'Misans VF', 'Noto Sans SC', 'PingFang SC', sans-serif, thyuu-iconfont;
  --thyuu--color-font: 0deg 0% 25%;
  .circle-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    .circle-header-title {
      font-family: var(--thyuu--font-family-slogn);
      font-size: 2.5em;
      color: hsl(var(--thyuu--color-font) / .3);
      -webkit-text-fill-color: #0000;
      -webkit-text-stroke: thin;
      height: .8em;
      line-height: 1.1;
      overflow: hidden;
      &::selection {
        color: #000;
      }
    }
    .circle-header-info {
      display: flex;
      align-items: center;
      gap: .5em;
      font-size: .85rem;
      color: hsl(var(--thyuu--color-font) / .5);
      font-family: var(--thyuu--font-family-normal);
      white-space: nowrap;
      .circle-header-info-divider {
        opacity: .4;
      }
    }
  }
  .circle-grid {
    display: grid;
    gap: 1em;
    grid: auto / repeat(auto-fill, minmax(min(var(--thyuu--size-card-normal), 100%), 1fr));
    margin: 0;
  }
  .circle-status {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: .5em;
    padding: 2em 1em;
    color: hsl(var(--thyuu--color-font) / .6);
    font-family: var(--thyuu--font-family-normal);

    .circle-spin {
      animation: circle-spin 1s linear infinite;
    }

    &--error > :first-child {
      font-size: 1.5em;
    }
  }
}
@keyframes circle-spin {
  to { transform: rotate(360deg); }
}
</style>