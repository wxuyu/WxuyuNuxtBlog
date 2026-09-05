<!--
  MemosLightbox.vue — 图片灯箱
-->
<script setup lang="ts">
import { computed, watch } from 'vue'
import { useLightboxKeyboard } from '~/composables/useLightbox'

interface Props {
  open: boolean
  images: string[]
  index: number
}

const props = defineProps<Props>()
const emit = defineEmits<{
  close: []
  switch: [delta: number]
}>()

const current = computed(() => props.images[props.index] ?? '')

function close() {
  emit('close')
}
function prev() {
  emit('switch', -1)
}
function next() {
  emit('switch', 1)
}

useLightboxKeyboard(
  { open: props.open, index: props.index, images: props.images },
  close,
  (d) => emit('switch', d),
)
</script>

<template>
  <Teleport to="body">
    <Transition name="lb-anim">
      <div v-if="open" class="lb-mask" @click.self="close">
        <button class="lb-close" type="button" aria-label="关闭" @click="close">
          ✕
        </button>
        <button v-if="images.length > 1" class="lb-prev" type="button" aria-label="上一张" @click="prev">
          ‹
        </button>
        <button v-if="images.length > 1" class="lb-next" type="button" aria-label="下一张" @click="next">
          ›
        </button>
        <div class="lb-stage">
          <img v-if="current" :src="current" :alt="`图片-${index + 1}`" class="lb-img" referrerpolicy="no-referrer">
        </div>
        <div v-if="images.length > 1" class="lb-counter">
          {{ index + 1 }} / {{ images.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped lang="scss">
.lb-mask {
  position: fixed;
  inset: 0;
  z-index: 999999;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.lb-stage {
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.lb-img {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 0 32px rgba(0, 0, 0, 0.5);
}

.lb-close,
.lb-prev,
.lb-next {
  position: absolute;
  background: rgba(255, 255, 255, 0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
}

.lb-close {
  top: 1.5rem;
  right: 1.5rem;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1.25rem;
}

.lb-prev {
  left: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
}

.lb-next {
  right: 1.5rem;
  top: 50%;
  transform: translateY(-50%);
  width: 3rem;
  height: 3rem;
  font-size: 2rem;
}

.lb-counter {
  position: absolute;
  bottom: 1.5rem;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.85);
  font-size: 0.875rem;
  background: rgba(0, 0, 0, 0.4);
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
}

// 动画
.lb-anim-enter-active,
.lb-anim-leave-active {
  transition: opacity 0.2s ease;
}
.lb-anim-enter-from,
.lb-anim-leave-to {
  opacity: 0;
}
</style>
