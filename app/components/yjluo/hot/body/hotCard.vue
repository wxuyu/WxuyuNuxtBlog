<script setup lang="ts">
import type { HotItem } from '~/types/hot'

const props = defineProps<{
  item: HotItem
  rank: number
}>()

const link = computed(() => props.item.url || props.item.mobileUrl || '#')

const rankId = computed(() => `rank-top${props.rank}`)
</script>

<template>
  <div class="hotItem">
    <a
      class="hotItemLink"
      :href="link"
      target="_blank"
      rel="noopener noreferrer"
    >
      <div class="rank" :id="rankId">
        {{ rank }}
      </div>

      <div class="content">
        <div class="title">{{ item.title }}</div>
        <div class="desc">{{ item.desc || '暂无描述' }}</div>

        <div class="meta">
          <span v-if="item.author">作者：{{ item.author }}</span>
          <span v-if="item.hot">热度：{{ item.hot }}</span>
        </div>
      </div>
    </a>
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
    }

    #rank-top1 {
      background-color: #ea444d;
    }

    #rank-top2 {
      background-color: #ed702d;
    }

    #rank-top3 {
      background-color: #eead3f;
    }

    #rank-top1,
    #rank-top2,
    #rank-top3 {
      color: #fff;
    }

    .content {
      flex: 1;

      .title {
        font-size: 15px;
        font-weight: 600;
        color: $text-primary;
        margin-bottom: $spacing-xs;
      }

      .desc {
        font-size: 13px;
        color: $text-secondary;
        margin-bottom: $spacing-xs;
      }

      .meta {
        display: flex;
        gap: $spacing-md;
        font-size: 12px;
        color: $text-tertiary;
      }
    }
  }
}
</style>