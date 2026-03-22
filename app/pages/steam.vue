<script setup lang="ts">
// 全局模块
const layoutStore = useLayoutStore()
// 开启侧边栏设置
layoutStore.setAside(['blog-log'])
// 导入模块位置
import Avatar from '~/components/yjluo/steam/avatar.vue';
import RecentGames from '~/components/yjluo/steam/recentGames.vue';
import Overview from '~/components/yjluo/steam/overview.vue';
import AllGames from '~/components/yjluo/steam/allGames.vue';
</script>

<template>
  <div class="SteamPageMain">
    <div class="SteamPageContent">
      <Avatar />
      <Overview />
      <RecentGames />
      <AllGames />
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamPageMain {
  margin: 1em;
  .SteamPageContent {
    display: flex;
    flex-direction: column;
    gap: 1em;
  }
}
</style>