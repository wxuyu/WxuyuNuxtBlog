<script setup lang="ts">
import type { HotItem } from '~/types/hot'
import hotCard from './hotCard.vue';

defineProps<{
  items: HotItem[]
  currentPage: number
  itemsPerPage: number
}>()
</script>

<template>
  <div class="hotList">
    <hotCard
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