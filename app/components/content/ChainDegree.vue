<script setup lang="ts">
// ==================== 类型 ====================
interface ChainNode {
  名称: string
  效果: string
  图标?: string
}

type GameKey = '鸣潮' | '原神' | '崩铁' | '崩坏三'

interface Props {
  游戏: GameKey
  角色: string
  链度: ChainNode[]
  头像?: string
  默认展开?: number // 默认展开第几链（0 = 全部收起）
}

const props = withDefaults(defineProps<Props>(), {
  默认展开: 1,
})

// ==================== 游戏配置 ====================
const gameConfig: Record<GameKey, {
  系统: string
  主题色: string
  辅色: string
  图标: string
  链前缀: string
  链后缀: string
  背景层: string
  边框: string
  头部字体: string
  装饰: string
}> = {
  鸣潮: {
    系统: '共鸣链',
    主题色: '#5ce0e8',
    辅色: '#1a4a52',
    图标: 'ph:waves-bold',
    链前缀: '共鸣',
    链后缀: '',
    背景层: 'linear-gradient(180deg, rgba(20,40,48,0.95), rgba(12,28,34,0.98))',
    边框: 'rgba(92,224,232,0.25)',
    头部字体: "'Segoe UI', sans-serif",
    装饰: 'wave',
  },
  原神: {
    系统: '命之座',
    主题色: '#e0b85c',
    辅色: '#4a3818',
    图标: 'ph:star-fill',
    链前缀: '第',
    链后缀: '座',
    背景层: 'linear-gradient(180deg, rgba(48,38,18,0.95), rgba(30,24,12,0.98))',
    边框: 'rgba(224,184,92,0.3)',
    头部字体: "'Georgia', serif",
    装饰: 'star',
  },
  崩铁: {
    系统: '星魂',
    主题色: '#b89cff',
    辅色: '#2a1a4a',
    图标: 'ph:sparkle-fill',
    链前缀: '星魂',
    链后缀: '',
    背景层: 'linear-gradient(180deg, rgba(24,18,48,0.95), rgba(14,10,30,0.98))',
    边框: 'rgba(184,156,255,0.25)',
    头部字体: "'Segoe UI', sans-serif",
    装饰: 'diamond',
  },
  崩坏三: {
    系统: '晋升',
    主题色: '#ff6b9d',
    辅色: '#4a1830',
    图标: 'ph:crown-fill',
    链前缀: '晋升',
    链后缀: '阶',
    背景层: 'linear-gradient(180deg, rgba(48,18,32,0.95), rgba(30,12,22,0.98))',
    边框: 'rgba(255,107,157,0.3)',
    头部字体: "'Segoe UI', sans-serif",
    装饰: 'cross',
  },
}

const cfg = computed(() => gameConfig[props.游戏])

// ==================== 手风琴状态 ====================
const expandedSet = ref<Set<number>>(new Set())

// 初始化默认展开
onMounted(() => {
  if (props.默认展开 > 0 && props.链度[props.默认展开 - 1]) {
    expandedSet.value.add(props.默认展开)
  }
})

function toggle(index: number) {
  if (!props.链度[index]) return
  if (expandedSet.value.has(index + 1)) {
    expandedSet.value.delete(index + 1)
  } else {
    expandedSet.value.add(index + 1)
  }
}

function isExpanded(index: number): boolean {
  return expandedSet.value.has(index + 1)
}

function expandAll() {
  props.链度.forEach((_, i) => expandedSet.value.add(i + 1))
}

function collapseAll() {
  expandedSet.value.clear()
}

// 链阶标签
function chainLabel(index: number): string {
  return `${cfg.value.链前缀}${index}${cfg.value.链后缀}`
}

// 已解锁数
const unlockedCount = computed(() => props.链度?.length ?? 0)
</script>

<template>
<div
  class="cd-accordion"
  :style="{
    '--cd-primary': cfg.主题色,
    '--cd-secondary': cfg.辅色,
    '--cd-border': cfg.边框,
    '--cd-bg': cfg.背景层,
    '--cd-font': cfg.头部字体,
  }"
>
  <!-- ========== 游戏风头部 ========== -->
  <div class="cd-header" :data-game="props.游戏">
    <div class="cd-header-bg"></div>
    <div class="cd-header-content">
      <NuxtImg v-if="头像" :src="头像" class="cd-avatar" :alt="角色" />
      <div v-else class="cd-avatar-placeholder">
        <Icon :name="cfg.图标" />
      </div>
      <div class="cd-header-text">
        <div class="cd-sys-badge">
          <Icon :name="cfg.图标" class="cd-sys-icon" />
          <span>{{ cfg.系统 }}</span>
        </div>
        <h3 class="cd-char-name">{{ 角色 }}</h3>
      </div>
      <div class="cd-header-meta">
        <span class="cd-count">{{ unlockedCount }}/6</span>
        <div class="cd-actions">
          <button class="cd-action-btn" @click="expandAll" title="全部展开">
            <Icon name="ph:arrows-out-line-vertical-bold" />
          </button>
          <button class="cd-action-btn" @click="collapseAll" title="全部收起">
            <Icon name="ph:arrows-in-line-vertical-bold" />
          </button>
        </div>
      </div>
    </div>
  </div>

  <!-- ========== 手风琴列表 ========== -->
  <div class="cd-list">
    <div
      v-for="(node, index) in 链度"
      :key="index"
      class="cd-item"
      :class="{ expanded: isExpanded(index) }"
    >
      <!-- 折叠头部 -->
      <button class="cd-item-header" @click="toggle(index)">
        <div class="cd-item-left">
          <div class="cd-chain-num" :data-game="props.游戏">
            <span>{{ index + 1 }}</span>
          </div>
          <div class="cd-chain-label">
            <span class="cd-chain-stage">{{ chainLabel(index + 1) }}</span>
            <span class="cd-chain-name">{{ node.名称 }}</span>
          </div>
        </div>
        <div class="cd-item-right">
          <Icon
            :name="isExpanded(index) ? 'ph:caret-up-bold' : 'ph:caret-down-bold'"
            class="cd-caret"
          />
        </div>
      </button>

      <!-- 展开内容 -->
      <Transition name="cd-expand">
        <div v-show="isExpanded(index)" class="cd-item-body">
          <div class="cd-effect-box">
            <div class="cd-effect-decoration" :data-game="props.游戏"></div>
            <div class="cd-effect-text">
              <slot :name="`chain${index + 1}`">
                <p>{{ node.效果 }}</p>
              </slot>
            </div>
          </div>
        </div>
      </Transition>
    </div>
  </div>
</div>
</template>

<style lang="scss" scoped>
/* ============================================================
   游戏UI风链度手风琴 — 四款游戏独立主题
   ============================================================ */

.cd-accordion {
  margin: 1.5rem 0;
  border-radius: 0.6rem;
  overflow: hidden;
  border: 1px solid var(--cd-border);
  background: var(--cd-bg);
  font-family: var(--cd-font);
  box-shadow: 0 4px 24px rgba(0,0,0,0.25), 0 0 1px var(--cd-primary);
}

/* ==================== 头部 ==================== */
.cd-header {
  position: relative;
  overflow: hidden;
  border-bottom: 1px solid var(--cd-border);

  .cd-header-bg {
    position: absolute;
    inset: 0;
    opacity: 0.08;
    background:
      radial-gradient(ellipse at 20% 50%, var(--cd-primary), transparent 60%),
      radial-gradient(ellipse at 80% 50%, var(--cd-primary), transparent 60%);
  }

  .cd-header-content {
    position: relative;
    display: flex;
    align-items: center;
    gap: 0.8rem;
    padding: 0.9rem 1rem;
  }

  .cd-avatar {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    object-fit: cover;
    border: 2px solid var(--cd-primary);
    box-shadow:
      0 0 14px color-mix(in srgb, var(--cd-primary) 35%, transparent),
      inset 0 0 6px color-mix(in srgb, var(--cd-primary) 20%, transparent);
  }

  .cd-avatar-placeholder {
    width: 52px;
    height: 52px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 2px solid var(--cd-primary);
    background: color-mix(in srgb, var(--cd-secondary) 60%, transparent);
    color: var(--cd-primary);
    font-size: 1.4rem;
    box-shadow: 0 0 14px color-mix(in srgb, var(--cd-primary) 25%, transparent);
  }

  .cd-header-text {
    flex: 1;

    .cd-sys-badge {
      display: inline-flex;
      align-items: center;
      gap: 0.3em;
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--cd-primary);
      opacity: 0.85;
      margin-bottom: 0.15rem;
    }

    .cd-sys-icon {
      font-size: 0.85em;
    }

    .cd-char-name {
      margin: 0;
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      text-shadow: 0 0 10px color-mix(in srgb, var(--cd-primary) 40%, transparent);
    }
  }

  .cd-header-meta {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 0.3rem;

    .cd-count {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--cd-primary);
      font-variant-numeric: tabular-nums;
      letter-spacing: 0.05em;
    }

    .cd-actions {
      display: flex;
      gap: 0.2rem;

      .cd-action-btn {
        width: 26px;
        height: 26px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: 1px solid var(--cd-border);
        border-radius: 0.3rem;
        background: color-mix(in srgb, var(--cd-secondary) 40%, transparent);
        color: var(--cd-primary);
        cursor: pointer;
        opacity: 0.6;
        transition: all 0.2s ease;

        &:hover {
          opacity: 1;
          border-color: var(--cd-primary);
          background: color-mix(in srgb, var(--cd-primary) 15%, transparent);
        }
      }
    }
  }
}

/* ==================== 手风琴列表 ==================== */
.cd-list {
  display: flex;
  flex-direction: column;
}

.cd-item {
  border-bottom: 1px solid color-mix(in srgb, var(--cd-border) 50%, transparent);

  &:last-child {
    border-bottom: none;
  }
}

.cd-item-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.7rem 1rem;
  cursor: pointer;
  border: none;
  background: transparent;
  color: inherit;
  transition: background 0.2s ease;

  &:hover {
    background: color-mix(in srgb, var(--cd-primary) 6%, transparent);
  }

  .cd-item-left {
    display: flex;
    align-items: center;
    gap: 0.8rem;
  }

  /* 链阶编号 — 游戏特色装饰 */
  .cd-chain-num {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1rem;
    font-weight: 800;
    color: var(--cd-primary);
    flex-shrink: 0;
    position: relative;

    /* 鸣潮：波纹圆环 */
    &[data-game="鸣潮"] {
      border-radius: 50%;
      border: 2px solid var(--cd-primary);
      background: radial-gradient(circle, color-mix(in srgb, var(--cd-primary) 15%, transparent), transparent);
      box-shadow: 0 0 8px color-mix(in srgb, var(--cd-primary) 20%, transparent);

      &::before {
        content: '';
        position: absolute;
        inset: -4px;
        border-radius: 50%;
        border: 1px solid color-mix(in srgb, var(--cd-primary) 30%, transparent);
        opacity: 0.5;
      }
    }

    /* 原神：六角星框 */
    &[data-game="原神"] {
      clip-path: polygon(50% 0%, 65% 25%, 100% 50%, 65% 75%, 50% 100%, 35% 75%, 0% 50%, 35% 25%);
      background: color-mix(in srgb, var(--cd-primary) 12%, transparent);
      border: 1px solid var(--cd-primary);

      span { position: relative; z-index: 1; }
    }

    /* 崩铁：菱形棱角 */
    &[data-game="崩铁"] {
      transform: rotate(45deg);
      border: 2px solid var(--cd-primary);
      background: color-mix(in srgb, var(--cd-primary) 10%, transparent);

      span { transform: rotate(-45deg); }
    }

    /* 崩坏三：十字徽章 */
    &[data-game="崩坏三"] {
      border-radius: 4px;
      border: 2px solid var(--cd-primary);
      background: linear-gradient(135deg, color-mix(in srgb, var(--cd-primary) 15%, transparent), transparent);

      &::after {
        content: '';
        position: absolute;
        width: 2px;
        height: 120%;
        background: color-mix(in srgb, var(--cd-primary) 20%, transparent);
      }
    }
  }

  .cd-chain-label {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;

    .cd-chain-stage {
      font-size: 0.7rem;
      font-weight: 600;
      letter-spacing: 0.06em;
      color: var(--cd-primary);
      opacity: 0.75;
    }

    .cd-chain-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: rgba(255,255,255,0.9);
    }
  }

  .cd-item-right {
    .cd-caret {
      font-size: 0.9rem;
      color: var(--cd-primary);
      opacity: 0.6;
      transition: transform 0.3s ease;
    }
  }

  /* 展开态高亮 */
  .cd-item.expanded & {
    background: color-mix(in srgb, var(--cd-primary) 8%, transparent);

    .cd-caret {
      opacity: 1;
    }

    .cd-chain-name {
      color: #fff;
    }
  }
}

/* ==================== 展开内容 ==================== */
.cd-item-body {
  overflow: hidden;
}

.cd-effect-box {
  position: relative;
  margin: 0 1rem 0.8rem 1rem;
  padding: 0.8rem 1rem 0.8rem 1.2rem;
  border-radius: 0.4rem;
  background: linear-gradient(
    90deg,
    color-mix(in srgb, var(--cd-primary) 8%, transparent) 0%,
    color-mix(in srgb, var(--cd-secondary) 15%, transparent) 100%
  );
  border-left: 3px solid var(--cd-primary);

  /* 游戏特色装饰条 */
  .cd-effect-decoration {
    position: absolute;
    top: 0;
    right: 0;
    width: 60px;
    height: 100%;
    opacity: 0.06;
    pointer-events: none;

    &[data-game="鸣潮"] {
      background: repeating-linear-gradient(
        90deg,
        var(--cd-primary) 0,
        var(--cd-primary) 2px,
        transparent 2px,
        transparent 8px
      );
    }

    &[data-game="原神"] {
      background: radial-gradient(circle at right, var(--cd-primary), transparent 70%);
    }

    &[data-game="崩铁"] {
      background: repeating-linear-gradient(
        45deg,
        var(--cd-primary) 0,
        var(--cd-primary) 1px,
        transparent 1px,
        transparent 10px
      );
    }

    &[data-game="崩坏三"] {
      background: linear-gradient(135deg, transparent 40%, var(--cd-primary) 50%, transparent 60%);
    }
  }

  .cd-effect-text {
    position: relative;
    font-size: 0.85rem;
    line-height: 1.75;
    color: rgba(255,255,255,0.8);

    :deep(p) {
      margin: 0;
    }
  }
}

/* ==================== 展开过渡动画 ==================== */
.cd-expand-enter-active,
.cd-expand-leave-active {
  transition: max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease;
  max-height: 500px;
  overflow: hidden;
}

.cd-expand-enter-from,
.cd-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

/* ==================== 移动端 ==================== */
@media (max-width: 768px) {
  .cd-accordion {
    border-radius: 0.4rem;
  }

  .cd-header .cd-header-content {
    padding: 0.7rem 0.8rem;
    gap: 0.6rem;
  }

  .cd-avatar,
  .cd-avatar-placeholder {
    width: 42px;
    height: 42px;
  }

  .cd-char-name {
    font-size: 1rem;
  }

  .cd-header-meta .cd-actions {
    display: none; // 移动端隐藏批量操作
  }

  .cd-item-header {
    padding: 0.6rem 0.8rem;
  }

  .cd-chain-num {
    width: 30px;
    height: 30px;
    font-size: 0.85rem;
  }

  .cd-chain-name {
    font-size: 0.85rem;
  }

  .cd-effect-box {
    margin: 0 0.6rem 0.6rem 0.6rem;
    padding: 0.6rem 0.8rem;
  }

  .cd-effect-text {
    font-size: 0.8rem;
  }
}
</style>
