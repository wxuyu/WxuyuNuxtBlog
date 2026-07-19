<script setup lang="ts">
/**
 * CircleFilterBar — circle.vue 内的友链筛选导航栏
 * 使用 feeds.ts 分组数据对 API 文章进行粗筛/细筛
 */
import type { CircleFilterGroup, CircleFilterFriend } from '~/composables/useCircleFilter'

const props = defineProps<{
  groups: CircleFilterGroup[]
  selectedGroup: string | null
  selectedFriendLink: string | null
  selectedLabel: string
  totalCount: number
  matchedCount: number
}>()

const emit = defineEmits<{
  (e: 'select-group', name: string | null): void
  (e: 'select-friend', link: string | null): void
  (e: 'reset'): void
}>()

/** 当前展开的分组名（仅一个） */
const expandedGroup = ref<string | null>(null)

function toggleGroup(name: string) {
  expandedGroup.value = expandedGroup.value === name ? null : name
}

function handleSelectGroup(name: string | null) {
  emit('select-group', name)
}

function handleSelectFriend(link: string | null) {
  emit('select-friend', link)
}

function handleReset() {
  expandedGroup.value = null
  emit('reset')
}

/** 当前筛选是否是全选 */
const isAll = computed(() => !props.selectedGroup && !props.selectedFriendLink)
</script>

<template>
  <div class="filter-bar">
    <!-- 筛选按钮组 -->
    <div class="filter-bar-tabs">
      <!-- 全部 -->
      <button
        :class="['filter-tab', { 'is-active': isAll }]"
        @click="handleReset"
      >
        <Icon name="ph:globe-hemisphere-west" />
        全部
        <span class="filter-tab-count">{{ totalCount }}</span>
      </button>

      <!-- 分组 -->
      <div v-for="group in groups" :key="group.name" class="filter-group-block">
        <div class="filter-group-wrapper">
          <button
            :class="[
              'filter-tab',
              { 'is-active': selectedGroup === group.name && !selectedFriendLink }
            ]"
            @click="handleSelectGroup(group.name)"
          >
            <Icon name="ph:users-three" />
            <span class="filter-tab-name">{{ group.name.replace(/『|』/g, '') }}</span>
            <span class="filter-tab-count">{{ group.articleCount }}</span>
          </button>

          <!-- 展开箭头 -->
          <button
            v-if="group.friends.length > 0"
            :class="['filter-tab-arrow', { 'is-expanded': expandedGroup === group.name }]"
            @click.stop="toggleGroup(group.name)"
            aria-label="展开/折叠好友列表"
          >
            <Icon name="ph:caret-down" />
          </button>
        </div>

        <!-- 好友子列表（绝对定位浮动，不挤占文档流） -->
        <Transition name="filter-drop">
          <div
            v-if="expandedGroup === group.name"
            class="filter-dropdown"
          >
            <button
              :class="[
                'filter-dropdown-item',
                {
                  'is-active': selectedFriendLink === friend.link,
                  'is-empty': friend.articleCount === 0,
                }
              ]"
              v-for="friend in group.friends"
              :key="friend.link"
              @click="handleSelectFriend(friend.link)"
              :disabled="friend.articleCount === 0"
            >
              <NuxtImg
                :src="friend.avatar"
                :alt="friend.title"
                width="24"
                height="24"
                class="filter-dropdown-avatar"
                loading="lazy"
              />
              <span class="filter-dropdown-name">{{ friend.title }}</span>
              <span class="filter-dropdown-count">{{ friend.articleCount }}</span>
            </button>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;

  /* ---- 统计行 ---- */
  &-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: .5em;
    // font-family: var(--thyuu--font-family-normal);
  }

  &-stats {
    display: flex;
    align-items: center;
    gap: .4em;
    font-size: .8rem;
    // color: hsl(var(--thyuu--color-font) / .5);
  }

  &-label {
    // color: hsl(var(--thyuu--color-font) / .4);
  }

  &-count {
    font-weight: 600;

    &--match {
      // color: hsl(var(--thyuu--main-color));
    }
  }

  &-divider {
    opacity: .4;
    margin: 0 2px;
  }

  &-current {
    display: flex;
    align-items: center;
    gap: .35em;
    font-size: .78rem;
    color: hsl(var(--thyuu--main-color));
    // font-family: var(--thyuu--font-family-normal);
    max-width: 50%;
    overflow: hidden;

    &-icon {
      flex: none;
      font-size: .85em;
    }

    span {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  /* ---- 筛选标签 ---- */
  &-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: .65rem;
  }
}

/* ---- 分组外层（为下拉提供定位锚点） ---- */
.filter-group-block {
  position: relative;
}

/* ---- 分组容器 ---- */
.filter-group-wrapper {
  display: flex;
  align-items: stretch;
  gap: 0.28rem;
}

.filter-tab {
  display: inline-flex;
  align-items: center;
  gap: .35em;
  padding: .35em .6em;
  border: 1px solid var(--c-divider, hsl(0deg 0% 88%));
  border-radius: .4rem;
  background: var(--c-bg-2, hsl(0deg 0% 98%));
  // color: hsl(var(--thyuu--color-font) / .6);
  font-size: .75rem;
  font-family: var(--thyuu--font-family-normal);
  cursor: pointer;
  transition: border-color .2s, background .2s, color .2s;
  white-space: nowrap;

  .dark & {
    --c-bg-2: hsl(0deg 0% 15%);
    --c-divider: hsl(0deg 0% 25%);
  }

  &:hover {
    border-color: hsl(var(--thyuu--main-color));
    color:hsl(var(--thyuu--main-color));
  }

  &.is-active {
    border-color: hsl(var(--thyuu--main-color));
    background: hsl(var(--thyuu--main-color) / .08);
    color: hsl(var(--thyuu--main-color));
    font-weight: 600;

    .filter-tab-count {
      background: hsl(var(--thyuu--main-color) / .15);
      color: hsl(var(--thyuu--main-color));
    }
  }
}

.filter-tab-name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1.2em;
  height: 1.2em;
  padding: 0 .3em;
  border-radius: .6em;
  background: hsl(var(--thyuu--color-font) / .08);
  font-size: .7rem;
  line-height: 1;
}

.filter-tab-arrow {
  display: flex;
  align-items: center;
  padding: .35em .3em;
  border: 1px solid var(--c-divider, hsl(0deg 0% 88%));
  border-left: none;
  border-radius: .4rem;
  background: var(--c-bg-2, hsl(0deg 0% 98%));
  cursor: pointer;
  transition: transform .25s, color .2s;

  .dark & {
    --c-bg-2: hsl(0deg 0% 15%);
    --c-divider: hsl(0deg 0% 25%);
  }

  &.is-expanded {
    transform: rotate(180deg);
  }

  &:hover {
    color: hsl(var(--thyuu--main-color));
  }
}

/* ---- 下拉好友列表（绝对定位浮动，不挤占文档流） ---- */
.filter-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 20;
  display: flex;
  flex-wrap: wrap;
  gap: .3em;
  margin-top: .4em;
  padding: .5em;
  max-width: min(420px, calc(100vw - 2rem));
  border-radius: .5rem;
  background: var(--c-bg-2, hsl(0deg 0% 100%));
  box-shadow: 0 4px 20px rgb(0 0 0 / .12);
  border: 1px solid var(--c-divider, hsl(0deg 0% 88%));

  .dark & {
    --c-bg-2: hsl(0deg 0% 14%);
    --c-divider: hsl(0deg 0% 22%);
    box-shadow: 0 4px 24px rgb(0 0 0 / .35);
  }
}

.filter-dropdown-item {
  display: inline-flex;
  align-items: center;
  gap: .35em;
  padding: .25em .5em;
  border: 1px solid var(--c-divider, hsl(0deg 0% 88%));
  border-radius: 1em;
  background: var(--c-bg-1, hsl(0deg 0% 95%));
  font-size: .72rem;
  font-family: var(--thyuu--font-family-normal);
  cursor: pointer;
  transition: border-color .2s, background .2s, color .2s;

  .dark & {
    --c-bg-1: hsl(0deg 0% 12%);
    --c-divider: hsl(0deg 0% 22%);
  }

  &:hover:not(:disabled) {
    border-color: hsl(var(--thyuu--main-color));
    color: hsl(var(--thyuu--main-color));
  }

  &.is-active {
    border-color: hsl(var(--thyuu--main-color));
    background: hsl(var(--thyuu--main-color) / .1);
    color: hsl(var(--thyuu--main-color));
    font-weight: 600;

    .filter-dropdown-count {
      background: hsl(var(--thyuu--main-color) / .18);
      color: hsl(var(--thyuu--main-color));
    }
  }

  &.is-empty {
    opacity: .35;
    cursor: not-allowed;
    filter: grayscale(.6);
  }
}

.filter-dropdown-avatar {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  object-fit: cover;
  flex: none;
}

.filter-dropdown-name {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-dropdown-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 1em;
  padding: 0 .25em;
  border-radius: .5em;
  background: hsl(var(--thyuu--color-font) / .06);
  font-size: .65rem;
  line-height: 1.2;
}

/* ---- 展开动画 ---- */
.filter-drop-enter-active {
  transition: opacity .2s ease, max-height .3s ease;
  max-height: 300px;
  overflow: hidden;
}

.filter-drop-leave-active {
  transition: opacity .15s ease, max-height .2s ease;
  max-height: 0;
  overflow: hidden;
}

.filter-drop-enter-from,
.filter-drop-leave-to {
  opacity: 0;
  max-height: 0;
}

/* ---- 无障碍 ---- */
@media (prefers-reduced-motion: reduce) {
  .filter-drop-enter-active,
  .filter-drop-leave-active {
    transition: none;
  }
}
</style>
