/**
 * ViewImage 替代品：图片灯箱（lightbox）
 *
 * 原 view-image.min.js (tokinx/ViewImage v2.0.2, 7612 字节)
 * 这里用原生 v-if + Teleport 实现，等价功能：
 * - 点击图片放大查看
 * - ESC 关闭 / 点击遮罩关闭
 * - 滚动锁定
 * - 多图左右切换
 *
 * 用法（不直接调用 composable，而是用 <MemosLightbox> 组件）：
 *   <MemosLightbox :images="imgList" v-model:open="open" :index="idx" />
 */
import { onBeforeUnmount, ref } from 'vue'

/**
 * 灯箱控制器（composable）
 *
 * 提供 open/close/switch 逻辑 + 滚动锁定副作用
 *
 * @example
 *   const lb = useLightbox()
 *   const onClickImage = (i: number) => lb.open(images, i)
 *   <MemosLightbox v-bind="lb.state" @close="lb.close" @switch="lb.switch" />
 */
export function useLightbox() {
  const state = ref<{
    open: boolean
    images: string[]
    index: number
  }>({
    open: false,
    images: [],
    index: 0,
  })

  /** 滚动锁定副作用 token（避免组件 unmount 后还锁着） */
  let lockToken = 0

  function lockScroll() {
    if (typeof document === 'undefined') return
    const token = ++lockToken
    const prevOverflow = document.body.style.overflow
    const prevPaddingRight = document.body.style.paddingRight
    // 滚动条消失导致的页面跳动补偿
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    document.body.style.overflow = 'hidden'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }
    onBeforeUnmount(() => {
      if (token === lockToken) {
        document.body.style.overflow = prevOverflow
        document.body.style.paddingRight = prevPaddingRight
      }
    })
  }

  function open(images: string[], index = 0) {
    state.value = { open: true, images, index }
    lockScroll()
  }

  function close() {
    state.value.open = false
  }

  function switchTo(delta: number) {
    const len = state.value.images.length
    if (len === 0) return
    state.value.index = (state.value.index + delta + len) % len
  }

  return { state, open, close, switchTo }
}

/**
 * 全局键盘监听（ESC 关闭 / ← → 切换）
 *
 * 在组件 setup() 中调用一次即可
 */
export function useLightboxKeyboard(
  state: { open: boolean; index: number; images: string[] },
  close: () => void,
  switchTo: (delta: number) => void,
) {
  if (typeof window === 'undefined') return

  const onKey = (e: KeyboardEvent) => {
    if (!state.open) return
    if (e.key === 'Escape') close()
    else if (e.key === 'ArrowLeft') switchTo(-1)
    else if (e.key === 'ArrowRight') switchTo(1)
  }
  window.addEventListener('keydown', onKey)
  onBeforeUnmount(() => window.removeEventListener('keydown', onKey))
}
