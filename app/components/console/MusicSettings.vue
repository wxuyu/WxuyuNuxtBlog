<script setup lang="ts">
/**
 * MusicSettings — /console 页面里的「音乐管理」面板
 *
 * 定位：
 *   - 播放器 UI 已迁移到全局 <PlayerFloating />（右下角悬浮）
 *   - 本面板只负责「歌单管理」：浏览所有歌单 + 浏览歌曲 + 切换当前播放歌单
 *   - 点击歌曲 → 触发 FloatingPlayer 的 playAt(i)
 *
 * 数据：复用 useMusicSource / useMusicPlayer 的全局状态
 */
import type { Playlist } from '~/types/music'

const player = useMusicPlayer()
const { currentSong, playlist: currentPlayingList, setPlaylist, playAt } = player

const musicSource = useMusicSource()
const playlists = ref<Playlist[]>([])
const selectedPlaylistId = ref<string | null>(null)
const selectedPlaylist = computed(() =>
  playlists.value.find((p) => p.id === selectedPlaylistId.value) ?? null,
)

type ViewMode = 'playlists' | 'songs'
const view = ref<ViewMode>('playlists')

const loading = ref(true)

async function loadPlaylists() {
  loading.value = true
  try {
    playlists.value = await musicSource.fetchPlaylists()
    if (playlists.value.length > 0 && !selectedPlaylistId.value) {
      selectedPlaylistId.value = playlists.value[0].id
    }
  } catch (e) {
    console.error('[MusicSettings] 加载歌单失败:', e)
  } finally {
    loading.value = false
  }
}

function enterPlaylist(pl: Playlist) {
  selectedPlaylistId.value = pl.id
  view.value = 'songs'
  // 进入时按需补齐前 12 首封面
  const indices = Array.from({ length: Math.min(12, pl.songs.length) }, (_, i) => i)
  enrichSongCovers(pl, indices, { concurrency: 4 }).catch(() => {})
}

function backToPlaylists() {
  view.value = 'playlists'
}

const currentPlaylist = computed(() => selectedPlaylist.value?.songs ?? [])

// 点歌：调用全局播放器。始终先同步歌单（确保 globalPlaylist 匹配），再播放
function playSongAt(pl: Playlist, index: number) {
  // 判断当前全局 playlist 是否就是这首歌所在歌单：比对第一首 id
  const firstSongId = currentPlayingList.value[0]?.id
  if (firstSongId !== pl.songs[0]?.id) {
    // setPlaylist 内部 _loadSong(i, autoPlay=false) 只预加载, 不播放
    setPlaylist(pl.songs, index, pl.id)
  }
  // 无论是否切歌单，最终都要触发 playAt 完成加载+播放+UI 更新
  playAt(index)
}

onMounted(loadPlaylists)
</script>

<template>
  <div class="has-border">
    <div class="music-settings">
      <Transition name="ms-fade" mode="out-in">
        <!-- 加载中 -->
        <div v-if="loading" key="loading" class="ms-loading">
          <Icon name="ph:circle-notch" class="ms-spin" />
          <span>加载歌单中…</span>
        </div>

        <!-- 歌单列表 -->
        <div v-else-if="view === 'playlists'" key="playlists" class="ms-list">
          <div
            v-for="pl in playlists"
            :key="pl.id"
            :class="['ms-item', 'ms-playlist-card', { 'is-active': selectedPlaylistId === pl.id }]"
            @click="enterPlaylist(pl)"
          >
            <div class="ms-cover ms-playlist-cover">
              <NuxtImg
                v-if="pl.cover"
                :src="pl.cover"
                :alt="pl.name"
                width="56"
                height="56"
                loading="lazy"
              />
              <Icon v-else name="ph:playlist" class="ms-cover-icon" />
            </div>
            <div class="ms-info">
              <span class="ms-title">{{ pl.name }}</span>
              <span class="ms-artist">{{ pl.desc || `${pl.songs.length} 首` }}</span>
            </div>
            <span class="ms-count">{{ pl.songs.length }} 首</span>
            <Icon name="ph:caret-right" class="ms-arrow" />
          </div>
          <div v-if="playlists.length === 0" class="ms-empty">
            <Icon name="ph:playlist" />
            <span class="ms-empty-title">暂无歌单</span>
            <span class="ms-empty-desc">请在 app.config.ts → music.api 配置歌单 ID</span>
          </div>
        </div>

        <!-- 歌曲列表 -->
        <div v-else key="songs" class="ms-songs-view">
          <button class="ms-back" @click="backToPlaylists">
            <Icon name="ph:caret-left" />
            <span>返回歌单列表</span>
          </button>
          <div class="ms-list">
            <div
              v-for="(song, i) in currentPlaylist"
              :key="song.id"
              :class="['ms-item', { 'is-current': currentSong?.id === song.id }]"
              @click="playSongAt(selectedPlaylist!, i)"
            >
              <div class="ms-cover">
                <NuxtImg
                  v-if="song.cover || selectedPlaylist?.cover"
                  :src="song.cover || selectedPlaylist!.cover"
                  :alt="song.title"
                  width="48"
                  height="48"
                  loading="lazy"
                />
                <Icon v-else name="ph:music-notes" class="ms-cover-icon" />
              </div>
              <div class="ms-info">
                <span class="ms-title">{{ song.title }}</span>
                <span class="ms-artist">{{ song.artist }}</span>
              </div>
              <span v-if="song.duration" class="ms-duration">
                {{ Math.floor(song.duration / 60) }}:{{ String(song.duration % 60).padStart(2, '0') }}
              </span>
              <Icon name="ph:play" class="ms-play-icon" />
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.music-settings {
  display: flex;
  flex-direction: column;
  gap: .6rem;
  padding: 1rem 1.1rem;
  border-radius: .8rem;
  border: 1px solid var(--c-border, hsl(0 0% 88%));
  min-height: 160px;

  .dark & {
    border-color: hsl(0 0% 22%);
  }
}

.ms-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5rem;
  padding: 2rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  font-size: .85rem;
}

.ms-spin {
  font-size: 1.5rem;
  animation: ms-spin 1s linear infinite;
}

@keyframes ms-spin {
  to { transform: rotate(360deg); }
}

.ms-songs-view {
  display: flex;
  flex-direction: column;
  gap: .4rem;
}

.ms-back {
  display: inline-flex;
  align-items: center;
  gap: .25rem;
  padding: .3rem .65rem;
  align-self: flex-start;
  background: transparent;
  border: 1px solid var(--c-border, hsl(0 0% 88%));
  border-radius: .4rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  font-size: .72rem;
  cursor: pointer;
  transition: all .15s;

  &:hover {
    color: var(--c-text);
    border-color: var(--c-text-2);
  }
}

.ms-list {
  display: flex;
  flex-direction: column;
  gap: .15rem;
  max-height: 420px;
  overflow-y: auto;
  scrollbar-width: thin;

  &::-webkit-scrollbar { width: 4px; }
  &::-webkit-scrollbar-thumb {
    background: var(--c-border, hsl(0 0% 88%));
    border-radius: 2px;
  }
}

.ms-item {
  display: flex;
  align-items: center;
  gap: .65rem;
  padding: .4rem .45rem;
  border-radius: .55rem;
  cursor: pointer;
  transition: background .12s;

  &:hover {
    background: hsl(0 0% 0% / .05);
    .ms-arrow { transform: translateX(2px); color: var(--c-primary, hsl(355 70% 65%)); }
    .ms-play-icon { color: var(--c-primary, hsl(355 70% 65%)); }
  }

  &.is-current {
    color: var(--c-primary, hsl(355 70% 65%));
    background: hsl(355 70% 65% / .06);
  }
}

.ms-playlist-card .ms-playlist-cover {
  border-radius: .55rem;
}

.ms-cover {
  width: 56px;
  height: 56px;
  flex: none;
  border-radius: .55rem;
  overflow: hidden;
  background: hsl(0 0% 0% / .08);
  display: flex;
  align-items: center;
  justify-content: center;

  img { width: 100%; height: 100%; object-fit: cover; }
}

.ms-cover-icon {
  font-size: 1.3rem;
  color: var(--c-text-2, hsl(0 0% 45%));
}

.ms-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: .05rem;
}

.ms-title {
  font-size: .88rem;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-artist {
  font-size: .72rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.ms-count,
.ms-duration {
  flex: none;
  font-size: .74rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  font-variant-numeric: tabular-nums;
}

.ms-arrow {
  flex: none;
  margin-left: auto;
  margin-right: .15rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  font-size: .95rem;
  transition: transform .15s, color .15s;
}

.ms-play-icon {
  flex: none;
  margin-left: auto;
  margin-right: .15rem;
  color: var(--c-text-2, hsl(0 0% 45%));
  font-size: .85rem;
  transition: color .15s;
}

.ms-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .45rem;
  padding: 2rem;
  text-align: center;
  color: var(--c-text-2, hsl(0 0% 45%));

  svg { font-size: 2rem; opacity: .4; }
}

.ms-empty-title {
  font-size: .92rem;
  font-weight: 600;
  color: var(--c-text);
}

.ms-empty-desc {
  font-size: .75rem;
  line-height: 1.4;
  opacity: .7;
}

.ms-fade-enter-active,
.ms-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
}

.ms-fade-enter-from,
.ms-fade-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>