<!--
  MemosTimeline.vue — Memos 说说/碎碎念时间轴主组件

  特性：
  - SSR 友好（首次渲染显示骨架屏，mount 后请求数据）
  - 标签过滤
  - 加载更多（瀑布流）
  - 图片灯箱
  - 配置双轨：runtimeConfig 默认值 + props 覆盖
  - 布局切换：单列 / 瀑布流（由父组件传入 layout prop）
-->
<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useAppConfig, useRuntimeConfig } from '#imports'
import MemosItem from './MemosItem.vue'
import MemosLightbox from './MemosLightbox.vue'
import { MemosClient } from '~/composables/useMemosApi'
import { useLightbox } from '~/composables/useLightbox'
import type { MemosMemo, MemosTimelineProps } from '~/types/memos'

const props = withDefaults(defineProps<MemosTimelineProps>(), {
  limit: 10,
  layout: 'list',
})

// 三层配置合并：props > appConfig.memos > runtimeConfig.public.memosDefault > 内置默认值
const appCfg = useAppConfig() as { memos?: Partial<MemosTimelineProps> }
const runtime = useRuntimeConfig() as { public?: { memosDefault?: Partial<MemosTimelineProps> } }

const config = computed<MemosTimelineProps>(() => {
  const rtDefault = runtime.public?.memosDefault ?? {}
  const appDefault = appCfg.memos ?? {}
  return {
    memos: props.memos ?? appDefault.memos ?? rtDefault.memos ?? 'https://s.dusays.com',
    username: props.username ?? appDefault.username ?? rtDefault.username ?? 'MineXine',
    limit: props.limit ?? appDefault.limit ?? rtDefault.limit ?? 10,
    tagFilter: props.tagFilter ?? appDefault.tagFilter ?? '',
    layout: props.layout ?? appDefault.layout ?? 'list',
  }
})

/** 状态 */
const memos = ref<MemosMemo[]>([])
const loading = ref(false)
const loadingMore = ref(false)
const hasMore = ref(true)
const errorMsg = ref('')
const pageToken = ref<string | undefined>(undefined)
const currentPage = ref(1)
/** 客户端 mount 标记（SSR + 首次 hydration 期间为 false，避免骨架屏闪现为空） */
const isMounted = ref(false)

let client: MemosClient | null = null

/** 灯箱 */
const lightbox = useLightbox()

/** 加载第一页 */
async function loadFirst() {
  loading.value = true
  errorMsg.value = ''
  memos.value = []
  pageToken.value = undefined
  currentPage.value = 1
  hasMore.value = true

  try {
    if (!config.value.memos) {
      throw new Error('Memos 实例地址未配置（请通过 props.memos 或 app.config.memos.memos 设置）')
    }
    client = new MemosClient(config.value.memos, String(config.value.username))
    const { memos: list, hasMore: more, nextPageToken } = await client.list({
      pageToken: undefined,
      pageSize: config.value.limit,
      tag: config.value.tagFilter,
      state: 'NORMAL',
    })
    memos.value = list
    pageToken.value = nextPageToken
    hasMore.value = more
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载失败'
  } finally {
    loading.value = false
  }
}

/** 加载更多 */
async function loadMore() {
  if (loadingMore.value || !hasMore.value || !client) return
  loadingMore.value = true
  currentPage.value += 1
  try {
    const { memos: list, hasMore: more, nextPageToken } = await client.list({
      pageToken: pageToken.value,
      page: currentPage.value,
      pageSize: config.value.limit,
      tag: config.value.tagFilter,
      state: 'NORMAL',
    })
    memos.value.push(...list)
    pageToken.value = nextPageToken
    hasMore.value = more
  } catch (err) {
    errorMsg.value = err instanceof Error ? err.message : '加载更多失败'
  } finally {
    loadingMore.value = false
  }
}

/** 标签点击 */
function onTagClick(tag: string) {
  // 滚动到顶部 + 重新加载
  if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' })
  loadFirst()
}

/** 图片点击 → 打开灯箱 */
function onLightbox(payload: { images: string[], index: number }) {
  if (payload.images.length > 0) {
    lightbox.open(payload.images, payload.index)
  }
}

// 监听 tagFilter 变化重新加载
watch(() => config.value.tagFilter, () => {
  loadFirst()
})

onMounted(() => {
  isMounted.value = true
  loadFirst()
})
</script>

<template>
  <div class="memos-timeline">
    <!-- 加载中骨架屏（SSR 也显示，避免裸空容器） -->
    <div
      v-if="loading || (isMounted ? false : !memos.length && !errorMsg)"
      class="memos-skeleton"
      :class="`layout-${config.layout}`"
    >
      <div v-for="i in 3" :key="i" class="skeleton-card">
        <div class="skeleton-line" style="width: 80%" />
        <div class="skeleton-line" style="width: 60%" />
        <div class="skeleton-line skeleton-short" style="width: 30%" />
      </div>
    </div>

    <!-- 错误 -->
    <div v-else-if="errorMsg && !memos.length" class="memos-error">
      <p>{{ errorMsg }}</p>
      <button class="retry-btn" type="button" @click="loadFirst">
        重试
      </button>
    </div>

    <!-- 列表 -->
    <div v-else-if="memos.length" class="memos-list" @memos-lightbox="(e: any) => onLightbox(e.detail)">
      <MemosItem
        v-for="memo in memos"
        :key="memo.id"
        :memo="memo"
        :memos-url="config.memos"
        :layout="config.layout"
        @tagclick="onTagClick"
      />

      <!-- 加载更多按钮 -->
      <div v-if="hasMore" class="memos-loadmore">
        <button class="loadmore-btn" :class="{ loading: loadingMore }" type="button" :disabled="loadingMore" @click="loadMore">
          {{ loadingMore ? '加载中...' : '加载更多' }}
        </button>
      </div>

      <div v-else class="memos-end">
        — 已经到底啦 —
      </div>
    </div>

    <!-- 灯箱 -->
    <MemosLightbox
      :open="lightbox.state.value.open"
      :images="lightbox.state.value.images"
      :index="lightbox.state.value.index"
      @close="lightbox.close"
      @switch="lightbox.switchTo"
    />
  </div>
</template>

<style scoped lang="scss">
.memos-timeline {
  margin-top: 1rem;
  width: 100%;
  min-height: 100vh;
  box-sizing: border-box;
}

// 骨架屏
.memos-skeleton {
  padding: 1rem 0;

  // 单列布局
  &.layout-list {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  // 瀑布流布局：与实际列表一致，Grid 两列
  &.layout-masonry {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}

.skeleton-card {
  background: var(--memos-card-bg, #ffffff);
  border: 1px solid var(--memos-card-border, #f0f0f0);
  border-radius: 12px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.skeleton-line {
  height: 0.875rem;
  background: linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  border-radius: 4px;
  animation: skeleton-shimmer 1.4s ease-in-out infinite;

  &.skeleton-short {
    width: 30%;
  }
}

@keyframes skeleton-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

// 错误
.memos-error {
  text-align: center;
  padding: 3rem 1rem;
  color: var(--memos-text-muted, #666);

  .retry-btn {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    border: 1px solid var(--memos-border, #e0e0e0);
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      border-color: #1976d2;
      color: #1976d2;
    }
  }
}

// 列表
.memos-list {
  display: flex;
  flex-direction: column;
  gap: 15px;

  // 瀑布流布局：CSS Grid 两列（column-count 在卡片少时不会分列）
  // &.layout-masonry {
  //   display: grid;
  //   grid-template-columns: repeat(2, 1fr);
  //   gap: 1rem;

  //   // 加载更多 / 到底提示跨两列
  //   .memos-loadmore,
  //   .memos-end {
  //     grid-column: 1 / -1;
  //   }
  // }
}

// 加载更多
.memos-loadmore {
  position: relative;
  width: 100%;
  margin: 2rem 0;
  z-index: 10;
}

.loadmore-btn {
  width: 100%;
  padding: 0.5rem 0;
  background: transparent;
  color: var(--memos-text-muted, #666);
  border: 2px dashed var(--memos-border, #e0e0e0);
  border-radius: 12px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.3s ease;
  letter-spacing: 0.5px;

  &:hover:not(:disabled) {
    border-color: #667eea;
    color: #667eea;
    background: rgba(102, 126, 234, 0.05);
    transform: translateY(-1px);
  }

  &:disabled {
    color: #ccc;
    border-color: #f0f0f0;
    cursor: not-allowed;
  }

  &.loading {
    pointer-events: none;
    border-style: solid;
    border-color: #667eea;
    background: rgba(102, 126, 234, 0.05);
    color: #667eea;
  }
}

.memos-end {
  text-align: center;
  padding: 2rem 0;
  color: var(--memos-text-muted, #999);
  font-size: 0.875rem;
}

// 移动端
@media (max-width: 768px) {
  .memos-timeline {
    margin-top: 0.5rem;
    padding: 0 10px;
  }

  .skeleton-card {
    padding: 0.8rem;
  }

  .memos-list.layout-masonry,
  .memos-skeleton.layout-masonry {
    grid-template-columns: 1fr;
  }
}
</style>
