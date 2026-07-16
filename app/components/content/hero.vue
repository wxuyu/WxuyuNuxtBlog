<script setup lang="ts">
// ==================== 类型定义 ====================
interface Props {
  类型: '爱弥斯' | '尤诺' | '奥古斯塔';
  头像: string;
  徽章: Record<string, string>;
  名字: string;
  标签: Record<string, string>;
  简介: string[];
  详情信息: Record<string, string>;
  档案: {
    具体信息: Array<{
      序号: number;
      徽章: string;
    }>;
    外挂信息: {
      简介: string[];
    };
    顶栏信息: {
      主标题: string;
    };
  };
}

const props = defineProps<Props>();

// ==================== 计算属性 ====================
const getInfoGridColumns = (type: string): number => {
  const columnMap: Record<string, number> = {
    爱弥斯: 4,
    尤诺: 3,
    奥古斯塔: 3,
  };
  return columnMap[type] || 3;
};
</script>

<template>
  <div class="hero-main">
    <div class="hero-card">
      <!-- ==================== 左侧头像区 ==================== -->
      <div class="left-info">
        <NuxtImg class="avatar-image" :src="头像" />
        <h3 class="avatar-name">{{ 名字 }}</h3>
        <div class="avatar-meta">
          <span
            v-for="[key, value] in Object.entries(徽章 ?? {})"
            :key="key"
            class="meta-tag"
          >
            {{ key }}:{{ value }}
          </span>
        </div>
      </div>

      <!-- ==================== 右侧内容区 ==================== -->
      <div class="right-info">
        <div class="panel-main">
          <!-- 简介 -->
          <showcase-section-title title="简介" />
          <div class="hero-desc">
            <slot name="desc" />
          </div>

          <!-- 标签 -->
          <showcase-section-title title="标签" />
          <div class="tag-container">
            <span
              v-for="[key, value] in Object.entries(标签 ?? {})"
              :key="key"
              class="tag"
            >
              #{{ value }}
            </span>
          </div>

          <!-- 详情信息 -->
          <showcase-section-title title="详情信息" />
          <div
            class="info-grid"
            :style="{ gridTemplateColumns: `repeat(${getInfoGridColumns(类型)}, 1fr)` }"
          >
            <div
              v-for="[key, value] in Object.entries(详情信息 ?? {})"
              :key="key"
              class="info-item"
            >
              <div class="info-label">{{ key }}</div>
              <div class="info-value">{{ value }}</div>
            </div>
          </div>

          <!-- 档案 -->
          <showcase-section-title :title="档案?.顶栏信息.主标题" />
          <div
            v-for="data in 档案?.具体信息"
            :key="data.序号"
            class="status-card"
            :class="`type-${类型}`"
          >
            <div class="status-header">
              <div
                v-for="(item, index) in 档案.外挂信息.简介 ?? []"
                v-show="data.序号 === index + 1"
                :key="index"
                class="header-title"
              >
                {{ item }}
              </div>
              <div
                v-if="类型 === '爱弥斯'"
                class="header-badge"
                :class="`badge-${data.序号}`"
              >
                {{ data.徽章 }}
              </div>
            </div>
            <div class="status-content">
              <div
                v-for="statusIndex in 档案?.外挂信息.简介.length"
                v-show="data.序号 === statusIndex"
                :key="statusIndex"
              >
                <slot :name="`status${statusIndex}`" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ==================== 主容器样式(保持原样) ==================== */
.hero-main {
  width: 100%;
  height: 320px;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.3s ease;
  display: flex;
}

.hero-card {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

/* ==================== 左侧头像区(保持原样) ==================== */
.left-info {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s;
  overflow: hidden;

  .avatar-image {
    width: 100%;
    height: auto;
    border-radius: 12px;
    display: block;
  }

  .avatar-name {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    color: var(--c-text);
  }

  .avatar-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 4px;

    .meta-tag {
      font-size: 12px;
      font-weight: 600;
      color: var(--c-text-sub);
      background: rgba(255, 140, 176, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--pink-core);
    }
  }
}

/* ==================== 右侧内容区(保持原样) ==================== */
.right-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.panel-main {
  position: relative;
  z-index: 6;

  .hero-desc {
    font-size: 14px;
    color: var(--c-text-content);
    line-height: 1.6;
    margin-bottom: 1rem;
  }
}

/* ==================== 标签样式(保持原样) ==================== */
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em 0.6em;
  margin: 0.5em 0;

  .tag {
    background-color: var(--c-bg-soft);
    border-radius: 0.4em;
    color: var(--c-text-soft);
    font-size: 0.9em;
    padding: 0.25em 0.6em;
    transition: all 0.2s;
    cursor: pointer;

    &:hover {
      background-color: var(--c-primary-soft);
      color: var(--c-primary);
    }
  }
}

/* ==================== 详情信息网格(保持原样) ==================== */
.info-grid {
  display: grid;
  gap: 0.4rem;
  margin: 0.5em 0;
  font-size: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0.5em 0;

  .info-label {
    color: var(--c-text-2);
    font-size: 0.8rem;
    font-weight: 500;
  }

  .info-value {
    color: var(--c-text);
    font-size: 0.8rem;
    word-break: break-word;
  }
}

/* ==================== 档案状态卡(保持原样) ==================== */
.status-card {
  background: rgba(122, 92, 61, 0.08);
  border-radius: 6px;
  padding: 10px;
  margin-top: 0.5em;

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .header-title {
      font-weight: 600;
      color: var(--c-text);
    }

    .header-badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;

      &.badge-1 {
        background: rgba(255, 0, 0, 0.2);
        color: #ff6b85;
      }
    }
  }

  &.type-尤诺 .status-header {
    margin-bottom: 2px;
  }

  .status-content {
    font-size: 13px;
    color: var(--c-text-content);
    line-height: 1.5;
  }
}

/* ==================== 移动端适配(保持原样) ==================== */
@media screen and (max-width: 768px) {
  .hero-main {
    height: auto;
    margin: 1rem 0;
    border-radius: 0.5rem;
  }

  .hero-card {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .left-info {
    width: 100%;
    padding: 0.5rem;
    border-radius: 10px;

    .avatar-image {
      width: 200px;
      height: 200px;
      border-radius: 8px;
    }

    .avatar-name {
      font-size: 12px;
      margin-top: 4px;
    }

    .avatar-meta {
      font-size: 0.7rem;
      gap: 4px;

      .meta-tag {
        font-size: 0.7rem;
        padding: 3px 6px;
        border-radius: 6px;
      }
    }
  }

  .panel-main {
    .hero-desc {
      font-size: 0.85rem;
      line-height: 1.4;
    }
  }

  .tag-container {
    gap: 0.2em 0.4em;

    .tag {
      font-size: 0.75em;
      padding: 0.2em 0.5em;
    }
  }

  .info-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.2rem;
    font-size: 0.8rem;
  }

  .info-item {
    gap: 0.1rem;

    .info-label,
    .info-value {
      font-size: 0.75rem;
    }
  }

  .status-card {
    padding: 8px;
    border-radius: 5px;

    .status-header {
      gap: 6px;
      margin-bottom: 4px;
    }

    .status-content {
      font-size: 0.8rem;
      line-height: 1.4;
    }
  }
}
</style>