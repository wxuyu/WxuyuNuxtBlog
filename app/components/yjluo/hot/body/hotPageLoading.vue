<script setup lang="ts">
const props = defineProps<{
  pending: boolean
  error: unknown
  isEmpty: boolean
  message: string
}>()

const emit = defineEmits<{
  (e: 'retry'): void
}>()
</script>

<template>
  <div
    class="status"
    :class="{
      loading: pending,
      error: !!error,
      empty: isEmpty
    }"
  >
    {{ message }}
    <button
      v-if="error"
      class="retryBtn"
      @click="emit('retry')"
    >
      重试
    </button>
  </div>
</template>

<style lang="scss" scoped>
$primary-color: #409eff;
$text-secondary: #666;
$bg-white: #fff;
$spacing-sm: 8px;
$spacing-md: 12px;
$spacing-xl: 20px;
$radius-md: 6px;

.status {
  text-align: center;
  color: $text-secondary;
  padding: $spacing-xl 0;

  &.error {
    color: #e74c3c;
  }

  .retryBtn {
    display: inline-block;
    margin-top: $spacing-sm;
    margin-left: $spacing-md;
    padding: 4px $spacing-md;
    border: none;
    border-radius: $radius-md;
    background: $primary-color;
    color: $bg-white;
    cursor: pointer;
    transition: background 0.2s;
  }
}
</style>