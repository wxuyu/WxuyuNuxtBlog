<!--
  /memos 路由 — 碎碎念页面

  - 默认使用瀑布流布局
  - 默认配置从 app.config.ts 中读取
-->
<script setup lang="ts">
import MemosTimeline from '~/components/memos/MemosTimeline.vue'

useHead({
  title: '碎碎念 · Memos',
  meta: [{ name: 'description', content: '记录在 Memos 上的碎碎念' }],
})

/** 布局：固定瀑布流 */
const layout = 'masonry' as const

const layoutStore = useLayoutStore()

// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div class="memos-page">
    <MemosTimeline :layout="layout" />
  </div>
</template>

<style scoped lang="scss">
.memos-page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem 1rem;
}

@media (max-width: 768px) {
  .memos-page {
    max-width: 720px;
    padding: 1rem 0.5rem;
  }
}
</style>