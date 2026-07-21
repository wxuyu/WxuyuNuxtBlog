<script setup lang="ts">
/**
 * MusicPlayer — 内嵌式音乐播放器（widget 容器内）
 *
 * 视觉参考：友链/歌单风格，圆形封面 + 标题/作者/时长 + 进度条 + 圆形播放钮 + 歌单
 * 容器：BlogWidget 卡片（非悬浮）
 */
import { FloatStatus } from '~/types/music'
import type { Playlist } from '~/types/music'

// --- 播放器引擎 ---
const player = useMusicPlayer()

const { isPlaying, currentSong, currentTime, duration, volume, mode, modeIcon, modeLabel,
  progressPercent, playlist,
  togglePlay, playNext, playPrev, playAt, seek, setVolume, toggleMute,
  cycleMode, setPlaylist, applyResume, formatTime } = player

const appConfig = useAppConfig()
const musicConfig = appConfig.music ?? { source: 'local', lyrics: { show: false } }

// --- 歌单数据 ---
const musicSource = useMusicSource()
const playlists = ref<Playlist[]>([])
const selectedPlaylistId = ref<string | null>(null)
const selectedPlaylist = computed(() =>
  playlists.value.find((p) => p.id === selectedPlaylistId.value) ?? null,
)
const expanded = ref(false) // 歌单展开/收起

// --- 视图模式：playlists = 歌单列表；songs = 当前歌单的歌曲列表 ---
type ViewMode = 'playlists' | 'songs'
const view = ref<ViewMode>('playlists')

function enterPlaylist(pl: Playlist) {
  selectedPlaylistId.value = pl.id
  view.value = 'songs'
}

function backToPlaylists() {
  view.value = 'playlists'
}
const loading = ref(true)
const audioError = ref(false)

async function loadPlaylists() {
  loading.value = true
  try {
    const list = await musicSource.fetchPlaylists()
    playlists.value = list
    if (list.length > 0 && !selectedPlaylistId.value) {
      // 尝试恢复上次播放状态（仅恢复位置，不自动播放）
      const persisted = readPersistedState()
      const match = persisted
        ? list.find((p) => p.id === persisted.playlistId)
        : null
      if (match && persisted) {
        selectedPlaylistId.value = match.id
        view.value = 'songs'
        const ok = applyResume(match.songs, match.id, {
          persistedSongId: persisted.songId,
          persistedTime: persisted.currentTime,
          persistedMode: persisted.mode,
        })
        if (!ok) {
          setPlaylist(match.songs, 0, match.id)
        }
      } else {
        selectedPlaylistId.value = list[0].id
        setPlaylist(list[0].songs, 0, list[0].id)
      }
    }
  } catch (e) {
    console.error('[MusicPlayer] 加载歌单失败:', e)
  } finally {
    loading.value = false
  }
}

function selectPlaylist(pl: Playlist) {
  selectedPlaylistId.value = pl.id
  setPlaylist(pl.songs, 0, pl.id)
  view.value = 'songs'
}

interface PersistedState {
  v: number
  playlistId: string | null
  songId: string | null
  currentTime: number
  mode: string
  volume: number
}

function readPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem('sxiaohe-music-player-state-v1')
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.v !== 1) return null
    if (!parsed.playlistId) return null
    return parsed
  } catch {
    return null
  }
}

// --- 派生：当前选中的歌单内歌曲列表 ---
const currentPlaylist = computed(() => selectedPlaylist.value?.songs ?? [])

// --- 判断组件是否准备就绪 ---
const isReady = computed(() => playlists.value.length > 0 || playlist.value.length > 0)
const hasSong = computed(() => currentSong.value !== null)

// --- 监听当前歌曲的 ended 事件以确保自动切下一首 ---
// 引擎内已挂载 'ended' → playNext，这里只是兜底
watch(currentTime, (now) => {
  if (duration.value > 0 && now >= duration.value - 0.5 && isPlaying.value) {
    // 防御性触发（有些浏览器 ended 事件丢失）
    setTimeout(() => {
      if (currentTime.value >= duration.value - 0.5) {
        playNext()
      }
    }, 100)
  }
})

// --- 进度条拖拽 ---
const progressRef = ref<HTMLDivElement | null>(null)
const isDragging = ref(false)
const dragPercent = ref(0)

function onProgressMouseDown(e: MouseEvent) {
  if (!progressRef.value) return
  isDragging.value = true
  updateDrag(e)
  document.addEventListener('mousemove', onDragMove)
  document.addEventListener('mouseup', onDragEnd)
}

function onDragMove(e: MouseEvent) {
  updateDrag(e)
}

function onDragEnd() {
  isDragging.value = false
  if (duration.value > 0) {
    seek((dragPercent.value / 100) * duration.value)
  }
  document.removeEventListener('mousemove', onDragMove)
  document.removeEventListener('mouseup', onDragEnd)
}

function updateDrag(e: MouseEvent) {
  if (!progressRef.value) return
  const rect = progressRef.value.getBoundingClientRect()
  dragPercent.value = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100))
}

// --- 音量：横条拖拽 + 点击设置 ---
const volumeRef = ref<HTMLDivElement | null>(null)
const isVolumeDragging = ref(false)
const isMuted = computed(() => volume.value <= 0)

function onVolumeMouseDown(e: MouseEvent) {
  if (!volumeRef.value) return
  isVolumeDragging.value = true
  updateVolume(e)
  document.addEventListener('mousemove', onVolumeDragMove)
  document.addEventListener('mouseup', onVolumeDragEnd)
}

function onVolumeDragMove(e: MouseEvent) {
  updateVolume(e)
}

function onVolumeDragEnd() {
  isVolumeDragging.value = false
  document.removeEventListener('mousemove', onVolumeDragMove)
  document.removeEventListener('mouseup', onVolumeDragEnd)
}

function updateVolume(e: MouseEvent) {
  if (!volumeRef.value) return
  const rect = volumeRef.value.getBoundingClientRect()
  const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  setVolume(ratio)
}

// --- 音量图标 ---
const volumeIcon = computed(() => {
  if (isMuted.value) return 'ph:speaker-x'
  if (volume.value <= 0.4) return 'ph:speaker-low'
  return 'ph:speaker-high'
})

// --- 进度条当前显示百分比 ---
const displayProgress = computed(() => (isDragging.value ? dragPercent.value : progressPercent.value))

// --- 生命周期 ---
onMounted(() => {
  player.mount({
    defaultVolume: musicConfig.defaultVolume,
    defaultMode: musicConfig.defaultMode,
  })
  loadPlaylists()
})
</script>

<template>
<BlogWidget card>
  <div v-if="isReady" class="music-player" :class="{ 'is-loading': loading, 'has-error': audioError }">
    <!-- ==================== 顶部 ==================== -->
    <div class="music-player-top">
      <!-- 圆形封面 -->
      <div class="music-player-cover">
        <NuxtImg
          v-if="hasSong"
          :src="currentSong!.cover"
          :alt="currentSong!.title"
          width="56"
          height="56"
          class="music-player-cover-img"
          :class="{ 'is-spinning': isPlaying }"
        />
        <div v-else class="music-player-cover-placeholder">
          <Icon name="ph:music-notes-fill" />
        </div>
      </div>

      <!-- 元信息 -->
      <div class="music-player-meta">
        <div class="music-player-title-row">
          <span class="music-player-title">{{ hasSong ? currentSong!.title : '未选择歌曲' }}</span>
          <button
            class="music-player-ico-btn"
            :title="isMuted ? '取消静音' : '静音'"
            :aria-label="isMuted ? '取消静音' : '静音'"
            @click="toggleMute"
          >
            <Icon :name="volumeIcon" />
          </button>
        </div>
        <div class="music-player-subtitle">
          <span class="music-player-artist">
            {{ hasSong ? currentSong!.artist : '点击下方歌单开始播放' }}
          </span>
          <span v-if="hasSong" class="music-player-duration">
            {{ formatTime(currentTime) }} / {{ formatTime(duration) || '--:--' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ==================== 进度条 ==================== -->
    <div class="music-player-progress">
      <div
        ref="progressRef"
        class="music-player-progress-bar"
        :class="{ 'is-disabled': !hasSong }"
        @mousedown.prevent="onProgressMouseDown"
        role="slider"
        :aria-valuenow="displayProgress"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-label="`播放进度：${Math.round(displayProgress)}%`"
      >
        <div class="music-player-progress-rail">
          <div
            class="music-player-progress-fill"
            :style="{ width: displayProgress + '%' }"
          />
          <div
            class="music-player-progress-thumb"
            :style="{ left: displayProgress + '%' }"
          />
        </div>
      </div>
    </div>

    <!-- ==================== 控制栏 ==================== -->
    <div class="music-player-controls">
      <!-- 左侧：模式 -->
      <button
        class="music-player-ctrl-btn"
        @click="cycleMode"
        :title="modeLabel"
        :aria-label="modeLabel"
      >
        <Icon :name="modeIcon" />
      </button>

      <!-- 中间：播放控制 -->
      <div class="music-player-controls-center">
        <button
          class="music-player-ctrl-btn"
          @click="playPrev"
          :disabled="!hasSong"
          aria-label="上一首"
          title="上一首"
        >
          <Icon name="ph:skip-back-fill" />
        </button>
        <button
          class="music-player-play-btn"
          @click="togglePlay"
          :disabled="!hasSong"
          :aria-label="isPlaying ? '暂停' : '播放'"
          :title="isPlaying ? '暂停' : '播放'"
        >
          <Icon :name="isPlaying ? 'ph:pause-fill' : 'ph:play-fill'" />
        </button>
        <button
          class="music-player-ctrl-btn"
          @click="playNext"
          :disabled="!hasSong"
          aria-label="下一首"
          title="下一首"
        >
          <Icon name="ph:skip-forward-fill" />
        </button>
      </div>

      <!-- 右侧：歌单 -->
      <button
        class="music-player-ctrl-btn"
        :class="{ 'is-active': expanded }"
        :title="expanded ? '收起歌单' : '展开歌单'"
        :aria-label="expanded ? '收起歌单' : '展开歌单'"
        @click="expanded = !expanded"
      >
        <Icon name="ph:playlist-fill" />
      </button>
    </div>

    <!-- ==================== 音量条 ==================== -->
    <div class="music-player-volume-row">
      <Icon :name="volumeIcon" class="music-player-volume-icon" />
      <div
        ref="volumeRef"
        class="music-player-volume-bar"
        :class="{ 'is-disabled': isMuted }"
        @mousedown.prevent="onVolumeMouseDown"
        role="slider"
        :aria-valuenow="Math.round(volume * 100)"
        aria-valuemin="0"
        aria-valuemax="100"
        aria-label="音量"
      >
        <div class="music-player-volume-rail">
          <div
            class="music-player-volume-fill"
            :style="{ width: (volume * 100) + '%' }"
          />
          <div
            class="music-player-volume-thumb"
            :style="{ left: (volume * 100) + '%' }"
          />
        </div>
      </div>
      <span class="music-player-volume-value">{{ Math.round(volume * 100) }}%</span>
    </div>

    <!-- ==================== 歌单面板 ==================== -->
    <Transition name="mp-expand">
      <div v-if="expanded" class="music-player-playlists">
        <!-- 视图 1: 歌单卡片列表 -->
        <div v-if="view === 'playlists'" class="music-player-list">
          <div
            v-for="pl in playlists"
            :key="pl.id"
            :class="[
              'music-player-list-item',
              'music-player-playlist-card',
              { 'is-active': selectedPlaylistId === pl.id }
            ]"
            @click="enterPlaylist(pl)"
          >
            <div class="music-player-song-cover music-player-playlist-cover">
              <NuxtImg
                v-if="pl.cover"
                :src="pl.cover"
                :alt="pl.name"
                width="48"
                height="48"
              />
              <Icon v-else name="ph:playlist" class="music-player-song-cover-icon" />
              <div v-if="selectedPlaylistId === pl.id && isPlaying" class="music-player-song-playing">
                <span /><span /><span />
              </div>
            </div>
            <div class="music-player-song-info">
              <span class="music-player-song-title">{{ pl.name }}</span>
              <span class="music-player-song-artist">
                {{ pl.desc || `${pl.songs.length} 首` }}
              </span>
            </div>
            <span class="music-player-song-duration music-player-playlist-count">
              {{ pl.songs.length }} 首
            </span>
            <Icon name="ph:caret-right" class="music-player-playlist-arrow" />
          </div>
        </div>

        <!-- 视图 2: 选中歌单的歌曲列表 -->
        <div v-else class="music-player-list">
          <!-- 顶部返回条 -->
          <button class="music-player-back" @click="backToPlaylists">
            <Icon name="ph:caret-left" />
            <span>歌单列表</span>
          </button>

          <!-- 歌曲列表 -->
          <div
            v-for="(song, i) in currentPlaylist"
            :key="song.id"
            :class="[
              'music-player-list-item',
              { 'is-current': currentSong?.id === song.id }
            ]"
            @click="playAt(i)"
          >
            <div class="music-player-song-cover">
              <NuxtImg
                v-if="song.cover"
                :src="song.cover"
                :alt="song.title"
                width="48"
                height="48"
              />
              <Icon v-else name="ph:music-notes" class="music-player-song-cover-icon" />
              <div v-if="currentSong?.id === song.id && isPlaying" class="music-player-song-playing">
                <span /><span /><span />
              </div>
            </div>
            <div class="music-player-song-info">
              <span class="music-player-song-title">{{ song.title }}</span>
              <span class="music-player-song-artist">{{ song.artist }}</span>
            </div>
            <span v-if="song.duration" class="music-player-song-duration">
              {{ formatTime(song.duration) }}
            </span>
          </div>
        </div>
      </div>
    </Transition>
  </div>

  <!-- 加载中状态 -->
  <div v-else-if="loading" class="music-player music-player-skeleton">
    <div class="music-player-skeleton-line music-player-skeleton-cover" />
    <div class="music-player-skeleton-line music-player-skeleton-title" />
    <div class="music-player-skeleton-line music-player-skeleton-subtitle" />
  </div>
</BlogWidget>
</template>

<style lang="scss" scoped>
/* ==================== 变量 ==================== */
.music-player {
  --mp-bg: transparent;
  --mp-border: var(--c-divider, hsl(0deg 0% 88%));
  --mp-text: var(--c-text-1, hsl(0deg 0% 10%));
  --mp-text-2: var(--c-text-2, hsl(0deg 0% 40%));
  --mp-accent: var(--c-primary, hsl(355deg 70% 65%));
  --mp-radius: .5rem;

  display: flex;
  flex-direction: column;
  gap: .55em;
  font-size: 14px;
  user-select: none;
  padding: .15rem 0;

  .dark & {
    --mp-border: hsl(0deg 0% 22%);
  }
}

/* ==================== 顶部 ==================== */
.music-player-top {
  display: flex;
  align-items: center;
  gap: .7em;
}

.music-player-cover {
  position: relative;
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: 50%;
  overflow: hidden;
  background: hsl(var(--thyuu--color-font, 0 0% 0%) / .05);
  box-shadow: 0 1px 4px hsl(0deg 0% 0% / .12);

  &-img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 50%;

    &.is-spinning {
      animation: mp-spin 14s linear infinite;
    }
  }

  &-placeholder {
    width: 100%;
    height: 100%;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--mp-text-2);
    font-size: 1.6rem;
    background: hsl(var(--thyuu--color-font, 0 0% 0%) / .05);
  }
}

@keyframes mp-spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-player-meta {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .15em;
}

.music-player-title-row {
  display: flex;
  align-items: center;
  gap: .3em;
}

.music-player-title {
  flex: 1;
  min-width: 0;
  font-size: .95rem;
  font-weight: 600;
  color: var(--mp-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-player-subtitle {
  display: flex;
  align-items: center;
  gap: .4em;
  font-size: .8rem;
  color: var(--mp-text-2);
}

.music-player-artist {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-player-duration {
  flex: none;
  font-variant-numeric: tabular-nums;
  font-size: .72rem;
  color: var(--mp-text-2);
}

/* ==================== 进度条 ==================== */
.music-player-progress {
  display: flex;
  align-items: center;
  padding: .4em 0;
}

.music-player-progress-bar {
  flex: 1;
  cursor: pointer;
  padding: .35em 0;

  &.is-disabled {
    cursor: not-allowed;
    opacity: .5;
  }
}

.music-player-progress-rail {
  position: relative;
  height: 3px;
  background: hsl(var(--thyuu--color-font, 0 0% 0%) / .12);
  border-radius: 2px;
}

.music-player-progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--mp-accent);
  border-radius: 2px;
  transition: width .15s linear;
}

.music-player-progress-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--mp-accent);
  opacity: 0;
  transition: opacity .15s, transform .15s;
}

.music-player-progress-bar:hover .music-player-progress-thumb,
.music-player-progress-bar:focus-within .music-player-progress-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.2);
}

/* ==================== 控制栏 ==================== */
.music-player-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .3em;
  padding: .1em 0;
}

.music-player-controls-center {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: .5em;
}

.music-player-ctrl-btn,
.music-player-ico-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  border-radius: .35rem;
  background: transparent;
  color: var(--mp-text-2);
  cursor: pointer;
  font-size: 1rem;
  transition: color .15s, background .15s, transform .1s;

  &:hover:not(:disabled) {
    color: var(--mp-text);
    background: hsl(var(--thyuu--color-font, 0 0% 0%) / .05);
  }

  &:active:not(:disabled) {
    transform: scale(.92);
  }

  &:disabled {
    opacity: .4;
    cursor: not-allowed;
  }

  &.is-active {
    color: var(--mp-accent);
  }
}

.music-player-play-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border: none;
  border-radius: 50%;
  background: hsl(var(--mp-accent-hsl, 355 70% 65%) / .15);
  color: var(--mp-accent);
  cursor: pointer;
  font-size: 1.1rem;
  transition: transform .12s, box-shadow .12s, background .15s;

  &:hover:not(:disabled) {
    transform: scale(1.05);
    background: hsl(var(--mp-accent-hsl, 355 70% 65%) / .22);
  }

  &:active:not(:disabled) {
    transform: scale(.95);
  }

  &:disabled {
    opacity: .4;
    cursor: not-allowed;
  }
}

/* ==================== 音量条 ==================== */
.music-player-volume-row {
  display: flex;
  align-items: center;
  gap: .5em;
  padding: .2em 0;
}

.music-player-volume-icon {
  flex: none;
  color: var(--mp-text-2);
  font-size: .95rem;
}

.music-player-volume-bar {
  flex: 1;
  cursor: pointer;
  padding: .3em 0;
  touch-action: none;
}

.music-player-volume-rail {
  position: relative;
  height: 3px;
  background: hsl(var(--thyuu--color-font, 0 0% 0%) / .12);
  border-radius: 2px;
}

.music-player-volume-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: var(--mp-accent);
  border-radius: 2px;
  transition: width .1s linear;
}

.music-player-volume-thumb {
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--mp-accent);
  opacity: 0;
  transition: opacity .15s, transform .15s;
}

.music-player-volume-bar:hover .music-player-volume-thumb,
.music-player-volume-bar:focus-within .music-player-volume-thumb {
  opacity: 1;
  transform: translate(-50%, -50%) scale(1.3);
}

.music-player-volume-value {
  flex: none;
  min-width: 2.4em;
  text-align: right;
  font-size: .7rem;
  color: var(--mp-text-2);
  font-variant-numeric: tabular-nums;
}

/* ==================== 歌单面板 ==================== */
.music-player-playlists {
  display: flex;
  flex-direction: column;
  gap: .4em;
  margin-top: .3em;
  padding-top: .4em;
  border-top: 1px solid var(--mp-border);
  overflow: hidden;
}

/* 歌单 / 歌曲 两级视图共用的滚动列表容器 */
.music-player-list {
  display: flex;
  flex-direction: column;
  gap: .15em;
  max-height: 260px;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar {
    width: 4px;
  }
  &::-webkit-scrollbar-thumb {
    background: var(--mp-border);
    border-radius: 2px;
  }
}

/* 列表行: 歌单卡片 + 歌曲行复用 */
.music-player-list-item {
  display: flex;
  align-items: center;
  gap: .6em;
  padding: .3em .35em;
  border-radius: .5rem;
  cursor: pointer;
  transition: background .12s;

  &:hover {
    background: hsl(var(--thyuu--color-font, 0 0% 0%) / .05);
  }

  &.is-current {
    color: var(--mp-accent);
    background: hsl(var(--mp-accent-hsl, 355 70% 65%) / .06);
  }
}

/* 歌单卡片样式（在 .music-player-list-item 基础上加点差异） */
.music-player-playlist-card {
  .music-player-playlist-cover {
    border-radius: .5rem;
  }
  .music-player-playlist-count {
    font-variant-numeric: tabular-nums;
    font-size: .78rem;
  }
  .music-player-playlist-arrow {
    margin-left: auto;
    margin-right: .15em;
    color: var(--mp-text-2);
    font-size: .95rem;
    transition: transform .15s, color .15s;
  }
  &:hover .music-player-playlist-arrow {
    transform: translateX(2px);
    color: var(--mp-accent);
  }
  &.is-active {
    .music-player-playlist-arrow {
      color: var(--mp-accent);
    }
  }
}

/* 返回条 */
.music-player-back {
  display: inline-flex;
  align-items: center;
  gap: .25em;
  padding: .25em .55em;
  margin-bottom: .25em;
  align-self: flex-start;
  background: transparent;
  border: 1px solid var(--mp-border);
  border-radius: .4rem;
  color: var(--mp-text-2);
  font-size: .72rem;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    color: var(--mp-text);
    border-color: var(--mp-text-2);
  }

  .iconify {
    font-size: .9rem;
  }
}

.music-player-song-cover {
  position: relative;
  width: calc(var(--spacing, .25rem) * 8);
  height: calc(var(--spacing, .25rem) * 8);
  flex: none;
  border-radius: .5rem;
  overflow: hidden;
  background: hsl(var(--thyuu--color-font, 0 0% 0%) / .08);
  display: flex;
  align-items: center;
  justify-content: center;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.music-player-song-cover-icon {
  font-size: 1.1rem;
  color: var(--mp-text-2);
}

.music-player-song-playing {
  position: absolute;
  inset: 0;
  background: hsl(var(--mp-accent-hsl, 355 70% 65%) / .55);
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 2px;
  padding: 25% 0 25%;

  span {
    display: block;
    width: 2.5px;
    background: #fff;
    border-radius: 1px;
    animation: mp-equalizer 1s ease-in-out infinite;

    &:nth-child(1) { height: 50%; animation-delay: -0.45s; }
    &:nth-child(2) { height: 70%; animation-delay: -0.2s; }
    &:nth-child(3) { height: 40%; animation-delay: -0.6s; }
  }
}

@keyframes mp-equalizer {
  0%, 100% { transform: scaleY(.4); }
  50% { transform: scaleY(1); }
}

.music-player-song-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .05em;
}

.music-player-song-title {
  font-size: .82rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-player-song-artist {
  font-size: .68rem;
  color: var(--mp-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.music-player-song-duration {
  flex: none;
  font-size: .7rem;
  color: var(--mp-text-2);
  font-variant-numeric: tabular-nums;
  min-width: 2.6em;
  text-align: right;
}

/* ==================== 展开/收起动画 ==================== */
.mp-expand-enter-active,
.mp-expand-leave-active {
  transition: max-height .3s ease, opacity .25s ease, margin .3s ease, padding .3s ease;
  overflow: hidden;
}

.mp-expand-enter-from,
.mp-expand-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
  padding-top: 0;
  border-top-color: transparent;
}

.mp-expand-enter-to,
.mp-expand-leave-from {
  max-height: 400px;
  opacity: 1;
}

/* ==================== 骨架屏 ==================== */
.music-player-skeleton {
  display: flex;
  flex-direction: column;
  gap: .6em;
}

.music-player-skeleton-line {
  background: linear-gradient(90deg,
    hsl(var(--thyuu--color-font, 0 0% 0%) / .06) 0%,
    hsl(var(--thyuu--color-font, 0 0% 0%) / .12) 50%,
    hsl(var(--thyuu--color-font, 0 0% 0%) / .06) 100%);
  background-size: 200% 100%;
  border-radius: .35rem;
  animation: mp-shimmer 1.4s ease-in-out infinite;
}

.music-player-skeleton-cover {
  width: 56px;
  height: 56px;
  border-radius: 50%;
}

.music-player-skeleton-title {
  width: 60%;
  height: 1em;
}

.music-player-skeleton-subtitle {
  width: 80%;
  height: .8em;
}

@keyframes mp-shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ==================== 响应式 ==================== */
@media (max-width: 480px) {
  .music-player {
    font-size: 13px;
  }

  .music-player-cover {
    width: 48px;
    height: 48px;
  }

  .music-player-title {
    font-size: .88rem;
  }

  .music-player-list {
    max-height: 180px;
  }
}

@media (prefers-reduced-motion: reduce) {
  .music-player-cover-img.is-spinning,
  .music-player-song-playing span {
    animation: none;
  }
}
</style>
