<script setup lang="ts">
import type { HotItem } from '~/types/hot'

const props = defineProps<{
  item: HotItem
  rank: number
  platform: string
  /** 布局模式：'grid' 竖向卡片 / 'row' 横向单列 */
  layout?: 'grid' | 'row'
}>()

const itemLink = computed(() => {
  const url = props.item.url || props.item.mobileUrl || ''
  return typeof url === 'string' ? url.trim() : ''
})

const hasValidLink = computed(() => !!itemLink.value)
const isRow = computed(() => props.layout === 'row')
const descText = computed(() => props.item.desc?.trim() || '暂无描述')

// 封面图：referrerpolicy="no-referrer" 破解防盗链 + 加载失败时隐藏
const coverSrc = computed(() => props.item.cover || '')
const hasCover = computed(() => !!coverSrc.value)
const coverFailed = ref(false)
function onCoverError() { coverFailed.value = true }

const hotText = computed(() => {
  const h = props.item.hot
  if (h == null) return ''
  return h >= 1e6 ? `${(h / 1e6).toFixed(1)}M` : h >= 1e4 ? `${(h / 1e4).toFixed(1)}万` : String(h)
})

// rank 前 3 名特殊样式
const rankClass = computed(() => ({
  'is-top1': props.rank === 1,
  'is-top2': props.rank === 2,
  'is-top3': props.rank === 3,
}))

// 平台图标映射
const PLATFORM_ICON: Record<string, string> = {
  '哔哩哔哩': 'ph:video-camera',
  '微博':       'ph:chat-centered-text',
  '抖音':       'ph:music-notes',
  '知乎':       'ph:question',
  '36氪':       'ph:trend-up',
  '百度':       'ph:magnifying-glass',
}
const platformIcon = computed(() => PLATFORM_ICON[props.platform] || 'ph:hash')

// 共享片段：标题链接
const titleLink = computed(() =>
  h(hasValidLink.value ? 'a' : 'span', {
    class: 'hot-card-link',
    href: hasValidLink.value ? itemLink.value : undefined,
    target: hasValidLink.value ? '_blank' : undefined,
    rel: hasValidLink.value ? 'noopener noreferrer' : undefined,
  }, props.item.title)
)
</script>

<template>
  <div :class="['hot-card', { 'hot-card--row': isRow }]">
    <!-- ============ row 横向布局：封面左 + 信息右 ============ -->
    <div v-if="isRow" class="hot-card-row">
      <div v-if="hasCover && !coverFailed" class="hot-card-cover hot-card-cover--row">
        <img
          :src="coverSrc"
          :alt="item.title"
          referrerpolicy="no-referrer"
          loading="lazy"
          @error="onCoverError"
        />
      </div>
      <div class="hot-card-body">
        <div class="hot-card-header">
          <h6 class="hot-card-title">
            <component
              :is="hasValidLink ? 'a' : 'span'"
              class="hot-card-link"
              :href="hasValidLink ? itemLink : undefined"
              :target="hasValidLink ? '_blank' : undefined"
              :rel="hasValidLink ? 'noopener noreferrer' : undefined"
            >
              {{ item.title }}
            </component>
          </h6>
          <div class="hot-card-desc">{{ descText }}</div>
        </div>
        <div class="hot-card-footer">
          <div class="hot-card-footer-left">
            <Icon :name="platformIcon" class="hot-card-platform-icon" />
            <span class="hot-card-hot">{{ hotText ? `热度 ${hotText}` : platform }}</span>
          </div>
          <div class="hot-card-footer-right">
            <div class="hot-card-rank" :class="rankClass">{{ rank }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============ grid 竖向布局：封面在上 ============ -->
    <template v-else>
      <div class="hot-card-top">
        <div v-if="hasCover && !coverFailed" class="hot-card-cover">
          <img
            :src="coverSrc"
            :alt="item.title"
            referrerpolicy="no-referrer"
            loading="lazy"
            @error="onCoverError"
          />
        </div>
        <h6 class="hot-card-title">
          <component
            :is="hasValidLink ? 'a' : 'span'"
            class="hot-card-link"
            :href="hasValidLink ? itemLink : undefined"
            :target="hasValidLink ? '_blank' : undefined"
            :rel="hasValidLink ? 'noopener noreferrer' : undefined"
          >
            {{ item.title }}
          </component>
        </h6>
        <div class="hot-card-desc">{{ descText }}</div>
      </div>
      <div class="hot-card-footer">
        <div class="hot-card-footer-left">
          <Icon :name="platformIcon" class="hot-card-platform-icon" />
          <span class="hot-card-hot">{{ hotText ? `热度 ${hotText}` : platform }}</span>
        </div>
        <div class="hot-card-footer-right">
          <div class="hot-card-rank" :class="rankClass">{{ rank }}</div>
        </div>
      </div>
    </template>
  </div>
</template>

<style lang="scss" scoped>
/* ── 共用变量 ── */
.hot-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: .5em;
  padding: .8rem .8rem;
  border-radius: .5rem;
  background-color: var(--c-bg-3);
  overflow: hidden;
  min-height: 130px;

  .dark & { 
    --c-bg-art: hsl(0deg 0% 60%)
    --c-bg-3: var(--c-bg-art / 1)
  }

  --c-bg-3: hsl(0deg 0% 100%);

  /* ── 封面 ── */
  .hot-card-cover {
    width: 100%;
    aspect-ratio: 16 / 9;
    border-radius: .35rem;
    overflow: hidden;
    background: var(--c-bg-2, hsl(0deg 0% 96%));

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      display: block;
    }
  }

  .hot-card-top {
    word-break: break-all;
    overflow-wrap: anywhere;
    display: flex;
    flex-direction: column;
    gap: .5em;
  }

  /* ── 标题 ── */
  .hot-card-title {
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    text-transform: capitalize;
    word-break: break-all;
    font-size: .9em;
    font-weight: 700;
    line-height: 1.4;
    margin: 0;

    .hot-card-link {
      cursor: pointer;
      text-decoration: none;
      word-break: break-all;
      color: inherit;
      transition: .7s cubic-bezier(.6, .1, 0, 1), background-position 0s;

      &:where(:hover, :focus, :active) {
        color: hsl(var(--thyuu--main-color));
      }
      &:where(:not([role=button], .button)) {
        background: var(--a-line-slide, linear-gradient(90deg, hsl(var(--thyuu--main-color) 0deg 70% 70% / 50%), hsl(var(--thyuu--subs-color) / 50%)) no-repeat var(--a-line-trans, 100%) 100% / 0 1px);
        &:hover {
          background-position-x: var(--a-line-trans, 0%);
          background-size: 100% 1px;
        }
      }
    }
  }

  /* ── 摘要 ── */
  .hot-card-desc {
    font-size: .69rem;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 3;
    line-height: 1.5;
  }

  /* ── 底部 ── */
  .hot-card-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0 .5em;
    justify-content: space-between;
    font-size: .75rem;
    margin-top: .25em;

    .hot-card-footer-left {
      display: flex;
      align-items: center;
      gap: .45em;
      overflow: hidden;
      min-width: 0;
    }
  }

  .hot-card-platform-icon {
    flex: none;
    font-size: .95em;
    opacity: .7;
  }

  .hot-card-hot {
    font-size: .68rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .hot-card-footer-right { flex: none; }

  .hot-card-rank {
    width: 24px;
    height: 24px;
    min-width: 24px;
    font-size: 12px;
    font-weight: 700;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 6px;
    background-color: hsl(0deg 0% 90%);
    color: hsl(0deg 0% 40%);
    font-variant-numeric: tabular-nums;
    transition: all .3s;

    &.is-top1 { background-color: #ea444d; color: #fff; }
    &.is-top2 { background-color: #ed702d; color: #fff; }
    &.is-top3 { background-color: #eead3f; color: #fff; }
  }

  /* ============ row 横向布局 ============ */
  &.hot-card--row {
    flex-direction: row;
    gap: .8em;
    padding: .7rem;
    min-height: auto;
  }

  .hot-card-row {
    display: flex;
    gap: .8em;
    width: 100%;
    @media (max-width: 480px) {
      display: grid;
    }
  }

  .hot-card-cover--row {
    width: 37%;
    flex: none;
    aspect-ratio: auto;
    border-radius: 0.5rem;
  }

  .hot-card-body {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: .25em;
    .hot-card-header {
      display: grid;
      gap: 10px;
    }
  }
}

/* ── 响应式：小屏 row 封面缩小 ── */
@media (max-width: 480px) {
  .hot-card--row {
    .hot-card-cover--row {
      width: 100%;
    }
  }
}
</style>
