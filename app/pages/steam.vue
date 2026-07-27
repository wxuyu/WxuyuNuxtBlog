<script setup lang="ts">
// 全局模块
const layoutStore = useLayoutStore()
// 开启侧边栏设置
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
// 导入模块位置
import SteamUserCard from '~/components/steam/SteamUserCard.vue';
import SteamRecentPlay from '~/components/steam/SteamRecentPlay.vue';
import SteamOverview from '~/components/steam/SteamOverview.vue';
import SteamGameList from '~/components/steam/SteamGameList.vue';
</script>

<template>
  <div class="SteamPageMain">
    <div class="SteamPageContent">
      <SteamUserCard />
      <SteamOverview />
      <SteamRecentPlay />
      <SteamGameList />
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