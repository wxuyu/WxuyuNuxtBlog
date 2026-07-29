<script setup lang="ts">
import MainCard from '~/components/console/ConsoleMain.vue';

const props = defineProps<{
  show?: boolean
  open?: boolean
  duration?: number
  onClose?: () => void
}>()
const emit = defineEmits<{
  close: []
}>()

// 兼容两种调用方：
// - 本地 usePopoverStore: 传 show
// - @bikariya/modals:     传 open
const visible = computed(() => Boolean(props.open ?? props.show))

function handleClose() {
  if (props.onClose) {
    props.onClose()
  } else {
    emit('close')
  }
}

// 音乐播放器全局开关
const player = useMusicPlayer()
const { musicEnabled, setMusicEnabled } = player
</script>

<template>
  <Transition name="float-in">
    <div v-if="visible" class="popover-mask" @click="handleClose" />
  </Transition>

  <Transition name="float-in">
    <div v-if="visible" class="popover-panel">
      <div class="panel-header">
        <h2>
          音乐选择器
        </h2>
        <div class="header-right">
          <label class="music-toggle" title="开关音乐播放器">
            <span class="toggle-label">播放器</span>
            <input
              type="checkbox"
              :checked="musicEnabled"
              @change="setMusicEnabled(($event.target as HTMLInputElement).checked)"
              class="toggle-input"
            />
            <span class="toggle-track">
              <span class="toggle-thumb" />
            </span>
          </label>
          <button class="close-btn" aria-label="关闭" @click="handleClose">
            <Icon name="ph:x-bold" />
          </button>
        </div>
      </div>

      <ConsoleMusicSettings />
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.popover-mask {
  position: fixed;
  inset: 0;
  background-color: #0003;
  backdrop-filter: blur(0.2em);
  transition: opacity var(--delay, 200);
  z-index: 100;
  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
  }
}
.popover-panel {
  --float-distance: 20vh;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-height: 85vh;
  max-height: 85dvh;
  max-width: 500px;
  border: 1px solid var(--c-primary);
  border-radius: 1em;
  box-shadow: 0 0.25em 0.5em var(--ld-shadow);
  background-color: var(--ld-bg-card);
  padding: 1.2em;
  overflow-y: auto;
  transition: all var(--delay, 200);
  z-index: 1000;
  .panel-header {
    margin-bottom: 1em;
    display: flex;
    justify-content: space-between;
    align-items: center;
    h2 {
      margin: 0;
      font-size: 1.2em;
      font-weight: 600;
      color: var(--c-text);
    }
    .header-right {
      display: flex;
      align-items: center;
      gap: .6em;
    }
    .close-btn {
      padding: 0.4em;
      border: none;
      border-radius: 0.5em;
      background-color: transparent;
      color: var(--c-text-2);
      cursor: pointer;
      transition: all 0.1s;
      &:hover {
        background-color: var(--c-bg-soft);
        color: var(--c-text-1);
      }
    }
    .music-toggle {
      display: inline-flex;
      align-items: center;
      gap: .4em;
      cursor: pointer;
      user-select: none;

      .toggle-label {
        font-size: .78em;
        color: var(--c-text-2);
      }

      .toggle-input {
        position: absolute;
        width: 0;
        height: 0;
        opacity: 0;
        pointer-events: none;
      }

      .toggle-track {
        position: relative;
        width: 2.4em;
        height: 1.3em;
        border-radius: 1em;
        background: var(--c-border, hsl(0 0% 80%));
        transition: background .2s ease;

        .toggle-thumb {
          position: absolute;
          top: .15em;
          left: .15em;
          width: 1em;
          height: 1em;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 3px hsl(0 0% 0% / .18);
          transition: transform .2s ease;
        }
      }

      .toggle-input:checked + .toggle-track {
        background: var(--c-primary, hsl(355 70% 62%));

        .toggle-thumb {
          transform: translateX(1.1em);
        }
      }
    }
  }
  .panel-content {
    font-size: 0.95em;
    color: var(--c-text-1);
    line-height: 1.6;
  }
}
.float-in-enter-active,
.float-in-leave-active {
  transition: all var(--delay, 200);
}
.float-in-enter-from,
.float-in-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% - 20vh));
}
@media (max-width: 768px) {
  .popover-panel {
    width: 95vw;
    max-height: 75vh;
    max-height: 75dvh;
  }
}
</style>