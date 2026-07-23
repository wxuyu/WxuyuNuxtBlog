// composables/useMusicPlayer.ts — 音乐播放引擎（全局单例）
import type { Song, Playlist, LrcLine, PlayMode, PlayerStatus } from '~/types/music'
import { PlayMode as PM, PlayerStatus as PS } from '~/types/music'

// ===================== 持久化键 =====================
const STORAGE_KEY = 'sxiaohe-music-player-state-v1'
const STORAGE_VERSION = 1

interface PersistedState {
  v: number
  playlistId: string | null
  songId: string | null
  currentTime: number
  mode: PlayMode
  volume: number
  updatedAt: number
}

function loadPersistedState(): PersistedState | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as PersistedState
    if (parsed.v !== STORAGE_VERSION) return null
    return parsed
  } catch {
    return null
  }
}

function savePersistedState(state: Partial<PersistedState>) {
  if (typeof window === 'undefined') return
  try {
    const prev = loadPersistedState()
    const merged: PersistedState = {
      v: STORAGE_VERSION,
      playlistId: state.playlistId ?? prev?.playlistId ?? null,
      songId: state.songId ?? prev?.songId ?? null,
      currentTime: state.currentTime ?? prev?.currentTime ?? 0,
      mode: state.mode ?? prev?.mode ?? PM.REPEAT_ALL,
      volume: state.volume ?? prev?.volume ?? 0.7,
      updatedAt: Date.now(),
    }
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch {
    // quota / privacy mode — ignore
  }
}

function clearPersistedState() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
  } catch {}
}

// ===================== 全局单例 =====================
let audio: HTMLAudioElement | null = null
let globalPlaylist: Song[] = []
let globalIndex = 0
let globalMode: PlayMode = PM.REPEAT_ALL
let globalVolume = 0.7
let globalStatus: PlayerStatus = PS.STOPPED

// 模块级广播：当音频自然结束/出错时通知所有已挂载的 player 实例
const endedListeners: Array<() => void> = []
function notifyEnded() {
  for (const cb of endedListeners) {
    try {
      cb()
    } catch (e) {
      console.warn('[MusicPlayer] ended listener error:', e)
    }
  }
}

const globalStatusRef = ref<PlayerStatus>(PS.STOPPED)
const isPlaying = computed(() => globalStatusRef.value === PS.PLAYING)

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio()
    // 默认不预加载，等待用户首次交互后再预加载 metadata（避免偷偷报流量）
    audio.preload = 'none'
    audio.volume = globalVolume
    audio.crossOrigin = 'anonymous'

    audio.addEventListener('play', () => {
      globalStatus = PS.PLAYING
      globalStatusRef.value = PS.PLAYING
    })
    audio.addEventListener('pause', () => {
      if (audio && !audio.ended) {
        globalStatus = PS.PAUSED
        globalStatusRef.value = PS.PAUSED
      }
    })
    audio.addEventListener('ended', () => {
      globalStatus = PS.STOPPED
      globalStatusRef.value = PS.STOPPED
      // 单曲循环：重置 currentTime 重播
      if (globalMode === PM.REPEAT_ONE) {
        audio!.currentTime = 0
        audio!.play().catch(() => {})
        globalStatus = PS.PLAYING
        globalStatusRef.value = PS.PLAYING
        return
      }
      notifyEnded()
    })
    audio.addEventListener('error', () => {
      console.warn('[MusicPlayer] 播放出错, 跳过当前曲目:', audio?.src)
      notifyEnded()
    })
  }
  return audio
}

// ===================== Shuffle =====================
let shuffledIndices: number[] = []
let shuffleOriginIndex = 0

function buildShuffledOrder() {
  const n = globalPlaylist.length
  if (n === 0) {
    shuffledIndices = []
    return
  }
  // Fisher-Yates
  shuffledIndices = Array.from({ length: n }, (_, i) => i)
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffledIndices[i], shuffledIndices[j]] = [shuffledIndices[j], shuffledIndices[i]]
  }
  // 当前播放的排第一
  const curIdx = shuffledIndices.indexOf(globalIndex)
  if (curIdx > 0) {
    [shuffledIndices[0], shuffledIndices[curIdx]] = [shuffledIndices[curIdx], shuffledIndices[0]]
  }
  shuffleOriginIndex = 0
}

function getNextIndex(forward = true): number {
  if (globalPlaylist.length === 0) return 0

  if (globalMode === PM.SHUFFLE) {
    if (shuffledIndices.length !== globalPlaylist.length) {
      buildShuffledOrder()
    }
    shuffleOriginIndex = forward
      ? (shuffleOriginIndex + 1) % shuffledIndices.length
      : (shuffleOriginIndex - 1 + shuffledIndices.length) % shuffledIndices.length
    return shuffledIndices[shuffleOriginIndex]
  }

  if (globalMode === PM.REPEAT_ONE) {
    // playNext 上面已处理，剩余调用（主要是 compat）返回当前
    return globalIndex
  }

  // REPEAT_ALL
  return forward
    ? (globalIndex + 1) % globalPlaylist.length
    : (globalIndex - 1 + globalPlaylist.length) % globalPlaylist.length
}

// ===================== LRC =====================
function parseLrc(raw: string): LrcLine[] {
  const lines: LrcLine[] = []
  const tagRe = /^\[(\d{2}):(\d{2})\.(\d{2,3})\]/
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(tagRe)
    if (!m) continue
    const min = parseInt(m[1], 10)
    const sec = parseInt(m[2], 10)
    const ms = parseInt(m[3], 10) * (m[3].length === 2 ? 10 : 1)
    lines.push({
      time: min * 60 + sec + ms / 1000,
      text: line.replace(tagRe, '').trim(),
    })
  }
  return lines.sort((a, b) => a.time - b.time)
}

// ===================== 导出的 Composables =====================
export function useMusicPlayer() {
  // --- 响应式状态 ---
  const status = ref<PlayerStatus>(globalStatus)
  const currentSong = ref<Song | null>(null)
  const currentTime = ref(0)
  const duration = ref(0)
  const volume = ref(globalVolume)
  const mode = ref<PlayMode>(globalMode)
  const currentLyric = ref('')
  const lrcLines = ref<LrcLine[]>([])
  const lrcIndex = ref(-1)
  const playlist = ref<Song[]>([...globalPlaylist])
  const buffered = ref(0)

  // 同步状态
  const syncState = () => {
    const a = getAudio()
    status.value = globalStatus
    currentTime.value = a.currentTime
    duration.value = a.duration || 0
    volume.value = a.volume
    mode.value = globalMode
    playlist.value = [...globalPlaylist]
    if (globalPlaylist[globalIndex]) {
      currentSong.value = { ...globalPlaylist[globalIndex] }
    }
    // buffered
    if (a.buffered.length > 0) {
      buffered.value = a.buffered.end(a.buffered.length - 1)
    }
  }

  // timeupdate → lrc match
  const onTimeUpdate = () => {
    const a = getAudio()
    currentTime.value = a.currentTime
    duration.value = a.duration || 0
    if (a.buffered.length > 0) {
      buffered.value = a.buffered.end(a.buffered.length - 1)
    }

    // 进度持久化：每 3 秒写入一次（节流） + 切歌/暂停时强制写
    if (currentSong.value && _userInteracted) {
      const now = Date.now()
      if (now - _lastPersistAt > 3000 || currentTime.value < 0.5) {
        _lastPersistAt = now
        savePersistedState({
          playlistId: _currentPlaylistId,
          songId: currentSong.value.id,
          currentTime: currentTime.value,
          mode: globalMode,
          volume: volume.value,
        })
      }
    }

    // LRC 匹配（优化：从上次 idx 开始正向扫，避免每帧从末尾 0(n) 查找）
    const lines = lrcLines.value
    if (lines.length === 0) return
    const cur = a.currentTime
    let idx = lrcIndex.value
    if (idx < 0 || idx >= lines.length || cur < lines[idx].time) {
      // 倒找：时间回退 / 初始化 / 切歌
      idx = -1
      for (let i = 0; i < lines.length; i++) {
        if (cur >= lines[i].time) idx = i
        else break
      }
    } else {
      // 正找：时间前进，从 idx+1 开始扫
      while (idx + 1 < lines.length && cur >= lines[idx + 1].time) {
        idx++
      }
    }
    if (idx !== lrcIndex.value) {
      lrcIndex.value = idx
      currentLyric.value = idx >= 0 ? lines[idx].text : ''
    }
  }

  // --- 播放控制 ---
  // 一次性绑定: src 设完后等 canplay 再 play，避免 preload='none' + 立即 play 被拒绝
  // 改进：每次 _loadSong 先取消上一轮未触发 canplay 的 handler，避免上次加载失败时本轮也卡住
  let _pendingCanPlayHandler: (() => void) | null = null
  function _waitCanPlayThenPlay() {
    const a = getAudio()
    if (_pendingCanPlayHandler) {
      a.removeEventListener('canplay', _pendingCanPlayHandler)
      a.removeEventListener('loadedmetadata', _pendingCanPlayHandler)
      _pendingCanPlayHandler = null
    }
    if (a.readyState >= 3 /* HAVE_FUTURE_DATA */) {
      play()
      return
    }
    const onCanPlay = () => {
      if (_pendingCanPlayHandler === onCanPlay) {
        a.removeEventListener('canplay', onCanPlay)
        a.removeEventListener('loadedmetadata', onCanPlay)
        _pendingCanPlayHandler = null
      }
      play()
    }
    _pendingCanPlayHandler = onCanPlay
    a.addEventListener('canplay', onCanPlay, { once: true })
    a.addEventListener('loadedmetadata', onCanPlay, { once: true })
  }

  // 记录当前正在解析的 index，多个 _loadSong 并发时只取最后一次
  let _loadingIndex = -1

  async function _loadSong(index: number) {
    if (index < 0 || index >= globalPlaylist.length) return
    globalIndex = index
    _loadingIndex = index
    const song = globalPlaylist[index]
    const a = getAudio()

    // 0. 优先拿真实封面 URL（QQ 场景下 song.cover 是 /api/song/cover JSON 端点，
    //    需调 resolveCover 拆出真实图片 URL；网易云 / 本地 不需这一步）
    let realCover = song.cover
    try {
      const source = useMusicSource()
      const coverUrl = await source.resolveCover(song.id)
      if (_loadingIndex !== index) return // 被新的 _loadSong 抢占，丢弃结果
      if (coverUrl) realCover = coverUrl
    }
    catch (e) {
      // 封面解析失败保持原值
    }

    // 1. 拿真实播放 URL（本地歌单 song.url 已填；API 歌单需调 resolveSongUrl）
    let realUrl = song.url
    if (!realUrl) {
      try {
        const source = useMusicSource()
        realUrl = await source.resolveSongUrl(song.id)
        if (_loadingIndex !== index) return
      }
      catch (e) {
        console.warn('[useMusicPlayer] 歌曲 URL 解析失败:', e)
      }
    }

    // 2. 拿真实 LRC 文本（本地可能填了 LRC URL，API 需调 fetchLyric）
    let realLrc = song.lrc
    if (!realLrc) {
      try {
        const source = useMusicSource()
        realLrc = await source.fetchLyric(song.id)
        if (_loadingIndex !== index) return
      }
      catch (e) {
        // 歌词解析失败静默
      }
    }

    // 3. 用解析后的真实数据更新全局 state
    const resolvedSong: Song = {
      ...song,
      cover: realCover || song.cover,
      url: realUrl,
      lrc: realLrc,
    }
    // 反向写回 globalPlaylist，下一首 / seek / 重读时不会重复解析
    // 但仅当仍是当前选中的 index 才写，避免覆盖新点击的歌曲
    if (_loadingIndex === index) {
      globalPlaylist[index] = resolvedSong
      currentSong.value = { ...resolvedSong }
      playlist.value = [...globalPlaylist]
    }

    // 再次抢占检查：set src 前最终确认
    if (_loadingIndex !== index) return

    a.src = realUrl
    a.load()

    // 4. 加载歌词
    lrcLines.value = []
    lrcIndex.value = -1
    currentLyric.value = ''
    if (realLrc) {
      if (realLrc.startsWith('[')) {
        // 原始 LRC 文本
        lrcLines.value = parseLrc(realLrc)
      } else if (/^https?:\/\//i.test(realLrc)) {
        // LRC URL，异步加载
        fetch(realLrc)
          .then((r) => r.text())
          .then((text) => {
            if (_loadingIndex === index) lrcLines.value = parseLrc(text)
          })
          .catch(() => {})
      } else {
        // 其他原始文本也试一下 parse
        lrcLines.value = parseLrc(realLrc)
      }
    }

    // 等待可播放后再 play，绕过 preload='none' 下 readyState 不足导致的 autoplay 失败
    _waitCanPlayThenPlay()
  }

  function play() {
    const a = getAudio()
    if (!a.src && globalPlaylist.length > 0) {
      _loadSong(globalIndex)
      return
    }
    // 未经过用户主动交互：拒绝调用 play()，以遵守浏览器 autoplay policy。
    // 仅预加载 metadata，不自动播放。
    if (!_userInteracted) {
      if (a.preload === 'none') a.preload = 'metadata'
      a.load().catch(() => {})
      return
    }
    a.play().catch(() => {})
  }

  function pause() {
    getAudio().pause()
    // 主动暂停：记录当前进度以便恢复
    if (currentSong.value) {
      savePersistedState({
        playlistId: _currentPlaylistId,
        songId: currentSong.value.id,
        currentTime: currentTime.value,
        mode: globalMode,
        volume: volume.value,
      })
    }
  }

  function togglePlay() {
    // 用户点播放/暂停按钮 = 主动交互
    markUserInteracted()
    globalStatus === PS.PLAYING ? pause() : play()
  }

  function playNext() {
    // 单曲循环：重置 currentTime 重播
    if (globalMode === PM.REPEAT_ONE) {
      const a = getAudio()
      a.currentTime = 0
      a.play().catch(() => {})
      return
    }
    _loadSong(getNextIndex(true))
  }

  function playPrev() {
    const a = getAudio()
    // 播放超过 3 秒 → 重头开始
    if (a.currentTime > 3) {
      a.currentTime = 0
      return
    }
    _loadSong(getNextIndex(false))
  }

  function playAt(index: number) {
    // 用户点歌本就是主动交互，标记以便后续调用 play() 不会拒绝
    markUserInteracted()
    if (globalMode === PM.SHUFFLE) {
      buildShuffledOrder()
    }
    _loadSong(index)
  }

  function seek(time: number) {
    if (isNaN(time)) return
    getAudio().currentTime = Math.max(0, Math.min(time, duration.value || 0))
  }

  function setVolume(v: number) {
    const val = Math.max(0, Math.min(1, v))
    globalVolume = val
    getAudio().volume = val
    volume.value = val
    // 音量变化不频繁，直接写
    if (_userInteracted) {
      savePersistedState({ volume: val })
    }
  }

  // 记录静音前的音量，以便取消静音时恢复
  let volumeBeforeMute = 0.7

  function toggleMute() {
    const a = getAudio()
    if (a.volume > 0) {
      volumeBeforeMute = a.volume
      setVolume(0)
    } else {
      // 取消静音：恢复上次的音量
      setVolume(volumeBeforeMute > 0 ? volumeBeforeMute : 0.7)
    }
  }

  // --- 预加载与交互守卫 ---
  let _userInteracted = false
  const userInteracted = () => _userInteracted
  let _lastPersistAt = 0

  function markUserInteracted() {
    if (_userInteracted) return
    _userInteracted = true
    const a = getAudio()
    // 从 'none' 提升到 'metadata'，下次设 src 时浏览器会预取时长/封面
    if (a.preload === 'none') {
      a.preload = 'metadata'
    }
  }

  function preloadMetadata() {
    const a = getAudio()
    if (a.preload === 'none') {
      a.preload = 'metadata'
    }
  }

  function setMode(m: PlayMode) {
    globalMode = m
    mode.value = m
    if (m === PM.SHUFFLE) {
      buildShuffledOrder()
    }
    if (_userInteracted) {
      savePersistedState({ mode: m })
    }
  }

  function cycleMode() {
    const order: PlayMode[] = [PM.REPEAT_ALL, PM.REPEAT_ONE, PM.SHUFFLE]
    const cur = order.indexOf(globalMode)
    setMode(order[(cur + 1) % order.length])
  }

  // --- 歌单管理 ---
  let _currentPlaylistId: string | null = null

  function setPlaylist(songs: Song[], startIndex = 0, playlistId: string | null = null) {
    globalPlaylist = [...songs]
    playlist.value = [...songs]
    _currentPlaylistId = playlistId
    if (songs.length === 0) {
      currentSong.value = null
      getAudio().pause()
      getAudio().src = ''
      return
    }
    if (globalMode === PM.SHUFFLE) {
      buildShuffledOrder()
    }
    _loadSong(Math.min(startIndex, songs.length - 1))
  }

  function getCurrentPlaylistId() {
    return _currentPlaylistId
  }

  // --- 恢复上次播放状态 ---
  function applyResume(songs: Song[], playlistId: string, opts: {
    persistedSongId: string | null
    persistedTime: number
    persistedMode?: PlayMode
  }): boolean {
    if (songs.length === 0) return false
    globalPlaylist = [...songs]
    playlist.value = [...songs]
    _currentPlaylistId = playlistId

    // 恢复播放模式
    if (opts.persistedMode) {
      globalMode = opts.persistedMode
      mode.value = opts.persistedMode
    }
    if (globalMode === PM.SHUFFLE) buildShuffledOrder()

    // 找到持久化中的歌
    let targetIndex = 0
    if (opts.persistedSongId) {
      const idx = songs.findIndex((s) => s.id === opts.persistedSongId)
      if (idx >= 0) targetIndex = idx
    }
    _loadSong(targetIndex)

    // 设置进度（不自动播放：设置 currentTime 浏览器也不会触发放音）
    const a = getAudio()
    const safeTime = isFinite(opts.persistedTime) ? Math.max(0, opts.persistedTime) : 0
    const applyTime = () => {
      if (safeTime > 0 && a.duration > 0 && safeTime < a.duration) {
        a.currentTime = safeTime
      }
      currentTime.value = a.currentTime
    }
    if (a.readyState >= 1 /* HAVE_METADATA */) {
      applyTime()
    } else {
      // 等待 metadata 加载完后设进度
      const onLoaded = () => {
        a.removeEventListener('loadedmetadata', onLoaded)
        applyTime()
      }
      a.addEventListener('loadedmetadata', onLoaded)
    }
    return true
  }

  function addSongs(songs: Song[]) {
    const existingIds = new Set(globalPlaylist.map((s) => s.id))
    const newSongs = songs.filter((s) => !existingIds.has(s.id))
    if (newSongs.length === 0) return
    globalPlaylist.push(...newSongs)
    playlist.value = [...globalPlaylist]
    if (globalMode === PM.SHUFFLE) {
      buildShuffledOrder()
    }
  }

  // --- 时间格式化 ---
  function formatTime(seconds: number): string {
    if (!isFinite(seconds) || seconds < 0) return '0:00'
    const m = Math.floor(seconds / 60)
    const s = Math.floor(seconds % 60)
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  function formatDuration(seconds: number): string {
    // duration 可能为 0（加载中）
    if (!seconds || !isFinite(seconds)) return '--:--'
    return formatTime(seconds)
  }

  // --- 生命周期 ---
  let _mounted = false
  let _timeRaf = 0
  let _cleanup: (() => void) | null = null

  function mount(config?: { defaultVolume?: number; defaultMode?: PlayMode | 'list' | 'single' | 'random' }) {
    if (_mounted) return
    _mounted = true

    // 恢复持久化音量/模式（如果调用者没传 default）
    const persisted = loadPersistedState()

    if (config?.defaultVolume != null) {
      setVolume(config.defaultVolume)
    } else if (persisted && typeof persisted.volume === 'number') {
      setVolume(persisted.volume)
      volumeBeforeMute = persisted.volume
    }

    // 起始音量/模式后，恢复 mode
    if (config?.defaultMode == null && persisted?.mode) {
      globalMode = persisted.mode
      mode.value = persisted.mode
      if (persisted.mode === PM.SHUFFLE) buildShuffledOrder()
    }
    if (config?.defaultMode != null) {
      // 兼容 app.config 的别名：'list' | 'single' | 'random'
      const m = config.defaultMode
      if (m === 'list') setMode(PM.REPEAT_ALL)
      else if (m === 'single') setMode(PM.REPEAT_ONE)
      else if (m === 'random') setMode(PM.SHUFFLE)
      else setMode(m as PlayMode)
    }

    const a = getAudio()
    a.addEventListener('timeupdate', onTimeUpdate)

    // 初始同步
    syncState()

    // 注册 ended 广播订阅
    const onEnded = () => playNext()
    endedListeners.push(onEnded)

    // 首次用户交互（点击/滚轮/触屏）后预加载 audio metadata
    let firstInteractionCleanup: (() => void) | null = null
    if (typeof window !== 'undefined' && !_userInteracted) {
      const onFirstInteract = () => {
        markUserInteracted()
        // 不调用 play() — 仅预加载 metadata
        if (audio && audio.src && audio.preload === 'metadata') {
          // audio.load() 会重新拉取元数据
          // 但浏览器自动随 src 预取，隐式 load 足以
        }
        firstInteractionCleanup?.()
        firstInteractionCleanup = null
      }
      const opts: AddEventListenerOptions = { once: true, passive: true }
      window.addEventListener('pointerdown', onFirstInteract, opts)
      window.addEventListener('keydown', onFirstInteract, opts)
      window.addEventListener('scroll', onFirstInteract, opts)
      window.addEventListener('touchstart', onFirstInteract, opts)
      firstInteractionCleanup = () => {
        window.removeEventListener('pointerdown', onFirstInteract, opts)
        window.removeEventListener('keydown', onFirstInteract, opts)
        window.removeEventListener('scroll', onFirstInteract, opts)
        window.removeEventListener('touchstart', onFirstInteract, opts)
      }
    }

    _cleanup = () => {
      a.removeEventListener('timeupdate', onTimeUpdate)
      const idx = endedListeners.indexOf(onEnded)
      if (idx >= 0) endedListeners.splice(idx, 1)
      firstInteractionCleanup?.()
    }
  }

  function unmount() {
    _mounted = false
    _cleanup?.()
    _cleanup = null
  }

  onUnmounted(() => {
    unmount()
  })

  // --- 模式标识 ---
  const modeIcon = computed(() => {
    switch (mode.value) {
      case PM.REPEAT_ONE:
        return 'ph:repeat-once'
      case PM.SHUFFLE:
        return 'ph:shuffle'
      case PM.REPEAT_ALL:
      default:
        return 'ph:repeat'
    }
  })

  const modeLabel = computed(() => {
    switch (mode.value) {
      case PM.REPEAT_ONE:
        return '单曲循环'
      case PM.SHUFFLE:
        return '随机播放'
      case PM.REPEAT_ALL:
      default:
        return '列表循环'
    }
  })

  // 当前进度百分比
  const progressPercent = computed(() => {
    if (!duration.value || duration.value === 0) return 0
    return (currentTime.value / duration.value) * 100
  })

  // buffered 百分比
  const bufferedPercent = computed(() => {
    if (!duration.value || duration.value === 0) return 0
    return (buffered.value / duration.value) * 100
  })

  return {
    // 状态
    status,
    isPlaying,
    currentSong,
    currentTime,
    duration,
    volume,
    mode,
    modeIcon,
    modeLabel,
    progressPercent,
    bufferedPercent,
    playlist,
    currentLyric,
    lrcLines,
    lrcIndex,

    // 控制
    play,
    pause,
    togglePlay,
    playNext,
    playPrev,
    playAt,
    seek,
    setVolume,
    toggleMute,
    markUserInteracted,
    userInteracted,
    setMode,
    cycleMode,

    // 歌单
    setPlaylist,
    addSongs,
    applyResume,
    getCurrentPlaylistId,

    // 工具
    formatTime,
    formatDuration,
    mount,
    unmount,
  }
}
