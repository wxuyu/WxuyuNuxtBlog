<script setup lang="ts">
const props = defineProps<{
  miniNameType: 'bilibili' | 'weibo' | 'douyin' | 'zhihu' | '36kr' | 'baidu'
  nameType: '哔哩哔哩' | '微博' | '抖音' | '知乎' | '36氪' | '百度'
  categroryType: '热搜'
  hotTotal: number
  updateTime: string
}>()

// SSR 安全：服务端渲染时用 0，客户端 hydrate 后立刻修正，避免 hydration mismatch
const nowTimestamp = ref(0)
let timer: ReturnType<typeof setInterval> | null = null

onMounted(() => {
  nowTimestamp.value = Date.now()
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