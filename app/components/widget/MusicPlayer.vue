<script setup lang="ts">
/**
 * WidgetMusicPlayer — 移动端音乐播放器 widget
 *
 * 用途：
 *   - 通过 useWidgets 注册为 'music-player' widget
 *   - 在移动端 (< 768px) 时挂到 BlogAside 列表里
 *   - 桌面端由 FloatingPlayer 接管，此 widget 自动隐藏
 *
 * 设计：
 *   - 极简版：单行 + 进度条 + 播放/暂停 + 下一首
 *   - 不带展开面板/歌词（避免移动端 sidebar 太拥挤）
 *   - 点击封面或标题打开歌单视图（可后续扩展为浮层）
 */
const player = useMusicPlayer()
const {
  isPlaying, currentSong, currentTime, duration, volume, modeIcon,
  progressPercent, togglePlay, playNext, formatTime,
} = player

const appConfig = useAppConfig()
const musicConfig = appConfig.music ?? { source: 'local' }

const hasSong = computed(() => currentSong.value !== null)
const displayProgress = computed(() => progressPercent.value)

// 仅在移动端显示
const isDesktop = ref(true)
function checkViewport() {
  if (typeof window === 'undefined') return
  isDesktop.value = window.innerWidth >= 768
}

onMounted(() => {
  checkViewport()
  window.addEventListener('resize', checkViewport)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkViewport)
})

// 进度条点击
const progressRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragPercent = ref(0)

function onProgressDown(e: PointerEvent) {
  if (!progressRef.value) return
  isDragging.value = true
  updateProgress(e)
  ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
  document.addEventListener('pointermove', onProgressMove)
  document.addEventListener('pointerup', onProgressUp)
}
function onProgressMove(e: PointerEvent) { updateProgress(e) }
function onProgressUp() {
  isDragging.value = false
  document.removeEventListener('pointermove', onProgressMove)
  document.removeEventListener('pointerup', onProgressUp)
}
function updateProgress(e: PointerEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  dragPercent.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
}

const shownProgress = computed(() => isDragging.value ? dragPercent.value : displayProgress.value)

// 用 useMusicSource 加载歌单（首次）
const musicSource = useMusicSource()
const playlists = ref<{ id: string; name: string; cover: string }[]>([])
const ready = ref(false)

onMounted(async () => {
  if (playlists.value.length === 0) {
    try {
      const list = await musicSource.fetchPlaylists()
      playlists.value = list.map(p => ({ id: p.id, name: p.name, cover: p.cover }))
      ready.value = true
    } catch (e) {
      console.error('[WidgetMusicPlayer] 加载歌单失败:', e)
    }
  }
})
</script>

<template>
  <!-- 桌面端不渲染（FloatingPlayer 接管） -->
  <div v-if="isDesktop" class="wp-desktop-hidden" />

  <!-- 移动端渲染 -->
  <div v-else class="wp-widget">
    <div class="wp-header">
      <Icon name="ph:music-notes-fill" />
      <span class="wp-title">音乐播放器</span>
    </div>

    <div v-if="hasSong" class="wp-main">
      <div class="wp-info">
        <span class="wp-song-title">{{ currentSong!.title }}</span>
        <span class="wp-song-artist">{{ currentSong!.artist }}</span>
      </div>

      <div
        ref="progressRef"
        class="wp-progress"
        @pointerdown.stop="onProgressDown"
      >
        <div class="wp-progress-rail">
          <div class="wp-progress-fill" :style="{ width: shownProgress + '%' }" />
        </div>
      </div>

      <div class="wp-meta">
        <span class="wp-time">{{ formatTime(currentTime) }} / {{ formatTime(duration) || '--:--' }}</span>
        <Icon :name="modeIcon" class="wp-mode" />
      </div>

      <div class="wp-controls">
        <button class="wp-ctrl-btn" @click="playNext" title="下一首">
          <Icon name="ph:skip-forward-fill" />
        </button>
        <button
          class="wp-play-btn"
          @click="togglePlay"
          :title="isPlaying ? '暂停' : '播放'"
        >
          <Icon :name="isPlaying ? 'ph:pause-fill' : 'ph:play-fill'" />
        </button>
      </div>
    </div>

    <div v-else class="wp-empty">
      <Icon name="ph:music-notes" />
      <span v-if="ready">点击播放按钮开始</span>
      <span v-else>加载中...</span>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.wp-desktop-hidden {
  display: none;
}

.wp-widget {
  display: flex;
  flex-direction: column;
  gap: .55rem;
  padding: .65rem;
  font-size: .8rem;
}

.wp-header {
  display: flex;
  align-items: center;
  gap: .35rem;
  font-size: .72rem;
  color: var(--c-text-2);
  font-weight: 600;
  letter-spacing: .02em;

  svg { color: var(--c-primary); font-size: .9rem; }
}

.wp-title { font-size: inherit; }

.wp-main {
  display: flex;
  flex-direction: column;
  gap: .45rem;
}

.wp-info {
  display: flex;
  flex-direction: column;
  gap: .1rem;
  min-width: 0;
}

.wp-song-title {
  font-size: .82rem;
  font-weight: 600;
  color: var(--c-text-1);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-song-artist {
  font-size: .68rem;
  color: var(--c-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.wp-progress {
  cursor: pointer;
  padding: .3rem 0;
  touch-action: none;
}

.wp-progress-rail {
  position: relative;
  height: 2px;
  background: hsl(0 0% 0% / .12);
  border-radius: 1px;
  overflow: hidden;
}

.wp-progress-fill {
  position: absolute;
  inset: 0 auto 0 0;
  background: var(--c-primary);
  border-radius: 1px;
  transition: width .15s linear;
}

.wp-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: .65rem;
  color: var(--c-text-2);
}

.wp-time { font-variant-numeric: tabular-nums; }

.wp-mode { color: var(--c-text-2); font-size: .85rem; }

.wp-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .55rem;
  margin-top: .15rem;
}

.wp-ctrl-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: 50%;
  background: hsl(0 0% 0% / .04);
  color: var(--c-text-1);
  cursor: pointer;
  font-size: .9rem;
  transition: background .15s, transform .1s;

  &:hover {
    background: hsl(0 0% 0% / .08);
  }
  &:active {
    transform: scale(.92);
  }
}

.wp-play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 50%;
  background: var(--c-primary);
  color: #fff;
  cursor: pointer;
  font-size: 1rem;
  transition: transform .12s, opacity .15s;

  &:hover {
    transform: scale(1.04);
    opacity: .9;
  }
  &:active {
    transform: scale(.96);
  }
}

.wp-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3rem;
  padding: .8rem;
  color: var(--c-text-2);
  font-size: .75rem;

  svg { font-size: 1.5rem; opacity: .4; }
}
</style>