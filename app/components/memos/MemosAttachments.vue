<!--
  MemosAttachments — Memos 附件图片渲染组件（v2 不规则网格布局）

  直接接收 Memos v1 attachments 字段，提取其中的图片类附件渲染：
    <MemosAttachments :attachments="memo.attachments" />

  设计：
  - 顶部一行「📎 Attachments (n)」标题
  - 下方不规则图片网格：图片自适应分列（2/3/4 列根据图片数量）
  - 每张图统一圆角、统一间距、统一比例，居中铺满保持原比例
  - 点击任一图片 → 图片自身放大到屏幕居中（淡入+缩放动画），背景模糊
  - 关闭：右上 X / 键盘 Esc / 点遮罩空白
  - 不依赖 MDC 解析，由父组件直接传入 attachments
-->
<script setup lang="ts">
import type { MemosAttachment } from './utils/types'

interface ImageItem {
  src: string
  alt?: string
  title?: string
}

interface Props {
  /** Memos v1 附件字段（含 filename/externalLink/type 等） */
  attachments?: MemosAttachment[]
  /** 是否允许键盘 Esc 关闭 */
  keyboard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  attachments: () => [],
  keyboard: true,
})

/**
 * 判断是否为图片类附件
 * 优先级：MIME type 以 image/ 开头 > filename 后缀匹配
 */
function isImageAttachment(a: MemosAttachment): boolean {
  if (a.type?.startsWith('image/')) return true
  const fn = a.filename?.toLowerCase() ?? ''
  return /\.(jpe?g|png|gif|webp|bmp|avif|svg|heic|heif)$/.test(fn)
}

/**
 * 把 attachments → ImageItem[]
 * 优先使用 externalLink（外部签名链接）；base64 content（data: URI）兜底；否则丢弃
 */
const imageItems = computed<ImageItem[]>(() => {
  if (!props.attachments?.length) return []
  return props.attachments
    .filter(isImageAttachment)
    .map((a, i) => {
      const src = a.externalLink
        || (a.content?.startsWith('data:image/') ? a.content : '')
        || ''
      if (!src) return null
      return {
        src,
        title: a.filename || `图片 ${i + 1}`,
        alt: a.filename || `附件图片 ${i + 1}`,
      }
    })
    .filter((v): v is ImageItem => v !== null)
})

// ============ Zoom 动画状态 ============
const zoomedIndex = ref<number | null>(null) // 当前放大的图（从 0 起）
const animating = ref(false) // 动画进行中（防止误点）

const total = computed(() => imageItems.value.length)
const zoomedImage = computed(() => {
  if (zoomedIndex.value === null) return null
  return imageItems.value[zoomedIndex.value] ?? null
})

function openZoom(index: number) {
  if (animating.value) return
  zoomedIndex.value = index
  animating.value = true
  document.body.style.overflow = 'hidden'
}
function closeZoom() {
  animating.value = true
  zoomedIndex.value = null
  document.body.style.overflow = ''
}

function onKeydown(e: KeyboardEvent) {
  if (zoomedIndex.value === null) return
  if (e.key === 'Escape') closeZoom()
}

onMounted(() => {
  if (props.keyboard) window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => {
  if (props.keyboard) window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})

function preventDrag(e: DragEvent) { e.preventDefault() }
</script>

<template>
<div class="ibl-gallery" :data-count="total">
  <!-- ============ 顶部「Attachments (n)」标题 ============ -->
  <div v-if="total > 0" class="ibl-attachments-header">
    <Icon name="ph:paperclip-bold" class="ibl-attachments-icon" />
    <span>Attachments</span>
    <span class="ibl-attachments-count">({{ total }})</span>
  </div>

  <!-- ============ 不规则网格（自适应分列）============ -->
  <div v-if="total > 0" class="ibl-image-grid">
    <div
      v-for="(img, index) in imageItems"
      :key="index"
      class="ibl-image"
      @click="openZoom(index)"
    >
      <NuxtImg
        :src="img.src"
        :alt="img.alt || img.title || `图片 ${index + 1}`"
        class="ibl-image-img"
        loading="eager"
        draggable="false"
        @dragstart="preventDrag"
      />
    </div>
  </div>

  <!-- ============ Zoom 放大层（Teleport 到 body）============ -->
  <Teleport to="body">
    <Transition name="ibl-zoom" @after-enter="animating = false" @after-leave="animating = false">
      <div
        v-if="zoomedImage"
        class="ibl-zoom-layer"
        @click.self="closeZoom"
      >
        <img
          :key="zoomedImage.src"
          :src="zoomedImage.src"
          :alt="zoomedImage.alt || zoomedImage.title || `图片 ${zoomedIndex! + 1}`"
          class="ibl-zoom-img"
          draggable="false"
          @dragstart="preventDrag"
          @click.stop
        />

        <button
          class="ibl-zoom-close"
          aria-label="关闭"
          @click.stop="closeZoom"
        >
          <Icon name="ph:x-bold" />
        </button>

        <div v-if="zoomedImage.title || zoomedImage.alt" class="ibl-zoom-caption">
          <span v-if="zoomedImage.title" class="ibl-zoom-title">{{ zoomedImage.title }}</span>
          <span v-if="zoomedImage.alt" class="ibl-zoom-desc">{{ zoomedImage.alt }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</div>
</template>

<style lang="scss" scoped>
/* ============================================================
   MemosAttachments v2 — 不规则自适应网格
   - 默认 grid-template-columns: repeat(auto-fit, minmax(120px, 1fr))
   - 根据 data-count 微调列数：1=1列 / 2=2列 / 3=3列 / 4=2列 / 5=3+2 / 6=3列 / 7=3+3+1 / 8=4×2 / 9+=3列
   - 每张图 aspect-ratio: 4/3（接近截图视觉）
   - 统一大圆角 10px、统一间距 4px
   ============================================================ */

.ibl-gallery {
  --ibl-bg: var(--c-bg-2, #f5f5f5);
  --ibl-radius: 10px;
  --ibl-text: var(--c-text-1, #1f2937);
  --ibl-text-sub: var(--c-text-2, #6b7280);
  --ibl-border: var(--c-border, #e5e7eb);
  --ibl-gap: 4px;

  background-color: var(--c-bg-2);
  border-radius: 0.5rem;
  border: none;
}

/* ==================== 顶部「Attachments (n)」 ==================== */
.ibl-attachments-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.85rem;
  font-weight: 600;
  color: var(--ibl-text-sub);
  letter-spacing: 0.02em;
  user-select: none;
  padding-inline: calc(var(--spacing) * 2);
  padding-block: calc(var(--spacing) * 1);
  --spacing: .25rem;
}

.ibl-attachments-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.ibl-attachments-count {
  opacity: 0.6;
  font-weight: 500;
}

/* ==================== 不规则自适应网格 ==================== */
.ibl-image-grid {
  display: grid;
  gap: var(--ibl-gap);
  /* 默认：自适应，最小 120px 等分 */
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  padding: 1rem;
  background-color: color-mix(in oklab, var(--muted) 70%, transparent);
  --muted: oklch(1 0 0);
}

/* 数量规则：手动控制列数与比例 */
/* 1 张：满宽（仍占 1 列但宽度 100%） */
.ibl-gallery[data-count="1"] .ibl-image-grid {
  grid-template-columns: 1fr;
}
/* 2 张：2 列 */
.ibl-gallery[data-count="2"] .ibl-image-grid {
  grid-template-columns: repeat(2, 1fr);
}
/* 3 张：3 列 */
.ibl-gallery[data-count="3"] .ibl-image-grid {
  grid-template-columns: repeat(3, 1fr);
}
/* 4 张：2×2 */
.ibl-gallery[data-count="4"] .ibl-image-grid {
  grid-template-columns: repeat(2, 1fr);
}
/* 5 张：3 + 2（第一行 3 张窄、后 2 张宽）*/
.ibl-gallery[data-count="5"] .ibl-image-grid {
  grid-template-columns: repeat(6, 1fr);
}
.ibl-gallery[data-count="5"] .ibl-image:nth-child(1),
.ibl-gallery[data-count="5"] .ibl-image:nth-child(2),
.ibl-gallery[data-count="5"] .ibl-image:nth-child(3) {
  grid-column: span 2;
}
.ibl-gallery[data-count="5"] .ibl-image:nth-child(4),
.ibl-gallery[data-count="5"] .ibl-image:nth-child(5) {
  grid-column: span 3;
}
/* 6 张：3×2 */
.ibl-gallery[data-count="6"] .ibl-image-grid {
  grid-template-columns: repeat(3, 1fr);
}
/* 7 张：3 + 3 + 1（最后一张居中跨 1 列）*/
.ibl-gallery[data-count="7"] .ibl-image-grid {
  grid-template-columns: repeat(6, 1fr);
}
.ibl-gallery[data-count="7"] .ibl-image:nth-child(n+7) {
  grid-column: 3 / span 2;
}
/* 8 张：4×2 */
.ibl-gallery[data-count="8"] .ibl-image-grid {
  grid-template-columns: repeat(4, 1fr);
}
/* 9+ 张：3 列循环 */
.ibl-gallery[data-count="9"] .ibl-image-grid,
.ibl-gallery[data-count="10"] .ibl-image-grid,
.ibl-gallery[data-count="11"] .ibl-image-grid,
.ibl-gallery[data-count="12"] .ibl-image-grid {
  grid-template-columns: repeat(3, 1fr);
}

/* 单图卡（圆角 + 缩放 hover） */
.ibl-image {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: var(--ibl-radius);
  overflow: hidden;
  cursor: zoom-in;
  background: var(--c-bg-1, #fff);
  transition: transform 0.2s ease;

  &:hover {
    .ibl-image-img { transform: scale(1.04); }
  }
}

.ibl-image-img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}

/* ==================== Zoom 放大层（淡入+缩放动效） ==================== */
.ibl-zoom-layer {
  position: fixed;
  inset: 0;
  z-index: 2147483600;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(10px) saturate(140%);
  -webkit-backdrop-filter: blur(10px) saturate(140%);
}

.ibl-zoom-img {
  display: block;
  max-width: 90vw;
  max-height: 86vh;
  width: auto;
  height: auto;
  object-fit: contain;
  border-radius: 10px;
  box-shadow: 0 30px 80px rgba(0, 0, 0, 0.6);
  user-select: none;
  -webkit-user-drag: none;
  cursor: zoom-out;
  transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1);
}

.ibl-zoom-enter-active .ibl-zoom-img,
.ibl-zoom-leave-active .ibl-zoom-img {
  transition: transform 0.32s cubic-bezier(0.22, 0.61, 0.36, 1), opacity 0.32s ease;
}

.ibl-zoom-enter-from .ibl-zoom-img {
  opacity: 0;
  transform: scale(0.88);
}
.ibl-zoom-leave-to .ibl-zoom-img {
  opacity: 0;
  transform: scale(0.94);
}

/* 关闭按钮（右上） */
.ibl-zoom-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 44px;
  height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  font-size: 1.1rem;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.2s ease, transform 0.2s ease;
  z-index: 10;

  &:hover {
    background: rgba(255, 255, 255, 0.32);
    transform: scale(1.06);
  }
}

/* 底部小描述 */
.ibl-zoom-caption {
  position: absolute;
  bottom: 1.25rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  color: #fff;
  pointer-events: none;
  max-width: 80vw;
}

.ibl-zoom-title {
  font-size: 0.9rem;
  font-weight: 500;
  opacity: 0.95;
}

.ibl-zoom-desc {
  font-size: 0.78rem;
  opacity: 0.7;
}

.ibl-zoom-enter-active,
.ibl-zoom-leave-active { transition: opacity 0.32s ease; }
.ibl-zoom-enter-from,
.ibl-zoom-leave-to { opacity: 0; }
</style>