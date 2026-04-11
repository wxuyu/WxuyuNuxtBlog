import { Marked } from 'marked'
import hljs from 'highlight.js'

export const markedRender = (body: string, loadingImg = ''): string => {
  const marked = new Marked({
    gfm: true,
    breaks: true
  })

  marked.use({
    renderer: {
      image({ href, text, title }) {
        const realSrc = href || ''
        const alt = text || ''
        const titleAttr = title ? ` title="${title}"` : ''

        return `
          <a class="NuxtImage" href="${realSrc}" target="_blank" rel="noopener noreferrer" data-fancybox="group" class="fancybox">
            <img
              src="${loadingImg || realSrc}"
              ${loadingImg ? `data-src="${realSrc}"` : ''}
              alt="${alt}"${titleAttr}
              class="${loadingImg ? 'lazy markdown-img' : 'markdown-img'}"
            >
          </a>
        `
      },

      code({ text, lang }) {
        let highlighted = text

        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(text, { language: lang }).value
        } else {
          highlighted = hljs.highlightAuto(text).value
        }

        return `<pre><code class="hljs${lang ? ` language-${lang}` : ''}">${highlighted}</code></pre>`
      }
    }
  })

  return marked.parse(body) as string
}