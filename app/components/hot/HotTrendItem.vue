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
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: .5em;
  padding: 0.8rem 0.8rem;
  border-radius: 0.5rem;
  background-color: var(--c-bg-3);
  overflow: hidden;
  .dark & {
    --c-bg-3: hsl(0deg 0% 60% / .1);
  }
  --c-bg-3: hsl(0deg 0% 100%);

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