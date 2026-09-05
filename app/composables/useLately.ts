/**
 * Lately 替代品：把日期格式化为"X 秒/分钟/小时/天/月/年前"
 *
 * 原 lately.min.js 是 tokinx/Lately v2.5.2，1281 字节
 * 这里用 Vue composable + 原生 Intl.RelativeTimeFormat 重写
 *
 * SSR 安全策略：
 * - SSR 阶段显示绝对时间，避免 Hydration Mismatch
 * - 客户端 mount 后切到相对时间
 */
import { computed, onMounted, ref } from 'vue'

/** 中文相对时间语言包 */
const ZH_LANG = {
  second: '秒',
  minute: '分钟',
  hour: '小时',
  day: '天',
  month: '个月',
  year: '年',
  ago: '前',
  error: '未知时间',
} as const

type Unit = keyof typeof ZH_LANG

/** 把任意日期输入转成 Date */
function parseDate(input: string | number | Date | undefined | null): Date | null {
  if (input === null || input === undefined || input === '') return null
  let d: Date
  if (input instanceof Date) {
    d = input
  } else if (typeof input === 'number') {
    d = new Date(input)
  } else if (typeof input === 'string') {
    // Memos v1 返回 'YYYY-MM-DDTHH:mm:ss.sssZ' 形式，直接 new Date 即可
    d = new Date(input)
  } else {
    return null
  }
  return isNaN(d.getTime()) ? null : d
}

/** 计算两时间差，自动选最大单位（与原 Lately 算法一致：年→月→天→时→分→秒） */
export function formatRelative(target: Date | string | number, now: Date = new Date()): string {
  const d = parseDate(target)
  if (!d) return ZH_LANG.error

  const deltaMs = now.getTime() - d.getTime()
  const second = deltaMs / 1000
  const minute = second / 60
  const hour = minute / 60
  const day = hour / 24
  const month = day / 30
  const year = month / 12

  // 顺序：年→月→天→时→分→秒，从大到小找第一个 ≥ 1 的单位
  const units: Array<[Unit, number]> = [
    ['year', year],
    ['month', month],
    ['day', day],
    ['hour', hour],
    ['minute', minute],
    ['second', second],
  ]

  for (const [unit, value] of units) {
    if (value >= 1) {
      return `${Math.floor(value)}${ZH_LANG[unit]}${ZH_LANG.ago}`
    }
  }
  return ZH_LANG.error
}

/**
 * Vue 组合式：响应式时间显示
 *
 * @example
 *   const { display, tooltip } = useRelativeTime(() => memo.createdAt)
 *   <time :title="tooltip">{{ display }}</time>
 */
export function useRelativeTime(getDate: () => Date | string | number | undefined | null) {
  const target = computed(() => parseDate(getDate()))
  const isMounted = ref(false)

  onMounted(() => {
    isMounted.value = true
  })

  /** 显示文本（SSR 阶段显示绝对时间，mount 后显示相对时间） */
  const display = computed(() => {
    const d = target.value
    if (!d) return ZH_LANG.error
    if (!isMounted.value) {
      // SSR + 客户端首次渲染用绝对时间，避免 mismatch
      return d.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    }
    return formatRelative(d)
  })

  /** tooltip 显示绝对时间（用于 hover） */
  const tooltip = computed(() => {
    const d = target.value
    return d ? d.toLocaleString('zh-CN') : ''
  })

  return { display, tooltip }
}
