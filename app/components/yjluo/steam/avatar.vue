<script setup lang="ts">
const { 
  fetchSteamData, 
  fetchGameDetail,
  userData, 
  statusTextMap, 
  statusColorMap 
} = useSteamAPIGet()

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
  <div class="SteamUser">
    <div class="SteamUserHeader">
      <NuxtImg class="UserHeaderAvatar" :src="`${userData?.avatar.large}`" />
      <div class="UserHeaderInfo">
        <div class="HeaderInfoRow">
          <h2 class="RowUserName">
            {{ userData?.username }}
          </h2>
          <div class="RowBadgeGroup">
            <div class="RowBadgeCard" :style="`--status-color: ${statusColorMap[userData?.status]}`">
              <span class="BadgeCardDot" />
              {{ statusTextMap[userData?.status] }}
            </div>
          </div>
        </div>
        <p class="StatusInfoText" v-show="userData?.status === 'offline'">当前该用户已{{ statusTextMap[userData?.status] }}</p>
        <a class="StatusInfoUrl" :href="userData?.profileUrl"> 访问 Steam 个人资料 → </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamUser {
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: .8em;
  padding: 1em;
  transition: border-color .3s ease;
  .SteamUserHeader {
    align-items: flex-start;
    display: flex;
    gap: 1em;
    .UserHeaderAvatar {
      border: 2px solid var(--c-primary);
      border-radius: 50%;
      flex-shrink: 0;
      height: 100px;
      -o-object-fit: cover;
      object-fit: cover;
      width: 100px;
    }
    .UserHeaderInfo {
      flex: 1;
      min-width: 0;
      .HeaderInfoRow {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: .75em;
        margin-bottom: .5em;
        .RowUserName {
          color: var(--c-text);
          font-size: 1.25em;
          font-weight: 600;
          margin: 0;
          word-break: break-word;
        }
        .RowBadgeGroup {
          align-items: center;
          display: flex;
          gap: .5em;
          .RowBadgeCard {
            align-items: center;
            background: color-mix(in srgb, var(--status-color) 15%, transparent);
            border-radius: 1em;
            color: var(--status-color);
            display: inline-flex;
            font-size: .875em;
            font-weight: 500;
            gap: .5em;
            padding: .25em .75em;
            white-space: nowrap;
            .BadgeCardDot {
              animation: pulse-a9cdcf99 1.5s ease-in-out infinite;
              background: var(--status-color);
              border-radius: 50%;
              display: inline-block;
              height: 6px;
              width: 6px;
            }
          }
        }
      }
      .StatusInfoText {
        color: var(--c-text-2);
        font-size: .85em;
        font-weight: 400;
        margin: .125em 0 0;
      }
      .StatusInfoUrl {
        color: var(--c-primary);
        display: inline-block;
        font-size: .875em;
        font-weight: 500;
        margin-top: .5em;
        text-decoration: none;
        transition: opacity .2s;
      }
    }
  }
}
</style>