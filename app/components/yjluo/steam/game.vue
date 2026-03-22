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
  <div class="SteamGameMain">
    <div class="SteamGameHeader">
      <h2 class="GameHeaderTitle">
        <Icon name="ph:stack-bold" />
        游戏库        
      </h2>
    </div>
    <div class="SteamGameList">
      <div class="GameListCard" v-for="game in gamesData?.recentGames">
        <div class="ListCardHeader">
          <NuxtImg class="CardHeaderImage" :src="game.images.headerImage" />
        </div>
        <div class="ListCardBody">
          <div class="CardBodyInfo">
            <h3 class="BodyInfoTitle">{{ game.name }}</h3>
            <div class="BodyInfoStatus">
              <div class="InfoStatusRow">
                <div class="StatusRowText">
                  <div class="RowTextLabel">
                    总时长
                  </div>
                  <div class="RowTextValue">
                    {{ game.playtimeForever }}h
                  </div>
                </div>
                <Badge class="StatusRowBadge" :text="`最近${ game.playtimeTwoWeeks }h`" />
              </div>
            </div>
          </div>
          <div class="ListCardAchievements">
            <div class="CardAchievementsInfo">
              <div class="AchievementsInfoLabel">
                <Icon class="InfoLabelIcon" name="i-ph:trophy-bold" :style="`color: ${game.achievements?.percentage === game.achievements?.total}`"/>
                <span class="InfoLabelCount">
                  {{ game.achievements?.percentage }} / {{ game.achievements?.total }}
                </span>
              </div>
              <span class="GamePriceNumber">{{ game.price.displayPrice }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.SteamGameMain{

  .SteamGameList {
    display: grid;
    gap: 16px;
    .GameListCard {
      background: var(--ld-bg-card);
      border: 1px solid var(--c-border);
      border-radius: 12px;
      cursor: pointer;
      display: flex;
      height: 120px;
      overflow: hidden;
      position: relative;
      transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease;
      width: 100%;
      .ListCardHeader {
        flex-shrink: 0;
        max-width: 220px;
        min-width: 140px;
        overflow: hidden;
        position: relative;
        width: 35%;
        .CardHeaderImage {
          height: 100%;
          -o-object-fit: cover;
          object-fit: cover;
          transition: transform .4s ease;
          width: 100%;
        }
      }
      .ListCardBody {
        flex: 1;
        justify-content: space-between;
        min-width: 0;
        padding: 12px 16px;
        display: flex;
        flex-direction: column;
        .CardBodyInfo {
          display: flex;
          flex-direction: column;
          gap: 6px;
          .BodyInfoTitle {
            color: var(--c-text);
            display: -webkit-box;
            font-size: 1rem;
            font-weight: 700;
            -webkit-line-clamp: 1;
            line-clamp: 1;
            line-height: 1.3;
            margin: 0;
            overflow: hidden;
            -webkit-box-orient: vertical;
          }
          .BodyInfoStatus {
            color: var(--c-text-2);
            flex-wrap: wrap;
            font-size: .85rem;
            gap: 12px;
            .InfoStatusRow {
              align-items: center;
              display: flex;
              gap: 6px;
              .StatusRowText {
                align-items: baseline;
                display: flex;
                gap: 4px;
                .RowTextLabel {
                  color: var(--c-text-2);
                  font-size: .9em;
                  font-weight: 600;
                  margin-bottom: .2em;
                  font-synthesis: weight style;
                }
                .RowTextValue {
                  color: var(--c-text-1);
                  font-family: var(--font-monospace, monospace);
                  font-weight: 600;
                  font-size: 1.5em;
                }
              }
              .StatusRowBadge:not([href]) {
                background-color: var(--c-primary-soft, color-mix(in srgb, var(--c-primary) 10%, transparent));
                border-color: var(--c-primary-light, color-mix(in srgb, var(--c-primary) 30%, transparent));
                color: var(--c-primary);
              }
            }
          }
        }
        .ListCardAchievements {
          margin-top: auto;
          .CardAchievementsInfo {
            align-items: center;
            display: flex;
            font-size: .8rem;
            justify-content: space-between;
            margin-bottom: 6px;
            .AchievementsInfoLabel {
              align-items: center;
              color: var(--c-text-2);
              display: flex;
              gap: 6px;
            }
          }
        }
      }
    }
  }
}
.InfoLabelIcon {
    color: #10b981;
}
</style>