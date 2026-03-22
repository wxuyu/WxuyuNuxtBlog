<script setup lang="ts">
// 导入外部数据
import { creativityData } from '~/creativity';
</script>

<template>
<div class="author-content-item creativityMain" v-for="(creativity, index) in creativityData" :key="index">
  <div class="author-content-item-tips">
    技能
  </div>
  <div class="author-content-item-list">
    <div class="cardInfo" v-for="item in creativity.creativity_list" :key="item.name">
      <Badge :img="item.icon" :text="item.name" style="padding: 0.5rem 0.65rem;"/>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
.creativityMain {
  .author-content-item-tips {
    opacity: 0.8;
    font-size: 12px;
    margin-bottom: 0.5rem;
  }
  .author-content-item-list {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
  }
}
</style>