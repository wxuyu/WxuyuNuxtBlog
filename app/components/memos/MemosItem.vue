<!--
  MemosItem.vue — 单条 memo 卡片

  布局参考设计稿：
    1. 顶部：标题（content 第一行，粗体、大字、单行截断）
    2. 中部：摘要（content 剩余行，灰色、小字、3 行截断）
    3. 附件：独立渲染（直接传 attachments 给 ImageBgLightbox，不走 MDC）
    4. 底部：左侧来源（作者名），右侧日期（YYYY-MM-DD 或相对时间）

  内容渲染：优先走博客 MDC 渲染链路（ContentRenderer + parseMarkdown），
  让 memo 里的 ::alert、:badge[]、::link-card 等 MDC 组件真实渲染成组件；
  图片附件独立渲染（不走 MDC 语法）。
-->
<script setup lang="ts">
import { computed } from 'vue'
import type { MemosMemo } from '~/types/memos'
import { renderMemoContent } from '~/utils/marked'
import { useMdcRender } from '~/composables/useMdc'
import { useRelativeTime } from '~/composables/useLately'

interface Props {
  memo: MemosMemo
  memosUrl: string
  /** 布局模式：由父组件传入，控制卡片在瀑布流中的行为 */
  layout?: 'list' | 'masonry'
  onTagClick?: (tag: string) => void
}

const props = withDefaults(defineProps<Props>(), {
  layout: 'list',
})

/** 原始 content（未剥除任何块）。标题/摘要判定与 MDC 渲染共用。 */
const rawContent = computed(() => props.memo.content ?? '')

/**
 * 用于 MDC 渲染的 content：
 * - 剥除任何显式的 `::image-bg-lightbox` 块，避免与附件组件重复渲染
 * - 其余 MDC 块（::alert / :badge[] / ::link-card 等）走 ContentRenderer
 */
const contentForRender = computed(() => {
  return rawContent.value.replace(
    /::\s*image-bg-lightbox[\s\S]*?(?=\n::\s|\n$|$)/gi,
    '',
  ).trim()
})

/** MDC 渲染：解析 memo.content → hast AST，交给 ContentRenderer 渲染博客 MDC 组件 */
const { body } = useMdcRender(() => contentForRender.value)

/** marked + DOMPurify 降级（解析失败或 MDC 尚未就绪时兜底） */
const html = computed(() => renderMemoContent(contentForRender.value))

/** 是否包含图片附件（独立渲染灯箱） */
const hasImageAttachments = computed(() =>
  (props.memo.attachments?.length ?? 0) > 0,
)

/** 把 content 拆成「标题 + 摘要」（基于剥除 image 块后的干净文本） */
const contentParts = computed(() => {
  const raw = contentForRender.value.replace(/\r\n/g, '\n').trim()
  if (!raw) return { title: '', summary: '', fullText: '' }
  const idx = raw.indexOf('\n')
  if (idx === -1) return { title: raw, summary: raw, fullText: raw }
  const title = raw.slice(0, idx).trim()
  const summary = raw.slice(idx + 1).trim()
  return { title, summary, fullText: raw }
})

/** 详情页 URL */
const memoUrl = computed(() => {
  const base = props.memosUrl.replace(/\/+$/, '')
  return `${base}/m/${props.memo.id}`
})

/** 相对时间 tooltip */
const { tooltip } = useRelativeTime(() => props.memo.createdAt)

/** 日期格式：YYYY-MM-DD */
const dateDisplay = computed(() => {
  const d = props.memo.createdAt
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
})

/** 摘要/正文区域点击：不处理任何跳转。图片点击由 ImageBgLightbox 内部接管（zoom 缩放动画）。 */
function onContentClick(_e: MouseEvent) {
  // 故意不做事。
}

defineEmits<{
  tagclick: [tag: string]
}>()
</script>

<template>
  <div
    class="memo-item"
    :class="`layout-${layout}`"
    :data-id="`memo-${memo.id}`"
    :data-time="memo.createdAt.toISOString()"
  >
    <article class="memo-card">
      <!-- 标题：content 第一行 -->
      <div class="memo-card-top">
        <!-- <h3 v-if="contentParts.title" class="memo-title">
          <a
            class="memo-title-link"
            :href="memoUrl"
            target="_blank"
            rel="noopener"
            :title="contentParts.title"
          >
            {{ contentParts.title }}
          </a>
        </h3> -->

        <!-- 普通模式：标题 + 摘要（有行数截断，隐藏行内裸图） -->
        <template v-if="!hasImageAttachments">
          <div v-if="contentParts.summary" class="memo-summary" @click="onContentClick">
            <ContentRenderer v-if="body" :value="body" />
            <div v-else v-html="html" />
          </div>
        </template>

        <!-- 图片附件模式：完整渲染 content，不截断、不隐藏行内元素 -->
        <template v-else>
          <div class="memo-full-content" @click="onContentClick">
            <ContentRenderer v-if="body" :value="body" />
            <div v-else v-html="html" />
          </div>
        </template>
      </div>

      <!-- 图片附件：直接传 attachments，不再走 MDC 语法 -->
      <MemosAttachments
        v-if="hasImageAttachments"
        :attachments="memo.attachments"
      />

      <!-- 标签 -->
      <div v-if="memo.tags.length" class="memo-tags">
        <span v-for="tag in memo.tags" :key="tag" class="tag-span" @click.stop="$emit('tagclick', tag)">
          #{{ tag }}
        </span>
      </div>

      <!-- 底部信息栏：来源 + 日期 -->
      <div class="memo-footer">
        <div class="memo-footer-left">
          <div class="memo-footer-info">
            <img
              v-if="memo.creatorAvatar"
              class="memo-avatar"
              :src="memo.creatorAvatar"
              :alt="memo.creatorName"
              loading="lazy"
              referrerpolicy="no-referrer"
            >
            <a
              class="memo-source-name"
              :href="memoUrl"
              target="_blank"
              rel="noopener"
              @click.stop
            >{{ memo.creatorName || '来源' }}</a>
          </div>
        </div>
        <div class="memo-footer-right">
          <time class="memo-date" :datetime="memo.createdAt.toISOString()" :title="tooltip">{{ dateDisplay }}</time>
        </div>
      </div>
    </article>
  </div>
</template>

<style scoped lang="scss">
@use '~/assets/diy/font.scss' as *;
.memo-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 0.5em;
  padding: 0.8rem 0.8rem;
  border-radius: 0.5rem;
  background-color: var(--c-bg-3);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;

  .dark & {
    --c-bg-3: hsl(0deg 0% 60% / 0.1);
  }
  --c-bg-3: hsl(0deg 0% 100%);

  &:hover {
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .memo-card-top {
    word-break: break-all;
    overflow-wrap: anywhere;
    display: flex;
    flex-direction: column;
    gap: 0.5em;

    .memo-title {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      text-transform: capitalize;
      word-break: break-all;
      font-size: 0.9em;
      font-weight: 700;
      margin: 0;

      .memo-title-link {
        cursor: pointer;
        text-decoration: none;
        word-break: break-all;
        color: inherit;
        transition: 0.7s cubic-bezier(0.6, 0.1, 0, 1), background-position 0s;

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

    .memo-summary {
      font-size: 0.8rem;
      line-height: 1.55;
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 3;

      :deep(p) {
        margin: 0;
        color: inherit;
      }

      :deep(p + p) {
        margin-top: 0.4rem;
      }

      :deep(img) {
        display: none;
      }

      :deep(a) {
        color: inherit;
        text-decoration: none;
      }

      :deep(pre),
      :deep(code) {
        display: none;
      }
    }

    .memo-full-content {
      :deep(p) {
        margin: 0;
        color: inherit;
      }

      :deep(p + p) {
        margin-top: 0.4rem;
      }

      // Memos 卡片内：紧凑附件式灯箱（瀑布流窄容器）
      :deep(.ibl-gallery) {
        margin: 0.25rem 0;
        padding: 0.4rem;
      }

      :deep(.ibl-attachments-header) {
        font-size: 0.7rem;
        margin-bottom: 0.25rem;
      }
    }
  }

  // 原 .resimg 网格已被 ImageBgLightbox 取代，不再需要 .gallery-thumbnail 样式

  .memo-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;

    .tag-span {
      display: inline-block;
      background: #e3f2fd;
      color: #1976d2;
      padding: 0.15rem 0.45rem;
      border-radius: 12px;
      font-size: 0.8rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #bbdefb;
      }
    }
  }

  .memo-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0 0.5em;
    justify-content: space-between;
    font-size: 0.75rem;

    .memo-footer-left {
      display: flex;
      gap: 1em;
      align-items: center;
      min-width: 0;

      .memo-footer-info {
        display: flex;
        gap: 0.5em;
        align-items: center;
        min-width: 0;

        .memo-avatar {
          flex: none;
          transition: all 0.5s;
          background: white;
          box-shadow:
            0 0 5rem 0.5rem rgb(var(--plant-rgb) / 0.4),
            0 0.5rem 1rem 0 rgb(var(--plant-rgb-sub) / 0.2);
          outline: 0.2rem solid rgb(var(--plant-rgb) / 0.1);
          height: var(--avatar-size, 2em);
          width: var(--avatar-size, 2em);
          border-radius: 50%;
          background-color: var(--thyuu--color-back-white);
          object-fit: cover;
          object-position: top;
        }

        .memo-source-name {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          text-transform: capitalize;
          word-break: break-all;
          color: hsl(var(--thyuu--color-font) / 0.8);
        }
      }
    }

    .memo-footer-right {
      display: flex;
      align-items: center;
      gap: 0.5em;
      flex-shrink: 0;

      .memo-date {
        color: hsl(var(--thyuu--color-font) / 0.6);
        white-space: nowrap;
      }
    }
  }
}

// 移动端
@media (max-width: 768px) {
  .memo-card {
    padding: 1rem;
    margin-bottom: 1rem;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  // 移动端瀑布流回退单列
  .memo-item.layout-masonry {
    break-inside: auto;
  }
}

// 瀑布流模式：Grid 子元素自适应
.memo-item.layout-masonry {
  // Grid 布局下不需要 inline-block 和 break-inside
  // 由父容器 grid-template-columns 控制分列
}

// 单列模式
.memo-item.layout-list {
  margin-bottom: 1rem;
}
</style>
