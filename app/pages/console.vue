<script setup lang="ts">
/**
 * 控制台页面
 * 页面内直接渲染 MusicSettings（默认显示歌单列表），
 * ConsolePanel 4-tab 控制台作为折叠区。
 *   - MusicSettings：歌单/播放/歌词（独立可见，不受 Tab 状态影响）
 *   - ConsolePanel：全局/功能/音乐/关于 4 tab
 */
definePageMeta({
  title: '控制台',
})

useHead({
  title: '控制台 | sxiaohe blog',
})
</script>

<template>
  <div class="console-page">
    <div class="console-page__inner">
      <!-- 始终显示 MusicSettings（独立 music player 区域） -->
      <div class="console-music-section">
        <h2 class="section-title">音乐播放器</h2>
        <ConsoleMusicSettings />
      </div>
      <!-- ConsolePanel 4-tab 控制台 -->
      <div class="console-panel-section">
        <h2 class="section-title">控制台</h2>
        <ConsolePanel />
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.console-page {
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 1.2em;

  &__inner {
    display: flex;
    flex-direction: column;
    gap: 1.2em;
    width: 100%;
    max-width: 880px;
  }
}

.console-music-section,
.console-panel-section {
  display: flex;
  flex-direction: column;
  gap: 0.6em;
}

.section-title {
  margin: 0;
  font-size: 1.1em;
  font-weight: 600;
  color: var(--c-text);
}
</style>
