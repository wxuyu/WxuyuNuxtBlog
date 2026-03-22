<script setup lang="ts">
const { 
  fetchSteamData, 
  fetchGameDetail,
  formatPlaytime, 
  formatSteamTime,
  userData, 
  gamesData, 
  achievementsData,
  statusTextMap, 
  statusColorMap 
} = useSteamAPIGet()

const overviewListItemData = [
  {
    icon: 'ph:game-controller-bold',
    label: '游戏总数量',
    value: computed(() => formatNumber(gamesData.value?.totalCount) || '--'),
  },{
    icon: 'ph:timer-bold',
    label: '游玩总时长',
    value: computed(() => formatNumber(userData.value?.playtimeStats.totalForever) || '--'),
  },{
    icon: 'ph:calendar-fill',
    label: '两周总时长',
    value: computed(() => formatNumber(userData.value?.playtimeStats.totalTwoWeeks) || '--'),
  }
]

// 初始加载数据
onMounted(async () => {
  // 获取基础数据
  await fetchSteamData(10)
  
  // 如果用户正在游戏中，获取游戏详情
  if (userData.value?.currentGame) {
    await fetchGameDetail(userData.value.currentGame.appid)
  }
})
</script>

<template>
  <div class="SteamStatus-overviewList">
    <div class="overviewListItem" v-for="item in overviewListItemData">
      <Icon class="ItemIcon" :name="item.icon"/>
      <div class="ItemInfo">
        <div class="ItemInfoLabel">
          {{ item.label }}
        </div>
        <div class="ItemInfoValue">
          {{ item.value }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamStatus-overviewList{ 
  box-shadow: var(--ld-shadow);
  display: flex;
  flex-direction: row;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.8em;
  gap: 0.8em;
  padding: 0.8em 1em;
  transition: box-shadow 0.2s;

  .overviewListItem{
    align-items: center;
    display: flex;
    flex: 1 1 0%;
    gap: 0.6em;
    padding: 0.3em 0px;
    .ItemIcon {
      font-size: 28px;
      color: var(--c-primary);
      flex-shrink: 0;
    }
    .ItemInfo {
      display: flex;
      flex-direction: column;
      flex: 1 1 0%;
      gap: 0px;
      .ItemInfoLabel {
        color: var(--c-text-2);
        font-size: 0.75em;
        font-weight: 600;
      }
      .ItemInfoValue {
        color: var(--c-primary);
        font-size: 0.95em;
        font-weight: 700;
        line-height: 1.2;
      }
    }
  }
}
.overviewListItem:not(:last-child) {
  padding-right: 0.8em;
  border-right: 1px solid var(--c-border);
}
</style>