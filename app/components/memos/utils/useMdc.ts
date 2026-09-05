/**
 * useMdc.ts — Memos 文本 → MDC AST 渲染
 *
 * 复用博客 @nuxt/content 的 MDC 渲染链路：
 *   1. parseMarkdown（@nuxtjs/mdc/runtime）把 Markdown/MDC 字符串转 hast AST
 *   2. ContentRenderer 把 AST 渲染成 Vue 组件树，从而支持博客 MDC 组件
 *      （::alert、:badge[]、::link-card、::pic 等，见 content/preview/custom.md）
 *
 * 与 marked + v-html 方案的区别：
 *   - MDC 组件（content/ 目录下 34 个）会被真实渲染，而非当作普通文本
 *   - 渲染走 Vue 组件树 + @nuxt/content 的 dangerousTags 防护，无需 DOMPurify
 *   - remark-breaks 把单换行转为 <br>（"碎碎念"里按回车换行）
 *
 * 注意事项：
 *   - parseMarkdown 是 async（内部 import #mdc-imports 等虚拟模块，失败时降级为空）
 *   - Memos 数据在 onMounted 后客户端加载，故本函数只在客户端运行
 */
import { ref, watch, type Ref } from 'vue'
import { parseMarkdown } from '@nuxtjs/mdc/runtime'
import remarkBreaks from 'remark-breaks'

export interface MdcRenderState {
  /** hast AST（root 节点），可直接传给 ContentRenderer 的 value */
  body: Ref<unknown>
  /** 是否正在解析 */
  loading: Ref<boolean>
  /** 解析错误信息（空串表示无错误） */
  error: Ref<string>
}

/**
 * 把 Markdown/MDC 源文本异步解析为 hast AST
 *
 * @param source 返回当前要渲染文本的 getter（响应式）
 * @returns body/loading/error
 */
export function useMdcRender(source: () => string): MdcRenderState {
  const body = ref<unknown>(null)
  const loading = ref(false)
  const error = ref('')

  watch(
    source,
    async (src) => {
      if (!src) {
        body.value = null
        loading.value = false
        error.value = ''
        return
      }
      loading.value = true
      error.value = ''
      try {
        const parsed = await parseMarkdown(src, {
          // 在默认 remark-mdc + remark-gfm 基础上追加 remark-breaks：
          // 单换行（soft break）→ <br>，满足"有换行符则默认换行"
          remark: {
            plugins: {
              'remark-breaks': { instance: remarkBreaks },
            },
          },
        })
        body.value = parsed.body
      } catch (err) {
        error.value = err instanceof Error ? err.message : '解析失败'
        body.value = null
      } finally {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return { body, loading, error }
}
