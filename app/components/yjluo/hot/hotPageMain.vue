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