<script setup lang="ts">
const props = defineProps<{
  heroStories: Array<{
    内容标题: string
    内容: Record<string, string>
    密钥: number
  }>
  顶部标题: string
}>()

const activeIndex = ref(0)

// 添加过渡动画方向
const slideDirection = ref<'left' | 'right'>('right')

function prevPage() {
  if (props.heroStories.length === 0) return
  if (activeIndex.value > 0) {
    slideDirection.value = 'left'
    activeIndex.value--
  }
}

function nextPage() {
  if (props.heroStories.length === 0) return
  if (activeIndex.value < props.heroStories.length - 1) {
    slideDirection.value = 'right'
    activeIndex.value++
  }
}

// 触摸滑动支持
const touchStartX = ref(0)
const touchEndX = ref(0)

// function handleTouchStart(e: TouchEvent) {
//   touchStartX.value = e.touches[0].clientX
// }

// function handleTouchMove(e: TouchEvent) {
//   touchEndX.value = e.touches[0].clientX
// }

function handleTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50 // 最小滑动距离

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextPage()
    } else {
      prevPage()
    }
  }
  
  touchStartX.value = 0
  touchEndX.value = 0
}
</script>

<template>
  <div class="storiesContainer">
    <div 
      class="storiesMain" 
      v-if="heroStories?.[activeIndex]"
    >
      <!-- 装饰性背景元素 -->
      <div class="decorative-bg">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <header class="storiesHeader">
        <div class="header-content">
          <span class="header-icon">📖</span>
          <h2 class="header-title">{{ 顶部标题 || '未写入' }}</h2>
        </div>
      </header>

      <main class="storiesBody">
        <Transition :name="`slide-${slideDirection}`" mode="out-in">
          <div :key="activeIndex" class="content-wrapper">
            <h3 class="storiesTitle">
              <span class="title-decorator"></span>
              {{ heroStories[activeIndex]?.内容标题 }}
            </h3>
            <div class="storiesContent">
              <p 
                class="storiesSpan" 
                v-for="([key, value], index) in Object.entries(heroStories[activeIndex]?.内容 ?? {})"
                :key="key"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                {{ value }}
              </p>
            </div>
          </div>
        </Transition>
      </main>

      <footer class="storiesFooter">
        <button 
          class="page-btn prev-btn" 
          @click="prevPage"
          :disabled="activeIndex === 0"
          aria-label="上一页"
        >
          <span class="btn-icon">◀</span>
          <span class="btn-text">上一页</span>
        </button>
        
        <div class="footerPageNumber">
          <span class="current-page">{{ heroStories[activeIndex]?.密钥 }}</span>
          <span class="separator">/</span>
          <span class="total-pages">{{ heroStories.length }}</span>
        </div>
        
        <button 
          class="page-btn next-btn" 
          @click="nextPage"
          :disabled="activeIndex === heroStories.length - 1"
          aria-label="下一页"
        >
          <span class="btn-text">下一页</span>
          <span class="btn-icon">▶</span>
        </button>
      </footer>

      <!-- 进度指示器 -->
      <!-- <div class="progress-dots">
        <span 
          v-for="(story, index) in heroStories.slice(0, 5)" 
          :key="story.密钥"
          class="dot"
          :class="{ active: index === activeIndex }"
          @click="activeIndex = index"
        ></span>
        <span v-if="heroStories.length > 5" class="dot-more">...</span>
      </div> -->
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <p class="empty-text">暂无故事内容</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.storiesContainer {
  margin-top: 24px;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 0.75em;
  padding: 24px;
  transition: all .3s;
  position: relative;
  overflow: hidden;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);

  // 移动端适配
  @media (max-width: 768px) {
    margin-top: 16px;
    padding: 16px;
    border-radius: 0.5em;
  }

  .storiesMain {
    position: relative;
    z-index: 1;

    // 装饰性背景
    .decorative-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.4;
      z-index: 0;

      .circle {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, var(--pink-core) 0%, transparent 70%);
        opacity: 0.1;
        animation: float 8s ease-in-out infinite;

        &.circle-1 {
          width: 200px;
          height: 200px;
          top: -50px;
          right: -50px;
        }

        &.circle-2 {
          width: 150px;
          height: 150px;
          bottom: -30px;
          left: -30px;
          animation-delay: -4s;
        }
      }
    }

    .storiesHeader {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 140, 176, .2);
      margin-bottom: 20px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 12px 16px;
        margin-bottom: 16px;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          font-size: 1.5rem;
          animation: pulse 2s ease-in-out infinite;

          @media (max-width: 768px) {
            font-size: 1.3rem;
          }
        }

        .header-title {
          font-size: 1.3rem;
          color: var(--pink-core);
          margin: 0;
          font-weight: 600;
          letter-spacing: 0.5px;

          @media (max-width: 768px) {
            font-size: 1.1rem;
          }
        }
      }
    }

    .storiesBody {
      padding: 0 20px;
      min-height: 200px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 0 16px;
        min-height: 180px;
      }

      .content-wrapper {
        animation: fadeInContent 0.3s ease-out;
      }

      .storiesTitle {
        font-size: 1.2rem;
        color: var(--blue-glow);
        margin-bottom: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        line-height: 1.4;

        @media (max-width: 768px) {
          font-size: 1.05rem;
          margin-bottom: 12px;
        }

        .title-decorator {
          width: 4px;
          height: 1.2em;
          background: linear-gradient(to bottom, var(--blue-glow), var(--pink-core));
          border-radius: 2px;
          flex-shrink: 0;
        }
      }

      .storiesContent {
        .storiesSpan {
          display: block;
          margin-bottom: 12px;
          line-height: 1.8;
          color: var(--c-text);
          font-size: 0.95rem;
          opacity: 0;
          animation: fadeInUp 0.4s ease-out forwards;

          @media (max-width: 768px) {
            font-size: 0.9rem;
            line-height: 1.7;
            margin-bottom: 10px;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .storiesFooter {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 140, 176, .2);
      margin-top: 20px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 12px 16px;
        margin-top: 16px;
        gap: 8px;
      }

      .page-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px solid var(--c-border);
        background: transparent;
        color: var(--blue-glow);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        font-weight: 500;

        @media (max-width: 768px) {
          padding: 6px 12px;
          font-size: 0.85rem;
          gap: 4px;
        }

        .btn-icon {
          transition: transform 0.3s ease;
        }

        .btn-text {
          @media (max-width: 480px) {
            display: none;
          }
        }

        &:hover:not(:disabled) {
          background: var(--blue-glow);
          color: white;
          border-color: var(--blue-glow);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          .btn-icon {
            transform: scale(1.2);
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        &.prev-btn .btn-icon {
          &:hover {
            transform: translateX(-3px);
          }
        }

        &.next-btn .btn-icon {
          &:hover {
            transform: translateX(3px);
          }
        }
      }

      .footerPageNumber {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--blue-glow);
        font-weight: 600;
        font-size: 1rem;

        @media (max-width: 768px) {
          font-size: 0.9rem;
        }

        .current-page {
          font-size: 1.2em;
          color: var(--pink-core);
        }

        .separator {
          opacity: 0.5;
        }

        .total-pages {
          opacity: 0.7;
        }
      }
    }

    // 进度指示器
    .progress-dots {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 12px 0 0;
      position: relative;
      z-index: 1;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--c-border);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--blue-glow);
          transform: scale(1.3);
        }

        &.active {
          background: var(--pink-core);
          width: 24px;
          border-radius: 4px;
          transform: scale(1);
        }
      }

      .dot-more {
        color: var(--c-border);
        font-weight: bold;
        padding: 0 4px;
      }
    }
  }

  // 空状态
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--c-text);
    opacity: 0.6;

    @media (max-width: 768px) {
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      animation: pulse 2s ease-in-out infinite;

      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }

    .empty-text {
      font-size: 1rem;
      margin: 0;
    }
  }
}

// 过渡动画
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

// 关键帧动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInContent {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(10px, -10px) scale(1.05);
  }
  66% {
    transform: translate(-10px, 10px) scale(0.95);
  }
}
</style>
