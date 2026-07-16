<script setup lang="ts">
defineProps<{
  currentPage: number
  totalPages: number
}>()

const emit = defineEmits<{
  (e: 'go', page: number): void
  (e: 'prev'): void
  (e: 'next'): void
}>()
</script>

<template>
  <div class="pagination">
    <button
      class="pageBtn"
      :disabled="currentPage === 1"
      @click="emit('prev')"
    >
      上一页
    </button>

    <div class="pageNumbers">
      <button
        v-for="page in totalPages"
        :key="page"
        class="pageNumber"
        :class="{ active: page === currentPage }"
        @click="emit('go', page)"
      >
        {{ page }}
      </button>
    </div>

    <button
      class="pageBtn"
      :disabled="currentPage === totalPages"
      @click="emit('next')"
    >
      下一页
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #409eff;
$border-light: #eee;
$border-lighter: #f5f5f5;
$bg-white: #fff;
$spacing-xs: 4px;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-lg: 16px;
$radius-sm: 4px;

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: $spacing-sm;
  margin-top: $spacing-lg;
  padding-top: $spacing-lg;
  border-top: 1px solid $border-lighter;

  .pageBtn {
    padding: $spacing-xs $spacing-md;
    border: 1px solid $border-light;
    border-radius: $radius-sm;
    background: $bg-white;
    cursor: pointer;
    transition: all 0.2s;

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    &:not(:disabled):hover {
      background: $border-lighter;
    }
  }

  .pageNumbers {
    display: flex;
    gap: $spacing-xs;

    .pageNumber {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: 1px solid $border-light;
      border-radius: $radius-sm;
      background: $bg-white;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: $border-lighter;
      }

      &.active {
        background: $primary-color;
        color: $bg-white;
        border-color: $primary-color;
      }
    }
  }
}
</style>