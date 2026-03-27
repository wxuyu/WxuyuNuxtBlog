<script lang="ts" setup>
const props = defineProps<{
  icon: string
  title: string
  subTitle: string
  subTip: string
}>()
</script>

<template>
<div class="SteamGameHeader">
  <h2 class="GameHeaderTitle">
    <Icon :name="`ph:${props.icon}`" />
    {{ props.title }}
  </h2>
  <span class="GameHeaderSub" v-tip="props.subTip">
    {{ props.subTitle }}
  </span>
</div>
</template>

<style lang="scss" scoped>
  .SteamGameHeader {
    justify-content: space-between;
    margin-bottom: 16px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--c-border);
    align-items: center;
    display: flex;
    flex-direction: row;
    .GameHeaderTitle {
      color: var(--c-text);
      font-size: 1rem;
      font-weight: 600;
      justify-content: flex-start;
      letter-spacing: 0.5px;
      text-transform: uppercase;
      gap: 8px;
      align-items: center;
      display: flex;
      flex-direction: row;
    }
    .GameHeaderSub {
      color: var(--c-text-3);
      font-size: 0.75rem;
    }
  }
</style>