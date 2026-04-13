<script setup lang="ts">
const props = defineProps<{
  miniNameType: 'bilibili' | 'weibo' | 'douyin' | 'zhihu' | '36kr' | 'baidu'
  nameType: '哔哩哔哩' | '微博' | '抖音' | '知乎' | '36氪' | '百度'
  categroryType: '热搜'
  hotTotal: number
  updateTime: string
}>()

const relativeUpdateText = computed(() => {
  if (!props.updateTime) return '暂无更新时间'

  const now = new Date()
  const updated = new Date(props.updateTime)

  const hours = now.getHours() - updated.getUTCHours()

  return `${hours}小时前更新`
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
$text-secondary: #666;
$border-lighter: #f5f5f5;
$spacing-xs: 4px;
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

    .headerHour {
      color: $text-secondary;
      margin-top: $spacing-xs;
    }
  }
}
</style>