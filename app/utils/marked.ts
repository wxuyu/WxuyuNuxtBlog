/**
 * marked 包装：Memos 文本 → 安全 HTML
 *
 * - Memos 内容是用户输入的 Markdown（支持自定义标签/图片/链接）
 * - 服务端 + 客户端都用同一配置，避免 Hydration Mismatch
 * - 必须经 DOMPurify 消毒（Memos 历史上有 XSS CVE）
 *
 * SSR 兼容性：
 * - isomorphic-dompurify 在服务端用 jsdom，客户端用浏览器原生 DOMParser
 * - marked v18 是 ESM，需要 import 在 <script setup> 内
 */
import { marked } from 'marked'
import DOMPurify from 'isomorphic-dompurify'

// 单例 marked 实例，配置一次后续复用
marked.setOptions({
  gfm: true, // GitHub Flavored Markdown（Memos 默认）
  breaks: true, // 换行转 <br>（Memos 编辑器按回车就是新行）
  pedantic: false, // 容错更强
})

/**
 * 渲染 Memos Markdown 文本为安全 HTML
 *
 * @param src Memos memo.content 原始字符串（可能包含 #tag、![image](url)）
 * @returns 已消毒的安全 HTML，可直接 v-html
 */
export function renderMemoContent(src: string): string {
  if (!src) return ''
  // 1. marked → HTML
  const rawHtml = marked.parse(src, { async: false }) as string
  // 2. DOMPurify 消毒：放行 a/img/code/pre/figure 等 Memos 常用标签
  const safe = DOMPurify.sanitize(rawHtml, {
    USE_PROFILES: { html: true },
    ADD_ATTR: ['target', 'rel'],
    // 允许 Memos 内联样式（图片最大宽度等）
    ADD_TAGS: ['figure', 'figcaption'],
  })
  return safe
}
