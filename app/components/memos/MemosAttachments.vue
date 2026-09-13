<!--
  MemosAttachments — Memos 附件图片渲染组件（v3 灯箱增强版）

  网格（桌面 3 列 / 移动 2 列）+ 灯箱功能：
  - 点击图片 → 灯箱打开（淡入 + 缩放动画）
  - 灯箱内：
    · 左右切换（按钮 + 键盘 ← →），多张时循环
    · 缩放：滚轮（鼠标/触控板）、双击图片切换 100%/适应、双击空白处重置
    · 工具栏：+ / − / 100% 重置 / 1:1 切换
    · 拖动平移（仅在缩放>适应 大小时可用）
  - 关闭：右上 X / 键盘 Esc / 点遮罩空白
  - 不依赖 MDC 解析，由父组件直接传入 attachments
-->
<script setup lang="ts">
import type { MemosAttachment } from '~/types/memos'

interface ImageItem {
  src: string
  alt?: string
  title?: string
}

interface Props {
  /** Memos v1 附件字段（含 filename/externalLink/type 等） */
  attachments?: MemosAttachment[]
  /** 是否允许键盘 Esc/方向键关闭/切换 */
  keyboard?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  attachments: () => [],
  keyboard: true,
})

/* ==================== attachments → ImageItem[] ==================== */
function isImageAttachment(a: MemosAttachment): boolean {
  if (a.type?.startsWith('image/')) return true
  const fn = a.filename?.toLowerCase() ?? ''
  return /\.(jpe?g|png|gif|webp|bmp|avif|svg|heic|heif)$/.test(fn)
}

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

/* ==================== Zoom 状态 ==================== */
const zoomedIndex = ref<number | null>(null)
const animating = ref(false)
const total = computed(() => imageItems.value.length)
const zoomedImage = computed(() => {
  if (zoomedIndex.value === null) return null
  return imageItems.value[zoomedIndex.value] ?? null
})

/* ==================== 缩放与平移状态 ==================== */
/**
 * scale 1.0 = 适应窗口（max-width:90vw, max-height:86vh 时由 CSS object-fit:contain 等价）
 * scale 模式：
 *  - null = 适应窗口（CSS 控制 90vw/86vh）
 *  - 数字 = 用户主动设置的缩放比例（transform: scale()）
 */
const scale = ref<number | null>(null) // null = 适应窗口
const tx = ref(0) // translateX（像素）
const ty = ref(0) // translateY（像素）
const MIN_SCALE = 0.25
const MAX_SCALE = 4
const ZOOM_STEP = 0.25 // 按钮 +/- 步进

/** 是否已缩放（大于最小阈值） */
const isZoomed = computed(() => scale.value !== null && scale.value !== 1)
/** 缩放显示文字（固定 1 位小数） */
const scaleLabel = computed(() => {
  if (scale.value === null) return '适应'
  return `${Math.round(scale.value * 100)}%`
})
/** 拖动中状态（避免光标闪烁） */
const dragging = ref(false)

/* ==================== 打开/关闭 ==================== */
function openZoom(index: number) {
  if (animating.value) return
  zoomedIndex.value = index
  resetTransform() // 打开即重置缩放/位移
  animating.value = true
  document.body.style.overflow = 'hidden'
}
function closeZoom() {
  animating.value = true
  zoomedIndex.value = null
  resetTransform()
  document.body.style.overflow = ''
}
/** 重置缩放与位移到初始状态 */
function resetTransform() {
  scale.value = null
  tx.value = 0
  ty.value = 0
}

/* ==================== 切换图片 ==================== */
function prev() {
  if (total.value <= 1 || zoomedIndex.value === null) return
  zoomedIndex.value = (zoomedIndex.value - 1 + total.value) % total.value
  resetTransform() // 切图重置缩放
}
function next() {
  if (total.value <= 1 || zoomedIndex.value === null) return
  zoomedIndex.value = (zoomedIndex.value + 1) % total.value
  resetTransform()
}

/* ==================== 缩放控制 ==================== */
function zoomIn() {
  const cur = scale.value ?? 1
  const next = Math.min(MAX_SCALE, +(cur + ZOOM_STEP).toFixed(2))
  if (next === cur) return
  scale.value = next
}
function zoomOut() {
  const cur = scale.value ?? 1
  const next = Math.max(MIN_SCALE, +(cur - ZOOM_STEP).toFixed(2))
  if (next === cur) return
  scale.value = next
  if (scale.value! <= 0.3) resetTransform() // 缩到非常小时回到适应窗口
}
/** 双击图片：适应 ↔ 1:1 切换 */
function toggleFitOrActual(e?: MouseEvent) {
  e?.stopPropagation()
  if (scale.value === null) {
    scale.value = 1
  } else {
    resetTransform()
  }
}
/** 滚轮缩放（鼠标在图片上） */
function onWheel(e: WheelEvent) {
  e.preventDefault()
  const cur = scale.value ?? 1
  // deltaY > 0 向下滚 = 缩小
  const factor = e.deltaY > 0 ? 0.9 : 1.1
  let next = cur * factor
  next = Math.max(MIN_SCALE, Math.min(MAX_SCALE, +next.toFixed(2)))
  if (next < 0.35) {
    resetTransform()
  } else {
    scale.value = next
  }
}

/* ==================== 拖动平移 ==================== */
const dragStart = { x: 0, y: 0, tx: 0, ty: 0 }
function onPointerDown(e: PointerEvent) {
  if (!isZoomed.value && scale.value === null) return // 未缩放时不可拖
  dragging.value = true
  ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  dragStart.x = e.clientX
  dragStart.y = e.clientY
  dragStart.tx = tx.value
  dragStart.ty = ty.value
}
function onPointerMove(e: PointerEvent) {
  if (!dragging.value) return
  tx.value = dragStart.tx + (e.clientX - dragStart.x)
  ty.value = dragStart.ty + (e.clientY - dragStart.y)
}
function onPointerUp(e: PointerEvent) {
  dragging.value = false
  try { (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId) } catch { /* noop */ }
}

/* ==================== 键盘交互 ==================== */
function onKeydown(e: KeyboardEvent) {
  if (zoomedIndex.value === null) return
  switch (e.key) {
    case 'Escape': closeZoom(); break
    case 'ArrowLeft': prev(); break
    case 'ArrowRight': next(); break
    case '+': case '=': zoomIn(); break
    case '-': case '_': zoomOut(); break
    case '0': resetTransform(); break
  }
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

  <!-- ============ 固定每行 3 张 / 移动端 2 张网格 ============ -->
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

  <!-- ============ Zoom 灯箱层（Teleport 到 body）============ -->
  <Teleport to="body">
    <Transition name="ibl-zoom" @after-enter="animating = false" @after-leave="animating = false">
      <div
        v-if="zoomedImage"
        class="ibl-zoom-layer"
        @click.self="closeZoom"
        @wheel="onWheel"
      >
        <!-- 主图（缩放 + 拖动） -->
        <img
          :key="zoomedImage.src"
          :src="zoomedImage.src"
          :alt="zoomedImage.alt || zoomedImage.title || `图片 ${zoomedIndex! + 1}`"
          class="ibl-zoom-img"
          :class="{ 'ibl-zoom-img--actual': isZoomed, 'ibl-zoom-img--dragging': dragging }"
          :style="{
            transform: scale === null
              ? ''
              : `translate(${tx}px, ${ty}px) scale(${scale})`,
          }"
          draggable="false"
          @dragstart="preventDrag"
          @dblclick.stop="toggleFitOrActual"
          @pointerdown="onPointerDown"
          @pointermove="onPointerMove"
          @pointerup="onPointerUp"
          @pointercancel="onPointerUp"
        />

        <!-- 关闭按钮（右上） -->
        <button
          class="ibl-zoom-close"
          aria-label="关闭"
          @click.stop="closeZoom"
        >
          <Icon name="ph:x-bold" />
        </button>

        <!-- 左侧切换按钮（>1 张时显示） -->
        <button
          v-if="total > 1"
          class="ibl-zoom-prev"
          aria-label="上一张"
          @click.stop="prev"
        >
          <Icon name="ph:caret-left-bold" />
        </button>

        <!-- 右侧切换按钮（>1 张时显示） -->
        <button
          v-if="total > 1"
          class="ibl-zoom-next"
          aria-label="下一张"
          @click.stop="next"
        >
          <Icon name="ph:caret-right-bold" />
        </button>

        <!-- 缩放工具栏（底部居中） -->
        <div class="ibl-zoom-toolbar" @click.stop>
          <button class="ibl-zoom-tool" aria-label="缩小" @click="zoomOut">
            <Icon name="ph:minus-bold" />
          </button>
          <button
            class="ibl-zoom-tool ibl-zoom-tool--label"
            :title="scale === null ? '当前：适应窗口（双击图片切换 1:1）' : '点击重置到适应窗口'"
            @click="scale === null ? (scale = 1) : resetTransform()"
          >
            {{ scaleLabel }}
          </button>
          <button class="ibl-zoom-tool" aria-label="放大" @click="zoomIn">
            <Icon name="ph:plus-bold" />
          </button>
          <span class="ibl-zoom-tool-sep" />
          <button
            class="ibl-zoom-tool"
            :class="{ 'ibl-zoom-tool--active': scale === 1 }"
            :title="'1:1 原始大小'"
            @click="scale === 1 ? resetTransform() : (scale = 1)"
          >
            <Icon name="ph:corners-out-bold" />
          </button>
          <button
            v-if="isZoomed"
            class="ibl-zoom-tool"
            :title="'重置缩放'"
            @click="resetTransform"
          >
            <Icon name="ph:arrow-counter-clockwise-bold" />
          </button>
        </div>

        <!-- 计数指示器（左下）+ 标题（底部） -->
        <div v-if="total > 1" class="ibl-zoom-counter">
          {{ zoomedIndex! + 1 }} / {{ total }}
        </div>
        <div v-if="zoomedImage.title || zoomedImage.alt" class="ibl-zoom-caption">
          <span v-if="zoomedImage.title" class="ibl-zoom-title">{{ zoomedImage.title }}</span>
          <span v-if="zoomedImage.alt && zoomedImage.alt !== zoomedImage.title" class="ibl-zoom-desc">{{ zoomedImage.alt }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</div>
</template>

<style lang="scss" scoped>
/* ============================================================
   MemosAttachments v3 — 固定每行 3 张 / 移动端 2 张
   灯箱增强：左右切换、滚轮/双击/工具栏缩放、拖动平移
   ============================================================ */
@property --tw-border-style {
  syntax: "*";
  inherits: false;
  initial-value: solid;
}

.ibl-gallery {
  --ibl-bg: var(--c-bg-2, #f5f5f5);
  --ibl-radius: 10px;
  --ibl-text: var(--c-text-1, #1f2937);
  --ibl-text-sub: var(--c-text-2, #6b7280);
  --ibl-border: var(--c-border, #e5e7eb);
  --ibl-gap: 4px;

  border-radius: 0.45rem;
  border-color: var(--c-primary);
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
  background-color: color-mix(in oklab, var(--muted) 40%, var(--c-bg-1) 70%);
  --muted: oklch(93.41% .0153 90.239);
  border-top-left-radius: var(--ibl-radius);
  border-top-right-radius: var(--ibl-radius);
  border-style: var(--tw-border-style);
  border-width: 1px;
  border-bottom-color: transparent;
}

.ibl-attachments-icon {
  font-size: 1rem;
  opacity: 0.8;
}

.ibl-attachments-count {
  opacity: 0.6;
  font-weight: 500;
}

/* ==================== 固定每行 3 张网格 ==================== */
.ibl-image-grid {
  display: grid;
  gap: var(--ibl-gap);
  grid-template-columns: repeat(3, 1fr);
  padding: 1rem;
  background-color: var(--c-bg-3);
  border-bottom-left-radius: var(--ibl-radius);
  border-bottom-right-radius: var(--ibl-radius);
  border-style: var(--tw-border-style);
  border-width: 1px;
}

@media (max-width: 768px) {
  .ibl-image-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

/* 单张图时占满整行宽度 */
.ibl-gallery[data-count="1"] .ibl-image-grid {
  grid-template-columns: 1fr;
}

/* ==================== 单图卡 ==================== */
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

/* ==================== Zoom 灯箱层 ==================== */
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
  overflow: hidden; // 防止缩放图溢出
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
  cursor: zoom-in;
  // 平滑过渡（缩放/拖动）
  transition: transform 0.25s cubic-bezier(0.22, 0.61, 0.36, 1);
  will-change: transform;
  touch-action: none; // 禁用浏览器默认触控手势

  &--dragging {
    cursor: grabbing;
    transition: none; // 拖动时不要过渡，跟手
  }
  &--actual {
    // 主动缩放时取消 max-width/max-height 限制（用 transform 控制）
    max-width: none;
    max-height: none;
  }
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

/* ==================== 通用按钮样式 ==================== */
.ibl-zoom-close,
.ibl-zoom-prev,
.ibl-zoom-next,
.ibl-zoom-tool {
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.18);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  transition: background 0.2s ease, transform 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.32);
    transform: scale(1.06);
  }
  &:active { transform: scale(0.95); }
}

/* 关闭按钮（右上） */
.ibl-zoom-close {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 44px;
  height: 44px;
  font-size: 1.1rem;
  z-index: 10;
}

/* 左右切换按钮（垂直居中） */
.ibl-zoom-prev,
.ibl-zoom-next {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 64px;
  border-radius: 12px;
  font-size: 1.4rem;
  z-index: 10;

  &:hover { transform: translateY(-50%) scale(1.06); }
  &:active { transform: translateY(-50%) scale(0.95); }
}

.ibl-zoom-prev { left: 1.25rem; }
.ibl-zoom-next { right: 1.25rem; }

/* 移动端切换按钮缩小 */
@media (max-width: 768px) {
  .ibl-zoom-prev,
  .ibl-zoom-next {
    width: 38px;
    height: 52px;
    font-size: 1.2rem;
  }
  .ibl-zoom-prev { left: 0.5rem; }
  .ibl-zoom-next { right: 0.5rem; }
}

/* ==================== 缩放工具栏（底部居中） ==================== */
.ibl-zoom-toolbar {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.6rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 10;
  user-select: none;
}

.ibl-zoom-tool {
  width: 36px;
  height: 36px;
  font-size: 0.95rem;
  border-radius: 50%;

  &--label {
    width: auto;
    min-width: 60px;
    padding: 0 0.6rem;
    border-radius: 18px;
    font-size: 0.85rem;
    font-weight: 500;
    letter-spacing: 0.02em;
  }
  &--active {
    background: rgba(255, 255, 255, 0.32);
    color: #fff;
  }
}

.ibl-zoom-tool-sep {
  width: 1px;
  height: 20px;
  background: rgba(255, 255, 255, 0.25);
  margin: 0 0.2rem;
}

/* 计数指示器（左下） */
.ibl-zoom-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 1.5rem;
  padding: 0.4rem 0.8rem;
  border-radius: 999px;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  color: #fff;
  font-size: 0.85rem;
  font-weight: 500;
  letter-spacing: 0.05em;
  z-index: 10;
  pointer-events: none;
}

/* 移动端计数器位置调整（避免与工具栏重叠） */
@media (max-width: 768px) {
  .ibl-zoom-counter {
    bottom: 5rem;
    left: 50%;
    transform: translateX(-50%);
  }
}

/* 底部小描述 */
.ibl-zoom-caption {
  position: absolute;
  bottom: 5rem;
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
  z-index: 9;
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