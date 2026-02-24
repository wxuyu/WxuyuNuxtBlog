<template>
  <div class="basic-info-bar">
    <span class="title-text">{{ title }}</span>
  </div>
</template>

<style lang="scss" scoped>
.basic-info-bar {
  display: grid;
  .title-text {
    text-align: center;
    margin: 0 auto;
  }
}
</style>

<script setup lang="ts">
defineProps<{
  title: string
}>()
</script>