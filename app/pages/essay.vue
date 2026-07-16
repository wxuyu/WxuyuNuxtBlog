<script setup lang="ts">
import IspeakFeed from '~/components/essay/ispeak/IspeakFeed.vue';
import LocalTalkFeed from '~/components/essay/local/LocalTalkFeed.vue';
// 全局配置
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()

// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div v-if="appConfig.essay.TYPE === 'ispeak'">
    <IspeakFeed />
  </div>
  <div v-if="appConfig.essay.TYPE === 'memos'">

  </div>
  <template v-if="appConfig.essay.TYPE === 'local'">
    <LocalTalkFeed />
  </template>
  
  <PostComment />
</template>