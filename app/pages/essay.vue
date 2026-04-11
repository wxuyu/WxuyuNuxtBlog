<script setup lang="ts">
import Ispeak_Page_Main from '~/components/yjluo/essay/ispeak/Page_Main.vue';
import Local_Page_Main from '~/components/yjluo/essay/local/PageMain.vue';
// 全局配置
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()

// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div v-if="appConfig.essay.TYPE === 'ispeak'">
    <Ispeak_Page_Main />
  </div>
  <div v-if="appConfig.essay.TYPE === 'memos'">

  </div>
  <template v-if="appConfig.essay.TYPE === 'local'">
    <Local_Page_Main />
  </template>
  
  <PostComment />
</template>