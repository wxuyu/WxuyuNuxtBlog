<script setup lang="ts">
/** 友链数据 */
interface FriendEntry {
  name: string
  link: string
  avatar: string
  error: boolean
  createdAt: string
}

/** 每页显示条数 */
const ITEMS_PER_PAGE = 24

useSeoMeta({
  title: '好友之结',
})

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])

// --- 数据加载 ---
const { data: rawFriends, status, error, refresh } = useFetch<FriendEntry[]>('/data/friends.json', {
  key: 'friend-link-data',
  server: true,
  lazy: false,
  default: () => [],
})

const friends = computed<FriendEntry[]>(() =>
  rawFriends.value ?? [],
)

const isReady = computed(() => status.value === 'success' && !error.value)
const isEmpty = computed(() => isReady.value && friends.value.length === 0)
const totalFriends = computed(() => friends.value.length)

// --- 分页 ---
const { page, totalPages } = usePagination(friends, {
  perPage: ITEMS_PER_PAGE,
  bindQuery: 'page',
})

const pagedFriends = computed(() => {
  const start = (page.value - 1) * ITEMS_PER_PAGE
  return friends.value.slice(start, start + ITEMS_PER_PAGE)
})

const showPagination = computed(() => isReady.value && totalPages.value > 1)

// --- 骨架屏 ---
const skeletonCount = computed(() => Math.min(ITEMS_PER_PAGE, Math.max(8, totalFriends.value || 12)))
</script>

<template>
  <div class="flink-main">
    <!-- 顶部 -->
    <div class="flink-header">
      <h1 class="flink-header-title">好友之结</h1>
      <div class="flink-header-info">
        <template v-if="isReady">
          <span>{{ totalFriends }} 位好友</span>
        </template>
        <span v-else class="flink-header-muted">加载中…</span>
      </div>
    </div>

    <!-- 骨架屏 -->
    <div v-if="!isReady && !error" class="flink-grid flink-skeleton-grid">
      <div
        v-for="n in skeletonCount"
        :key="'skel-' + n"
        class="flink-skeleton"
        :style="{ animationDelay: `${n * 60}ms` }"
      />
    </div>

    <!-- 错误 -->
    <div v-else-if="error" class="flink-status flink-status--error">
      <Icon name="solar:siren-rounded-bold-duotone" class="flink-status-icon" />
      <span>数据获取失败，请稍后再试</span>
      <button class="flink-retry-btn" @click="refresh()">
        <Icon name="ph:arrow-clockwise-bold" />
        重试
      </button>
    </div>

    <!-- 空 -->
    <div v-else-if="isEmpty" class="flink-status">
      <Icon name="ph:link-break-light" class="flink-status-icon" />
      <span>暂无好友数据</span>
    </div>

    <!-- 卡片网格 -->
    <div v-else class="flink-grid-container">
      <TransitionGroup name="flink-fade" tag="div" class="flink-grid">
        <a
          v-for="friend in pagedFriends"
          :key="friend.link"
          :href="friend.link"
          :title="friend.name"
          target="_blank"
          rel="noopener noreferrer"
          class="flink-card"
        >
          <div class="flink-card-avatar">
            <NuxtImg
              :src="friend.avatar"
              :alt="friend.name"
              width="64"
              height="64"
              class="flink-card-img"
              loading="lazy"
            />
          </div>
          <div class="flink-card-body">
            <div class="flink-card-name">{{ friend.name }}</div>
            <div class="flink-card-link">{{ friend.link }}</div>
          </div>
          <div class="flink-card-status" :class="{ 'flink-card-status--error': friend.error }">
            <Icon
              :name="friend.error ? 'ph:wifi-x-light' : 'ph:wifi-high-light'"
              class="flink-card-status-icon"
            />
          </div>
        </a>
      </TransitionGroup>
    </div>

    <!-- 分页 -->
    <div v-if="showPagination" class="flink-pagination">
      <ZPagination
        v-model="page"
        :total-pages="totalPages"
      />
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ---- 变量 ---- */
.flink-main {
  margin: 1rem;
  --flink-font-normal: var(--custom-fonts, none), 'Misans VF', 'Noto Sans SC', 'PingFang SC', sans-serif;
  --flink-color: hsl(var(--thyuu--color-font) / .5);

  /* ---- 顶部 ---- */
  .flink-header {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    margin-bottom: 1em;

    &-title {
      font-family: var(--flink-font-normal);
      font-size: 2em;
      font-weight: 700;
      color: hsl(var(--thyuu--color-font) / .85);
      margin: 0;

      &::selection { color: hsl(var(--thyuu--main-color)); }
    }

    &-info {
      display: flex;
      align-items: center;
      gap: .5em;
      font-size: .85rem;
      color: var(--flink-color);
      font-family: var(--flink-font-normal);
      white-space: nowrap;
    }

    &-muted { opacity: .4; }
  }

  /* ---- 网格 ---- */
  .flink-grid-container {
    position: relative;
  }

  .flink-grid {
    display: grid;
    gap: .75em;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    margin: 0;
  }

  /* ---- 卡片 ---- */
  .flink-card {
    display: flex;
    align-items: center;
    gap: .75em;
    padding: .75em 1em;
    border-radius: .6rem;
    background-color: var(--c-bg-3, hsl(0deg 0% 100%));
    text-decoration: none;
    transition: transform .2s ease, box-shadow .2s ease, background-color .2s;
    position: relative;
    overflow: hidden;

    .dark & {
      --c-bg-3: hsl(0deg 0% 60% / .08);
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgb(0 0 0 / .08);
      background-color: var(--c-bg-2, hsl(0deg 0% 97%));
    }

    &:active {
      transform: translateY(0);
    }

    &-avatar {
      flex: none;
      position: relative;
    }

    &-img {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      object-fit: cover;
      object-position: top;
      box-shadow: 0 0 0 2px var(--c-bg-1, hsl(0deg 0% 93%)), 0 2px 8px rgb(0 0 0 / .1);
      transition: box-shadow .3s;

      .flink-card:hover & {
        box-shadow: 0 0 0 2px hsl(var(--thyuu--main-color) / .3), 0 2px 12px rgb(0 0 0 / .12);
      }
    }

    &-body {
      flex: 1;
      min-width: 0;
    }

    &-name {
      font-size: .9rem;
      font-weight: 600;
      color: hsl(var(--thyuu--color-font) / .9);
      font-family: var(--flink-font-normal);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      transition: color .2s;

      .flink-card:hover & {
        color: hsl(var(--thyuu--main-color));
      }
    }

    &-link {
      font-size: .7rem;
      color: var(--flink-color);
      font-family: var(--flink-font-normal);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      margin-top: 2px;
    }

    &-status {
      flex: none;
      display: flex;
      align-items: center;
      justify-content: center;
      opacity: .5;
      transition: opacity .2s;

      &-icon {
        font-size: 1.1em;
      }

      &--error {
        opacity: .25;
        color: hsl(0deg 60% 55%);
      }
    }
  }

  /* ---- 骨架屏 ---- */
  .flink-skeleton-grid {
    .flink-skeleton {
      min-height: 64px;
      border-radius: .6rem;
      background: linear-gradient(
        110deg,
        var(--c-bg-3, hsl(0deg 0% 95%)) 30%,
        var(--c-divider, hsl(0deg 0% 85%)) 50%,
        var(--c-bg-3, hsl(0deg 0% 95%)) 70%
      );
      background-size: 200% 100%;
      animation: flink-shimmer 1.5s infinite ease-in-out;
    }
  }

  /* ---- 状态提示 ---- */
  .flink-status {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: .75em;
    padding: 4em 1em;
    color: var(--flink-color);
    font-family: var(--flink-font-normal);
    text-align: center;

    &-icon {
      font-size: 2.5em;
      opacity: .6;
    }

    &--error &-icon {
      color: hsl(0deg 70% 55%);
    }
  }

  .flink-retry-btn {
    display: inline-flex;
    align-items: center;
    gap: .4em;
    padding: .5em 1.2em;
    border: 1px solid var(--c-divider, hsl(0deg 0% 85%));
    border-radius: .4rem;
    background: var(--c-bg-2, hsl(0deg 0% 97%));
    color: inherit;
    font-size: .9rem;
    cursor: pointer;
    transition: background .2s;

    &:hover {
      background: var(--c-bg-1, hsl(0deg 0% 90%));
    }
  }

  /* ---- 分页 ---- */
  .flink-pagination {
    margin-top: 1.5em;
  }
}

/* ---- 入场动画 ---- */
.flink-fade-enter-active {
  transition: opacity .35s ease, transform .35s ease;
}

.flink-fade-leave-active {
  transition: opacity .2s ease, transform .2s ease;
  position: absolute;
}

.flink-fade-enter-from {
  opacity: 0;
  transform: translateY(8px) scale(.97);
}

.flink-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

/* ---- 骨架屏闪烁 ---- */
@keyframes flink-shimmer {
  0%   { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

/* ---- 无障碍 ---- */
@media (prefers-reduced-motion: reduce) {
  .flink-fade-enter-active,
  .flink-fade-leave-active {
    transition: none;
  }

  .flink-skeleton {
    animation: none !important;
  }

  .flink-card {
    transition: none;
  }
}
</style>
