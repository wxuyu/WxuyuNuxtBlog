<script setup lang="ts">
/**
 * FloatingPlayer — 全局悬浮音乐条
 *
 * 架构定位：
 *   - 全局唯一：挂在 app.vue，所有页面共享（/console 路由除外）
 *   - 跨页面播放持续：useMusicPlayer 是全局单例，UI 销毁不影响 Audio
 *   - 跨刷新恢复：applyResume + localStorage 持久化（已实现）
 *
 * 视觉设计（Heo 风格）：
 *   - 固定在屏幕左下角（bottom: 1.25rem; left: 1.25rem）
 *   - 折叠态 mini：封面 + 标题 + 艺人 + 进度背景填充 + 播放
 *   - 展开态 expanded：封面 + 标题 + 当前歌词 + prev/play/next/playlist 四按钮
 *   - 进度背景填充：整个胶囊背景色随进度走（linear-gradient + --fp-progress）
 *   - 触摸/悬停态：背景变浅 + 模糊加强
 *   - 歌单选择：展开态下点 playlist 按钮弹窗（useModalStore + LazyConsoleMusicSettings）
 *   - 移动端：不渲染，由 WidgetMusicPlayer widget 接管
 *
 * 注意：
 *   - 不要在客户端 initial-fetch 阶段直接调 play()，遵守 autoplay policy
 *   - useMusicPlayer 的 _userInteracted 守卫确保未交互时不播放
 */
import type { Playlist } from '~/types/music'
import { LazyConsoleMusicSettings, LazyPopoverMyDialog } from '#components'

const route = useRoute()
const player = useMusicPlayer()
const {
  isPlaying, currentSong,
  progressPercent,
  togglePlay, playNext, playPrev,
  currentLyric,
  setPlaylist, applyResume,
} = player

const appConfig = useAppConfig()
const musicConfig = appConfig.music ?? { source: 'local' }

// --- 数据源 ---
const musicSource = useMusicSource()
const playlists = ref<Playlist[]>([])
const selectedPlaylistId = ref<string | null>(null)

const hasSong = computed(() => currentSong.value !== null)
const isReady = computed(() => playlists.value.length > 0)

// --- 歌单数据加载 ---
const loading = ref(true)

async function loadPlaylists() {
  loading.value = true
  try {
    const list = await musicSource.fetchPlaylists()
    playlists.value = list
    if (list.length > 0 && !selectedPlaylistId.value) {
      const persisted = readPersistedState()
      const match = persisted ? list.find((p) => p.id === persisted.playlistId) : null
      if (match && persisted) {
        selectedPlaylistId.value = match.id
        const ok = applyResume(match.songs, match.id, {
          persistedSongId: persisted.songId,
          persistedTime: persisted.currentTime,
          persistedMode: persisted.mode as any,
        })
        if (!ok) setPlaylist(match.songs, 0, match.id)
      } else {
        selectedPlaylistId.value = list[0].id
        setPlaylist(list[0].songs, 0, list[0].id)
      }
    }
  } catch (e) {
    console.error('[FloatingPlayer] 加载歌单失败:', e)
  } finally {
    loading.value = false
  }
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

// --- 进度背景填充（取代独立进度条） ---
// 进度 0–100 作为 CSS 变量供 background linear-gradient 使用
const progressPct = computed(() => {
  const p = progressPercent.value
  return Math.max(0, Math.min(100, Number.isFinite(p) ? p : 0))
})

// --- 歌单选择弹窗（useModalStore + LazyConsoleMusicSettings） ---
// 与 LazyWidgetMusicPlayer 区分：弹窗打开 console 路由的 MusicSettings 歌单管理面板
// LazyWidgetMusicPlayer：移动端 widget，仅显示当前播放 + 播放/下一首
// LazyConsoleMusicSettings：歌单管理面板，可浏览所有歌单 + 切换播放列表
// 注意：用 @bikariya/modals 的 useModalStore（app.vue 已挂 <BikariyaModals />），
// 不用本项目自己的 usePopoverStore（孤儿 store，没有渲染层，弹窗打不开）。
const modalStore = useModalStore()
const {
  open: openPlaylistModal,
  close: closePlaylistModal,
} = modalStore.use(() => h(LazyPopoverMyDialog, {
  onClose: () => closePlaylistModal(),
}), {
  unique: true,
  duration: 200,
})

// --- 生命周期 ---
onMounted(() => {
  player.mount({
    defaultVolume: musicConfig.defaultVolume,
    defaultMode: musicConfig.defaultMode,
  })
  loadPlaylists()
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', onKeydown)
})

// 当前路由 = /console 时不显示悬浮条
const visible = computed(() => route.path !== '/console')

// 移动端：不渲染（由 widget 接管）
const MOBILE_BREAKPOINT = 768
const isMobile = ref(false)
function checkMobile() {
  if (typeof window === 'undefined') return
  isMobile.value = window.innerWidth < MOBILE_BREAKPOINT
}
const showFloating = computed(() => !isMobile.value)

// --- 展开/折叠 ---
const expanded = ref(false)
const isTouching = ref(false)
function toggleExpanded() {
  expanded.value = !expanded.value
}
// 自动收起：路由变化 / ESC
watch(() => route.path, () => { expanded.value = false })
function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && expanded.value) expanded.value = false
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fp-fade">
      <div
        v-if="visible && (isReady || loading) && showFloating"
        class="floating-player"
        :class="{ 'is-expanded': expanded, 'is-touch': isTouching }"
        :style="{ '--fp-progress': progressPct + '%' }"
        @click="toggleExpanded"
        @mouseenter="isTouching = true"
        @mouseleave="isTouching = false"
      >
        <!-- ==================== 主体胶囊（mini / expanded 共享） ==================== -->
        <div class="fp-bar">
          <!-- 左侧：封面 + 标题/歌词 -->
          <div class="fp-info">
            <div class="fp-cover">
              <NuxtImg
                v-if="hasSong && currentSong!.cover"
                :src="currentSong!.cover"
                :alt="currentSong!.title"
                width="40"
                height="40"
                class="fp-cover-img"
                :class="{ 'is-spinning': isPlaying }"
                loading="eager"
              />
              <div v-else class="fp-cover-placeholder">
                <Icon name="ph:music-notes-fill" />
              </div>
            </div>
            <div class="fp-meta">
              <!-- mini 态：标题 + 艺人 -->
              <template v-if="!expanded">
                <span class="fp-title">{{ hasSong ? currentSong!.title : '未选择歌曲' }}</span>
                <span class="fp-artist">{{ hasSong ? currentSong!.artist : '' }}</span>
              </template>
              <!-- expanded 态：标题 + 当前歌词 -->
              <template v-else>
                <span class="fp-title">{{ hasSong ? currentSong!.title : '未选择歌曲' }}</span>
                <span class="fp-lyric" :class="{ 'is-empty': !currentLyric }">
                  {{ currentLyric || (hasSong ? '♪ 暂无歌词' : '选择歌单后开始播放') }}
                </span>
              </template>
            </div>
          </div>

          <!-- 右侧：控制按钮 -->
          <!-- mini 态：仅播放 -->
          <!-- expanded 态：prev / play / next / playlist 四按钮 -->
          <div class="fp-controls">
            <button
              v-if="expanded"
              class="fp-ctrl-btn fp-prev-btn"
              @click.stop="playPrev"
              :disabled="!hasSong"
              title="上一首"
              aria-label="上一首"
            >
              <Icon name="ph:skip-back-fill" />
            </button>
            <button
              class="fp-ctrl-btn fp-play-btn"
              @click.stop="togglePlay"
              :disabled="!hasSong"
              :title="isPlaying ? '暂停' : '播放'"
              :aria-label="isPlaying ? '暂停' : '播放'"
            >
              <Icon :name="isPlaying ? 'ph:pause-fill' : 'ph:play-fill'" />
            </button>
            <button
              v-if="expanded"
              class="fp-ctrl-btn fp-next-btn"
              @click.stop="playNext"
              :disabled="!hasSong"
              title="下一首"
              aria-label="下一首"
            >
              <Icon name="ph:skip-forward-fill" />
            </button>
            <Button
              v-if="expanded"
              class="fp-ctrl-btn fp-playlist-btn"
              @click.stop="openPlaylistModal"
              :disabled="!isReady"
              title="选择歌单"
              aria-label="选择歌单"
            >
              <Icon name="ph:list-music" />
            </Button>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style lang="scss" scoped>
/* ==================== Heo 风格 + 进度背景填充 ====================
   - mini：窄长胶囊，仅播放按钮
   - expanded：同容器变宽，prev/play/next/playlist 四按钮 + 歌词行
   - is-touch：背景变浅 + 模糊加强 + 进度填充更明显
   - 进度背景填充：胶囊背景由 --fp-progress 控制填充宽度
*/
.floating-player {
  --fp-bg: hsl(0 0% 100% / .88);
  --fp-bg-touch: hsl(0 0% 100% / .96);
  --fp-bg-progress: hsl(355 70% 62% / .28);
  --fp-bg-progress-touch: hsl(355 70% 62% / .42);
  --fp-border: hsl(0 0% 86%);
  --fp-border-touch: hsl(0 0% 78%);
  --fp-text: hsl(0 0% 14%);
  --fp-text-2: hsl(0 0% 48%);
  --fp-accent: hsl(355 70% 62%);
  --fp-radius: 1.75rem;
  --fp-shadow:
    0 8px 28px hsl(220 30% 8% / .14),
    0 2px 6px hsl(220 30% 8% / .08);
  --fp-blur: blur(18px) saturate(160%);
  --fp-blur-touch: blur(28px) saturate(180%);
  /* 进度填充由行内样式提供（--fp-progress） */
  --fp-progress: 0%;

  position: fixed;
  z-index: 9999;
  pointer-events: none;
  font-size: 14px;
  left: 1.25rem;
  bottom: 1.25rem;
  top: auto;
  right: auto;
  transition:
    bottom .25s cubic-bezier(.34, 1.2, .64, 1),
    opacity .25s ease;

  .dark & {
    --fp-bg: hsl(220 18% 12% / .72);
    --fp-bg-touch: hsl(220 22% 18% / .82);
    --fp-bg-progress: hsl(355 78% 70% / .35);
    --fp-bg-progress-touch: hsl(355 78% 70% / .5);
    --fp-border: hsl(220 14% 24% / .6);
    --fp-border-touch: hsl(220 14% 32% / .8);
    --fp-text: hsl(0 0% 96%);
    --fp-text-2: hsl(0 0% 70%);
    --fp-accent: hsl(355 78% 70%);
    --fp-shadow:
      0 10px 32px hsl(220 40% 4% / .55),
      0 2px 6px hsl(220 40% 4% / .35);
  }
}

/* ==================== 胶囊主体（mini + expanded 共享） ==================== */
.fp-bar {
  position: relative;
  pointer-events: auto;

  /* 背景：底层纯色 + 顶部进度填充层（从左到右覆盖） */
  background:
    linear-gradient(to right,
      var(--fp-bg-progress) 0,
      var(--fp-bg-progress) var(--fp-progress, 0%),
      transparent var(--fp-progress, 0%),
      transparent 100%),
    var(--fp-bg);
  backdrop-filter: var(--fp-blur);
  -webkit-backdrop-filter: var(--fp-blur);
  border: 1px solid var(--fp-border);
  border-radius: var(--fp-radius);
  box-shadow: var(--fp-shadow);
  padding: .4rem .6rem;
  width: min(280px, calc(100vw - 2rem));
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: .6rem;
  min-width: 0;

  transition:
    width .3s cubic-bezier(.34, 1.2, .64, 1),
    background-color .2s ease,
    border-color .2s ease,
    backdrop-filter .25s ease,
    -webkit-backdrop-filter .25s ease,
    box-shadow .25s ease;

  /* expanded 态：容器变宽 */
  .is-expanded & {
    width: min(420px, calc(100vw - 2rem));
  }

  /* touch 态：背景变浅 + 模糊加强 + 边框加深 + 进度填充更明显 */
  .is-touch & {
    background:
      linear-gradient(to right,
        var(--fp-bg-progress-touch) 0,
        var(--fp-bg-progress-touch) var(--fp-progress, 0%),
        var(--fp-bg-touch) var(--fp-progress, 0%),
        var(--fp-bg-touch) 100%);
    backdrop-filter: var(--fp-blur-touch);
    -webkit-backdrop-filter: var(--fp-blur-touch);
    border-color: var(--fp-border-touch);
    box-shadow:
      0 12px 36px hsl(220 30% 8% / .18),
      0 3px 8px hsl(220 30% 8% / .10);
  }
  .dark.is-touch & {
    box-shadow:
      0 14px 40px hsl(220 40% 4% / .65),
      0 3px 8px hsl(220 40% 4% / .4);
  }
}

/* ==================== 信息区（封面 + 标题/歌词） ==================== */
.fp-info {
  display: flex;
  align-items: center;
  gap: .55rem;
  min-width: 0;
  flex: 1;
}

.fp-cover {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  flex: none;
  background:
    radial-gradient(circle at 30% 30%,
      hsl(220 30% 30% / .85),
      hsl(220 30% 10% / .95) 70%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px hsl(0 0% 0% / .18);

  .dark & {
    background:
      radial-gradient(circle at 30% 30%,
        hsl(220 30% 40% / .9),
        hsl(220 30% 12% / .98) 70%);
  }
}

.fp-cover-img {
  width: 100%;
  height: 100%;
  object-fit: cover;

  &.is-spinning {
    animation: fp-spin 14s linear infinite;
  }
}

.fp-cover-placeholder {
  color: var(--fp-text-2);
  font-size: 1.15rem;
}

.fp-meta {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}

.fp-title {
  font-size: .82rem;
  font-weight: 600;
  color: var(--fp-text);
  letter-spacing: .01em;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color .25s ease;
}

.fp-artist {
  font-size: .68rem;
  color: var(--fp-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  transition: color .25s ease;
}

/* expanded 态下的歌词行（取代独立进度条） */
.fp-lyric {
  font-size: .68rem;
  color: var(--fp-text-2);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
  letter-spacing: .01em;
  transition: color .25s ease;

  &.is-empty {
    opacity: .55;
    font-style: italic;
  }
}

/* ==================== 控制按钮组 ==================== */
.fp-controls {
  display: flex;
  align-items: center;
  gap: .15rem;
  flex: none;
}

.fp-ctrl-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  flex: none;
  border: none;
  border-radius: 50%;
  background: hsl(0 0% 0% / .08);
  color: var(--fp-text);
  cursor: pointer;
  transition:
    background .15s,
    transform .12s,
    box-shadow .15s,
    width .25s cubic-bezier(.34, 1.2, .64, 1),
    height .25s cubic-bezier(.34, 1.2, .64, 1);

  .dark & {
    background: hsl(0 0% 100% / .10);
    color: var(--fp-text);
  }

  &:hover:not(:disabled) {
    background: hsl(0 0% 0% / .14);
    box-shadow: 0 0 0 6px hsl(0 0% 0% / .04);

    .dark & {
      background: hsl(0 0% 100% / .18);
      box-shadow: 0 0 0 6px hsl(0 0% 100% / .04);
    }
  }
  &:active:not(:disabled) {
    transform: scale(.92);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: .45;
  }
}

/* 播放按钮：mini 时 34px、expanded 时微放大 */
.fp-play-btn {
  width: 34px;
  height: 34px;
  font-size: 1rem;

  .is-expanded & {
    width: 36px;
    height: 36px;
    font-size: 1.05rem;
  }
}

/* prev / next / playlist 按钮：仅 expanded 时显示，加入淡入动画 */
.fp-prev-btn,
.fp-next-btn,
.fp-playlist-btn {
  width: 32px;
  height: 32px;
  font-size: .95rem;
  animation: fp-btn-in .25s ease both;
}

/* playlist 按钮 hover 加色（与 prev/next 区分） */
.fp-playlist-btn {
  &:hover:not(:disabled) {
    background: var(--fp-accent);
    color: #fff;
    box-shadow: 0 0 0 6px hsl(355 70% 62% / .12);

    .dark & {
      background: var(--fp-accent);
      color: hsl(220 20% 8%);
      box-shadow: 0 0 0 6px hsl(355 78% 70% / .14);
    }
  }
}

@keyframes fp-btn-in {
  from { opacity: 0; transform: translateX(4px) scale(.85); }
  to   { opacity: 1; transform: translateX(0) scale(1); }
}

/* ==================== 动画 ==================== */
@keyframes fp-spin {
  to { transform: rotate(360deg); }
}

.fp-fade-enter-active,
.fp-fade-leave-active {
  transition: opacity .25s ease, transform .25s ease;
}
.fp-fade-enter-from,
.fp-fade-leave-to {
  opacity: 0;
  transform: translateY(8px);
}

/* ==================== 响应式 ==================== */
@media (max-width: 480px) {
  .fp-bar { width: calc(100vw - 2rem); }
  .is-expanded .fp-bar { width: calc(100vw - 2rem); }
}

@media (prefers-reduced-motion: reduce) {
  .fp-cover-img.is-spinning { animation: none; }
  .fp-prev-btn,
  .fp-next-btn,
  .fp-playlist-btn { animation: none; }
}
</style>