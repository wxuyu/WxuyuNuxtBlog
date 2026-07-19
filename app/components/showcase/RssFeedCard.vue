<script setup lang="ts">
import type { CircleArticleData } from '~/types/circle'

const props = defineProps<{
  data: CircleArticleData
  /** 共享时间源（来自父组件），避免每张卡片各自创建定时器 */
  now?: Date
}>()

/** 24 小时阈值：超过则不再显示相对时间，直接展示原始请求时间 */
const HOURS_THRESHOLD = 24

// 独立定时器（仅在无共享时间源时作为回退）
const localNow = useNow({ interval: 60_000 })

// 优先使用父组件传入的共享时间源，减少全局定时器数量
const effectiveNow = computed<Date>(() => {
  if (props.now instanceof Date && !isNaN(props.now.getTime())) {
    return props.now
  }
  return localNow.value
})

// 将 props.data.updated 解析为 Date；解析失败则返回 null
const updatedDate = computed(() => {
  if (!props.data.updated)
    return null
  const d = new Date(props.data.updated)
  return Number.isNaN(d.getTime()) ? null : d
})

// 是否处于 24 小时窗口内（仅展示"动态"相对时间；超出则展示原始时间）
const isWithin24h = computed(() => {
  if (!updatedDate.value)
    return false
  const diffMs = effectiveNow.value.getTime() - updatedDate.value.getTime()
  // 防御未来时间：未来时间（diffMs < 0）走原始时间分支
  return diffMs >= 0 && diffMs < HOURS_THRESHOLD * 60 * 60 * 1000
})

/**
 * AI 模型关键词 → 图标 映射
 * 按子串匹配，顺序敏感：长关键词放前面，避免短关键词提前误匹配
 * 如 "bigmodel-glm-4-flash" 匹配到 "glm" → 显示 GLM 对应图标
 */
const MODEL_ICON_MAP: [keyword: string, icon: string][] = [
  ['deepseek',      'hugeicons:deepseek'],
  ['chatglm',       'mingcute:ai-line'],
  ['glm',           'model iconfont model-icon-glm'],
  ['gpt-4o',        'simple-icons:openai'],
  ['gpt-4',         'simple-icons:openai'],
  ['gpt',           'simple-icons:openai'],
  ['o1',            'simple-icons:openai'],
  ['o3',            'simple-icons:openai'],
  ['claude',        'hugeicons:claude'],
  ['gemini',        'hugeicons:google-gemini'],
  ['gemma',          'model iconfont model-icon-gemma'],
  ['qwen',          'hugeicons:qwen'],
  ['kimi',          'model iconfont model-icon-kimi'],
  ['minimax',       'model iconfont model-icon-minimax'],
  ['hunyuan',       'model iconfont model-icon-hunyuan'],
  ['doubao',        'model iconfont model-icon-doubao'],
  ['moonshot',      'model iconfont model-icon-moonshot'],
]

/** 根据 ai_model 按子串匹配返回对应图标，无匹配则回退默认图标 */
const modelIcon = computed(() => {
  const model = props.data.ai_model?.toLowerCase() ?? ''
  for (const [keyword, icon] of MODEL_ICON_MAP) {
    if (model.includes(keyword)) return icon
  }
  return 'mdi-robot'
})
</script>

<template>
  <div class="circle-card">
    <div class="circle-card-top">
      <h6 class="circle-card-top-title">
        <a class="circle-card-top-link" :href="props.data.link" target="_blank" :title="props.data.title">
          {{ props.data.title }}
        </a>
      </h6>
      <div class="circle-card-top-summary">
        {{ props.data.summary }}
      </div>
    </div>
    <div class="circle-card-footer">
      <div class="circle-card-footer-left">
        <a class="circle-card-footer-info" :href="props.data.link" target="_blank" :title="props.data.author">
          <NuxtImg class="circle-card-footer-image" :src="props.data.avatar" width="48" height="48"/>
          <div class="circle-card-footer-author">
            {{ props.data.author }}
          </div>
        </a>
        <div class="circle-card-footer-summary">
          <Icon
            :name="modelIcon"
            class="circle-card-footer-icon"
            size="1.2em"
            v-tip="`该文章使用 ${props.data.ai_model} 作为摘要`"
          />
        </div>
      </div>
      <div class="circle-card-footer-right">
        <div class="circle-card-footer-time">
          <!-- 1) 解析失败：回退原始字符串，避免空白 -->
          <template v-if="!updatedDate">
            {{ props.data.updated }}
          </template>
          <!-- 2) 24 小时内：相对时间（如 "5 分钟前" / "3 小时前"） -->
          <template v-else-if="isWithin24h">
            <NuxtTime
              :datetime="updatedDate.toISOString()"
              relative
            />
          </template>
          <!-- 3) 超过 24 小时（或未来时间）：展示原始请求时间 -->
          <template v-else>
            {{ props.data.updated }}
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@use '~/assets/diy/font.scss';

.circle-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: .5em;
  padding: 0.8rem 0.8rem;
  border-radius: 0.5rem;
  background-color: var(--c-bg-3);
  overflow: hidden;
  .dark & {
    --c-bg-3: hsl(0deg 0% 60% / .1);
  }
  --c-bg-3: hsl(0deg 0% 100%);
  
  .circle-card-top {
    word-break: break-all;
    overflow-wrap: anywhere;
    display: flex;
    flex-direction: column;
    gap: .5em;
    .circle-card-top-title {
      overflow: hidden;
      text-overflow: ellipsis;
      display: -webkit-box;
      -webkit-box-orient: vertical;
      -webkit-line-clamp: 1;
      text-transform: capitalize;
      word-break: break-all;
      font-size: 0.9em;
      font-weight: 700;
      .circle-card-top-link {
        cursor: pointer;
        text-decoration: none;
        word-break: break-all;
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
    .circle-card-top-summary {
      font-size: 0.69rem;
    }
  }
  .circle-card-footer {
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 0 .5em;
    justify-content: space-between;
    font-size: .75rem;
    .circle-card-footer-left {
      display: flex;
      gap: 1em;
      align-items: center;
      .circle-card-footer-info {
        display: flex;
        gap: .5em;
        align-items: center;
        .circle-card-footer-image {
          flex: none;
          transition: all .5s;
          background: white;
          box-shadow: 0 0 15px 0px rgb(0 0 0 / 10%);
          box-shadow: 0 0 5rem .5rem rgb(var(--plant-rgb) / .4), 0 0.5rem 1rem 0rem rgb(var(--plant-rgb-sub) / .2);
          outline: .2rem solid rgb(var(--plant-rgb) / .1);
          height: var(--avatar-size, 2em);
          width: var(--avatar-size, 2em);
          border-radius: 50%;
          background: var(--thyuu--color-back-white);
          object-fit: cover;
          object-position: top;
        }
        .circle-card-footer-author {
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-box-orient: vertical;
          -webkit-line-clamp: 1;
          text-transform: capitalize;
          word-break: break-all;
        }
      }
      .circle-card-footer-summary {
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        height: 25px;
        width: 25px;
        min-width: 25px;
        background-color: var(--c-bg-2);
        border-radius: 50%;
        transition: box-shadow .2s;
        flex-shrink: 0;
        position: relative;
        z-index: 10;
        pointer-events: auto;
      }
    }
    .circle-card-footer-right {
      .circle-card-footer-time {
        color: hsl(var(--thyuu--color-font) / .6);
        font-family: var(--thyuu--font-family-normal);
      }
    }
  }
}
</style>
