---
title: 评论优化
description: 该文章介绍Nuxt博客适配中评论模块的Vue组件实现与Artalk评论系统单例管理逻辑，并提供具体的适配评论表情包的Json信息，评论功能有着KaTeX数学公式渲染、图片灯箱、动态监听以及管理逻辑的初始化、计数、暗黑模式切换等方式。
date: 2025-12-23 10:00:00
updated: 2026-03-01 20:49:00
image: /image/PostCover/commentMeihua.avif
categories: [站点魔改]
tags: [Nuxt, 魔改, 美化]
recommend: 8
---
## 部署文档
无需多说，前往官方文档查看

## 适配博客
::tab{:tabs='["评论组件", "评论逻辑"]'}
#tab1
``` vue [Comment.vue] lang="vue"
<script setup lang="ts">
import { LazyPopoverLightbox } from '#components'
import ArtalkManager from '~/utils/artalk-manager'

const appConfig = useAppConfig()
const route = useRoute()
const colorMode = useColorMode()

const artalkManager = ArtalkManager.getInstance()
const popoverStore = usePopoverStore()

// 动态加载 KaTeX 脚本
function loadKaTeX() {
	return new Promise((resolve, reject) => {
		if (typeof window !== 'undefined' && window.katex) {
			resolve(window.katex)
			return
		}

		const existingScript = document.querySelector('script[src*="katex"]')
		if (existingScript) {
			existingScript.addEventListener('load', () => resolve(window.katex))
			existingScript.addEventListener('error', reject)
			return
		}

		const script = document.createElement('script')
		script.src = 'https://lib.baomitu.com/KaTeX/0.16.9/katex.min.js'
		script.onload = () => resolve(window.katex)
		script.onerror = reject
		document.head.appendChild(script)
	})
}

// KaTeX math rendering function
async function renderMathInComments() {
	try {
		await loadKaTeX()

		const commentElements = document.querySelectorAll('#artalk .atk-content:not(.math-processed)')
		commentElements.forEach((element: Element) => {
			element.classList.add('math-processed')

			let content = element.innerHTML
			const originalContent = content
			content = content.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
				try {
					return `<span class="math-display">${window.katex.renderToString(formula.trim(), { displayMode: true })}</span>`
				}
				catch (e) {
					console.warn('KaTeX display render error:', e)
					return match
				}
			})
			content = content.replace(/\$([^$\n]+)\$/g, (match, formula) => {
				if (match.includes('<span class="math-')) {
					return match
				}
				try {
					return `<span class="math-inline">${window.katex.renderToString(formula.trim(), { displayMode: false })}</span>`
				}
				catch (e) {
					console.warn('KaTeX inline render error:', e)
					return match
				}
			})
			// eslint-disable-next-line regexp/no-super-linear-backtracking
			content = content.replace(/```math\s*([\s\S]*?)```/g, (match, formula) => {
				try {
					return `<div class="math-block">${window.katex.renderToString(formula.trim(), { displayMode: true })}</div>`
				}
				catch (e) {
					console.warn('KaTeX math block render error:', e)
					return match
				}
			})

			if (content !== originalContent) {
				element.innerHTML = content
			}
		})
	}
	catch (error) {
		console.error('Failed to load KaTeX:', error)
		setTimeout(() => renderMathInComments(), 1000)
	}
}

// 为评论区图片添加灯箱功能
function addLightboxToImages() {
	const commentImages = document.querySelectorAll('#artalk .atk-content img')
	commentImages.forEach((img: Element) => {
		const imgElement = img as HTMLImageElement
		if (imgElement.style.cursor !== 'zoom-in') {
			imgElement.style.cursor = 'zoom-in'
			imgElement.addEventListener('click', () => {
				const { open } = popoverStore.use(() => h(LazyPopoverLightbox, {
					el: imgElement,
				}))
				open()
			})
		}
	})
}
let commentObserver: MutationObserver | null = null

function watchCommentChanges() {
	const artalkContainer = document.getElementById('artalk')
	if (!artalkContainer)
		return
	if (commentObserver) {
		commentObserver.disconnect()
	}
	commentObserver = new MutationObserver((mutations) => {
		let shouldUpdateImages = false
		let shouldRenderMath = false
		mutations.forEach((mutation) => {
			if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
				mutation.addedNodes.forEach((node) => {
					if (node.nodeType === Node.ELEMENT_NODE) {
						const element = node as Element
						if (element.tagName === 'IMG' || element.querySelector('img')) {
							shouldUpdateImages = true
						}
						if (element.classList?.contains('atk-content') || element.querySelector('.atk-content')) {
							shouldRenderMath = true
						}
					}
				})
			}
		})

		if (shouldUpdateImages) {
			setTimeout(() => addLightboxToImages(), 100)
		}
		if (shouldRenderMath) {
			setTimeout(() => renderMathInComments(), 500)
		}
	})

	commentObserver.observe(artalkContainer, {
		childList: true,
		subtree: true,
	})
}

async function initArtalk() {
	try {
		await artalkManager.init({
			el: '#artalk',
			pageKey: route.path,
			pageTitle: document.title.replace(` | ${appConfig.title}`, ''),
			server: appConfig.artalk?.server,
			site: appConfig.artalk?.sitename,
			emoticons: appConfig.artalk?.owo_src,
			darkMode: colorMode.value === 'dark',
		})

		await nextTick(() => {
			setTimeout(() => {
				addLightboxToImages()

				setTimeout(() => renderMathInComments(), 1000)
				watchCommentChanges()
			}, 500)
		})
	}
	catch (error) {
		console.error('评论系统初始化失败:', error)
	}
}

onMounted(() => {
	nextTick(() => {
		setTimeout(initArtalk, 100)
	})
})
watch(() => route.path, () => {
	nextTick(() => {
		setTimeout(initArtalk, 100)
	})
})
watch(() => colorMode.value, (newMode) => {
	artalkManager.setDarkMode(newMode === 'dark')
})

onUnmounted(() => {
	if (commentObserver) {
		commentObserver.disconnect()
		commentObserver = null
	}
})
</script>

<template>
<section class="z-comment">
	<h3 class="text-creative">
		<div class="comment-tip">评论</div>
  </h3>
  <div class="commentCard">
    <div id="artalk">
      <p class="loading-box">
        <Icon name="line-md:loading-twotone-loop" class="loadig-img" />评论加载中...
      </p>
    </div>
  </div>
</section>
</template>

<style lang="scss" scoped>
.z-comment {
  margin: 3rem 0.5rem;

  > h3 {
    margin-top: 3rem;
    margin-left: 0.2rem;
    font-size: 1.25rem;
  }
}
.text-creative {
  display: flex;
  
  > .comment-tip{
    font-size: 1.45rem;
    margin-right: 0.8rem;
    margin-bottom: 1rem;
  }
  > .comment-nav {
    font-size: 1.45rem;
    margin-right: 0.8rem;
    margin-bottom: 1rem;
  }
}
.comment-tip{
  font-size: 1.45rem;
  margin-right: 0.8rem;
}
#artalk {
  .loading-box{
    text-align: center;
    font-size: 1.1rem;
    .loading-img{
      margin-right: 0.6rem;
    }
  }
  margin-top: 1rem;

  .atk-main-editor {
    border-radius: 0.8rem !important;
    background-color: var(--ld-bg-card);
    box-shadow: 0 0.1em 0.2em var(--ld-shadow);
    border:none !important;
    transition: all 0.2s ease;
    &:hover{
      box-shadow: 0 0.5em 1em var(--ld-shadow);
      transform: translateY(-2px);
    }
  }
  .atk-textarea{
    background-color: var(--ld-bg-card);
  }

  .atk-send-btn {
    background-color: var(--c-primary) !important;
    border-radius: 16px !important;
    transition: all 0.2s;
  }

  .atk-comment-wrap {
    margin: 0.6rem 0;
    background-color: var(--ld-bg-card);;
    border-radius: 0.8rem;
    box-shadow: 0 0.1em 0.2em var(--ld-shadow);
  }

  .atk-comment-wrap .atk-comment {
    padding: 10px;
  }

  .atk-comment-children > .atk-comment-wrap {
    margin: 10px 0 0 0;
    background-color: transparent;
    border-radius: 0;
    box-shadow: none;
  }

  .atk-comment > .atk-avatar img {
    border-radius: 50% !important;
  }

  .atk-nick a {
    font-size: 0.9rem !important;
    color: var(--c-brand) !important;
  }

  .atk-reply-at > .atk-nick {
    font-size: 0.8rem !important;
    color: var(--c-brand) !important;
  }

  .atk-comment > .atk-main > .atk-header {
    padding-top: 5px;
  }

  .atk-header {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }

  .atk-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    margin-top: 4px;
  }

  .atk-common-action-btn, .atk-actions span {
    cursor: pointer;
    opacity: 0.8;
    transition: opacity 0.2s;

    &:hover {
      opacity: 1;
    }
  }

  .atk-dropdown {
    list-style: none !important;
    margin: 0 !important;
    padding: 0 !important;

    .atk-dropdown-item {
      list-style: none !important;
      margin: 0 !important;
      padding: 8px 12px !important;

      span{
        padding: 0 1rem !important;
      }
      &::marker {
        display: none !important;
      }

      &::before {
        display: none !important;
      }
    }
  }

  @media (max-width: 576px) {
    .atk-comment-wrap {
      margin: 12px 0;
    }

    .atk-comment-wrap .atk-comment {
      padding: 12px;
    }
  }

  .dark & {
    .atk-comment-wrap {
      background-color: var(--c-bg-2);
    }

    .atk-main-editor {
      background-color: var(--c-bg-2) !important;
      box-shadow: 0 0.1em 0.2em var(--ld-shadow);
      color: var(--c-text-1) !important;
      border:none !important;
    }

    .atk-content p {
      color: var(--c-text-1) !important;
      font-size: 0.9rem !important;
    }

    .atk-nick a {
      color: var(--c-brand-light) !important;
    }

    .atk-reply-at > .atk-nick {
      color: var(--c-brand-light) !important;
    }
  }

  .atk-time {
    color: var(--c-text-3);
  }

  .atk-content {
    margin-top: 0.1rem;

    img {
      border-radius: 0.5em;
    }
  }

  .atk-nick {
    font-family: var(--font-basic);
    font-weight: bold;
  }

  pre {
    border-radius: 0.5rem;
    font-size: 0.8125rem;
  }

  p {
    margin: 0.2em 0;
  }

  .atk-emotion {
    width: auto;
    height: 1.4em;
    vertical-align: text-bottom;
  }

  /* KaTeX math rendering styles */
  .math-block {
    margin: 1rem 0;
    text-align: center;
    overflow-x: auto;
  }

  .katex {
    font-size: 1.1em;
  }

  .katex-display {
    margin: 1rem 0;
    text-align: center;
  }

  menu, ol, ul:not(.atk-dropdown) {
    margin: 0.5em 0;
    padding: 0 0 0 1.5em;
    list-style: revert;

    > li {
      margin: 0.2em 0;

      &::marker {
        font-size: 0.8em;
        color: var(--c-primary);
      }
    }
  }

  blockquote {
    margin: 0.5em 0;
    padding: 1.2rem;
    border-left: 4px solid var(--c-border);
    border-radius: 4px;
    background-color: var(--c-bg-2);
    font-size: 0.9rem;

    > .z-codeblock {
      margin: 0 -0.8rem;
    }
  }
}
</style>
```

#tab2

``` ts [artalk-manage.ts] lang="ts"
import appConfig from "~/app.config"

/**
 * Artalk 评论系统管理器
 * - 全局单例
 * - 支持 init（完整评论） / loadCountWidget（纯计数）
 */
interface ArtalkOptions {
	el: string
	pageKey: string
	pageTitle: string
	server?: string
	site?: string
	emoticons?: string
	darkMode?: boolean
}

interface CountWidgetOptions {
	server?: string
	site?: string
	pvEl?: string
	countEl?: string
	statPageKeyAttr?: string
}

class ArtalkManager {
	private static instance: ArtalkManager
	private artalkInstance: any = null
	private currentPageKey = ''

	private constructor() {}

	public static getInstance(): ArtalkManager {
		if (!ArtalkManager.instance) {
			ArtalkManager.instance = new ArtalkManager()
		}
		return ArtalkManager.instance
	}

	/* ---------- 完整评论 ---------- */
	public async init(options: ArtalkOptions): Promise<void> {
		if (this.currentPageKey === options.pageKey && this.artalkInstance)
			return
		this.destroy()
		await this.waitForArtalk()
		this.retryUntil(() => {
			const el = document.getElementById(options.el.replace('#', ''))
			/// @ts-expect-error 导入ar
			if (el && window.Artalk) {
				// eslint-disable-next-line ts/ban-ts-comment
				// @ts-expect-error
				this.artalkInstance = window.Artalk.init(options)
				this.currentPageKey = options.pageKey
				return true
			}
			return false
		})
	}

	/* ---------- 纯计数器 ---------- */
	public async loadCountWidget(opts: CountWidgetOptions): Promise<void> {
		await this.waitForArtalk()
		this.retryUntil(() => {
			// @ts-expect-error 加载计数
			if (window.Artalk?.loadCountWidget) {
				// eslint-disable-next-line ts/ban-ts-comment
				// @ts-expect-error
				window.Artalk.loadCountWidget(opts)
				return true
			}
			return false
		})
	}

	/* ---------- 工具方法 ---------- */
	public destroy(): void {
		if (this.artalkInstance?.destroy) {
			// eslint-disable-next-line style/max-statements-per-line
			try { this.artalkInstance.destroy() }
			catch {}
		}
		this.artalkInstance = null
		this.currentPageKey = ''
	}

	public setDarkMode(isDark: boolean): void {
		this.artalkInstance?.setDarkMode?.(isDark)
	}

	private async loadScript(): Promise<void> {
		// 1️⃣ 服务器端直接返回
		if (typeof window === 'undefined')
			return

		// 2️⃣ 已经加载过
		if ((window as any).Artalk)
			return

		return new Promise<void>((resolve, reject) => {
			const script = document.createElement('script')
			script.src = appConfig.artalk.src // 换成你自己的地址
			script.async = true
			script.onload = () => resolve()
			script.onerror = () => reject(new Error('Artalk 脚本加载失败'))
			document.head.appendChild(script)
		})
	}

	private async waitForArtalk(): Promise<void> {
		// 服务器端直接返回
		if (typeof window === 'undefined')
			return

		await this.loadScript()
		return new Promise<void>((res) => {
			const check = () =>
				(window as any).Artalk ? res() : setTimeout(check, 50)
			check()
		})
	}

	private async retryUntil(fn: () => boolean, max = 50): Promise<void> {
		let i = 0
		while (i++ < max) {
			if (fn())
				return
			await new Promise(r => setTimeout(r, 100))
		}
		throw new Error('Artalk 元素或方法未就绪')
	}
}

export default ArtalkManager
```
::

## 表情包列表
::alert{type="warning" card}
#title
注意
#default
表情包只适用于artalk评论，且已经实施分包措施，采用特定cdn进行加载（未在白名单内自动排除）

以下表情包为本地表情包：

- `微信常用`：[https://www.myxz.top/emoji/wx.zip]
- `狐妖小红娘`：[https://www.myxz.top/emoji/huyao.zip]
::

::tab{:tabs='["哔哩哔哩", "张洪Heo", "狐妖小红娘", "前尘小筑", "那兔", "微信", "爱弥斯", ""]'}
#tab1
``` json [blbl.json] lang="json"
  {
    "name": "哔哩哔哩",
    "type": "image",
    "items": [
      {
        "key": "bilibili_tv_gif-1",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/doge.gif"
      },
      {
        "key": "bilibili_tv_gif-2",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/亲亲.gif"
      },
      {
        "key": "bilibili_tv_gif-3",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/偷笑.gif"
      },
      {
        "key": "bilibili_tv_gif-4",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/再见.gif"
      },
      {
        "key": "bilibili_tv_gif-5",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/发怒.gif"
      },
      {
        "key": "bilibili_tv_gif-6",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/发财.gif"
      },
      {
        "key": "bilibili_tv_gif-7",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/可爱.gif"
      },
      {
        "key": "bilibili_tv_gif-8",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/吐血.gif"
      },
      {
        "key": "bilibili_tv_gif-9",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/呆.gif"
      },
      {
        "key": "bilibili_tv_gif-10",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/呕吐.gif"
      },
      {
        "key": "bilibili_tv_gif-11",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/困.gif"
      },
      {
        "key": "bilibili_tv_gif-12",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/坏笑.gif"
      },
      {
        "key": "bilibili_tv_gif-13",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/大佬.gif"
      },
      {
        "key": "bilibili_tv_gif-14",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/大哭.gif"
      },
      {
        "key": "bilibili_tv_gif-15",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/委屈.gif"
      },
      {
        "key": "bilibili_tv_gif-16",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/害羞.gif"
      },
      {
        "key": "bilibili_tv_gif-17",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/尴尬.gif"
      },
      {
        "key": "bilibili_tv_gif-18",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/微笑.gif"
      },
      {
        "key": "bilibili_tv_gif-19",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/思考.gif"
      },
      {
        "key": "bilibili_tv_gif-20",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/惊吓.gif"
      },
      {
        "key": "bilibili_tv_gif-21",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/打脸.gif"
      },
      {
        "key": "bilibili_tv_gif-22",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/抓狂.gif"
      },
      {
        "key": "bilibili_tv_gif-23",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/抠鼻子.gif"
      },
      {
        "key": "bilibili_tv_gif-24",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/斜眼笑.gif"
      },
      {
        "key": "bilibili_tv_gif-25",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/无奈.gif"
      },
      {
        "key": "bilibili_tv_gif-26",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/晕.gif"
      },
      {
        "key": "bilibili_tv_gif-27",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/流汗.gif"
      },
      {
        "key": "bilibili_tv_gif-28",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/流鼻血.gif"
      },
      {
        "key": "bilibili_tv_gif-29",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/点赞.gif"
      },
      {
        "key": "bilibili_tv_gif-30",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/生气.gif"
      },
      {
        "key": "bilibili_tv_gif-31",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/生病.gif"
      },
      {
        "key": "bilibili_tv_gif-32",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/疑问.gif"
      },
      {
        "key": "bilibili_tv_gif-33",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/白眼.gif"
      },
      {
        "key": "bilibili_tv_gif-34",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/睡着.gif"
      },
      {
        "key": "bilibili_tv_gif-35",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/笑哭.gif"
      },
      {
        "key": "bilibili_tv_gif-36",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/腼腆.gif"
      },
      {
        "key": "bilibili_tv_gif-37",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/色.gif"
      },
      {
        "key": "bilibili_tv_gif-38",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/调皮.gif"
      },
      {
        "key": "bilibili_tv_gif-39",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/鄙视.gif"
      },
      {
        "key": "bilibili_tv_gif-40",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/闭嘴.gif"
      },
      {
        "key": "bilibili_tv_gif-41",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/难过.gif"
      },
      {
        "key": "bilibili_tv_gif-42",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/馋.gif"
      },
      {
        "key": "bilibili_tv_gif-43",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/黑人问号.gif"
      },
      {
        "key": "bilibili_tv_gif-44",
        "val": "https://jsd.myxz.top/gh/2x-ercha/twikoo-magic@master/image/bilibili_tv_gif/鼓掌.gif"
      }
    ]
  }
```

#tab2
``` json [heo.json] lang="json"
  {
    "name": "Heo", 
    "type": "image", 
    "items": [
      {
        "key": "heo-3d眼镜", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/3d眼镜.png"
      }, 
      {
        "key": "heo-EDG", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/EDG.png"
      }, 
      {
        "key": "heo-LPL", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/LPL.png"
      }, 
      {
        "key": "heo-beluga", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/beluga.png"
      }, 
      {
        "key": "heo-不好意思", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/不好意思.png"
      }, 
      {
        "key": "heo-不服吗", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/不服吗.png"
      }, 
      {
        "key": "heo-亲亲", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/亲亲.png"
      }, 
      {
        "key": "heo-伞兵", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/伞兵.png"
      }, 
      {
        "key": "heo-倚墙笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/倚墙笑.png"
      }, 
      {
        "key": "heo-值得肯定", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/值得肯定.png"
      }, 
      {
        "key": "heo-偷偷看", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/偷偷看.png"
      }, 
      {
        "key": "heo-傻笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/傻笑.png"
      }, 
      {
        "key": "heo-再见", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/再见.png"
      }, 
      {
        "key": "heo-出家人", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/出家人.png"
      }, 
      {
        "key": "heo-击剑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/击剑.png"
      }, 
      {
        "key": "heo-加班", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/加班.png"
      }, 
      {
        "key": "heo-勉强笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/勉强笑.png"
      }, 
      {
        "key": "heo-危险", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/危险.png"
      }, 
      {
        "key": "heo-发红包", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/发红包.png"
      }, 
      {
        "key": "heo-吃手", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/吃手.png"
      }, 
      {
        "key": "heo-吃瓜", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/吃瓜.png"
      }, 
      {
        "key": "heo-吐血", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/吐血.png"
      }, 
      {
        "key": "heo-吵架", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/吵架.png"
      }, 
      {
        "key": "heo-呦吼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/呦吼.png"
      }, 
      {
        "key": "heo-呲牙笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/呲牙笑.png"
      }, 
      {
        "key": "heo-哈士奇", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/哈士奇.png"
      }, 
      {
        "key": "heo-哈士奇失去意识", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/哈士奇失去意识.png"
      }, 
      {
        "key": "heo-哈士奇失望", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/哈士奇失望.png"
      }, 
      {
        "key": "heo-哭泣", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/哭泣.png"
      }, 
      {
        "key": "heo-唱歌", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/唱歌.png"
      }, 
      {
        "key": "heo-喜欢", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/喜欢.png"
      }, 
      {
        "key": "heo-嘿哈", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/嘿哈.png"
      }, 
      {
        "key": "heo-大笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/大笑.png"
      }, 
      {
        "key": "heo-失去信号", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/失去信号.png"
      }, 
      {
        "key": "heo-失望", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/失望.png"
      }, 
      {
        "key": "heo-头秃", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/头秃.png"
      }, 
      {
        "key": "heo-奋斗", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/奋斗.png"
      }, 
      {
        "key": "heo-好奇", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/好奇.png"
      }, 
      {
        "key": "heo-好的", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/好的.png"
      }, 
      {
        "key": "heo-害羞", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/害羞.png"
      }, 
      {
        "key": "heo-小丑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/小丑.png"
      }, 
      {
        "key": "heo-小偷", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/小偷.png"
      }, 
      {
        "key": "heo-尬笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/尬笑.png"
      }, 
      {
        "key": "heo-尴尬", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/尴尬.png"
      }, 
      {
        "key": "heo-应援", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/应援.png"
      }, 
      {
        "key": "heo-开心", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/开心.png"
      }, 
      {
        "key": "heo-引起不适", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/引起不适.png"
      }, 
      {
        "key": "heo-微笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/微笑.png"
      }, 
      {
        "key": "heo-思考", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/思考.png"
      }, 
      {
        "key": "heo-恶心", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/恶心.png"
      }, 
      {
        "key": "heo-恶魔", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/恶魔.png"
      }, 
      {
        "key": "heo-恶魔恐惧", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/恶魔恐惧.png"
      }, 
      {
        "key": "heo-惊吓", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/惊吓.png"
      }, 
      {
        "key": "heo-惊吓白眼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/惊吓白眼.png"
      }, 
      {
        "key": "heo-惊讶", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/惊讶.png"
      }, 
      {
        "key": "heo-惬意", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/惬意.png"
      }, 
      {
        "key": "heo-感动", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/感动.png"
      }, 
      {
        "key": "heo-愤怒", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/愤怒.png"
      }, 
      {
        "key": "heo-我看好你", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/我看好你.png"
      }, 
      {
        "key": "heo-手机相机", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/手机相机.png"
      }, 
      {
        "key": "heo-打咩", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/打咩.png"
      }, 
      {
        "key": "heo-打牌", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/打牌.png"
      }, 
      {
        "key": "heo-托腮", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/托腮.png"
      }, 
      {
        "key": "heo-扶额", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/扶额.png"
      }, 
      {
        "key": "heo-抠鼻", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/抠鼻.png"
      }, 
      {
        "key": "heo-抬眼镜", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/抬眼镜.png"
      }, 
      {
        "key": "heo-拜托", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/拜托.png"
      }, 
      {
        "key": "heo-捂嘴笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/捂嘴笑.png"
      }, 
      {
        "key": "heo-捂脸", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/捂脸.png"
      }, 
      {
        "key": "heo-擦汗", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/擦汗.png"
      }, 
      {
        "key": "heo-放鞭炮", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/放鞭炮.png"
      }, 
      {
        "key": "heo-敬礼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/敬礼.png"
      }, 
      {
        "key": "heo-整理发型", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/整理发型.png"
      }, 
      {
        "key": "heo-斗鸡眼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/斗鸡眼.png"
      }, 
      {
        "key": "heo-智慧的眼神", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/智慧的眼神.png"
      }, 
      {
        "key": "heo-月饼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/月饼.png"
      }, 
      {
        "key": "heo-有没有搞错", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/有没有搞错.png"
      }, 
      {
        "key": "heo-正确", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/正确.png"
      }, 
      {
        "key": "heo-没招", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/没招.png"
      }, 
      {
        "key": "heo-波吉", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/波吉.png"
      }, 
      {
        "key": "heo-泪奔", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/泪奔.png"
      }, 
      {
        "key": "heo-流汗微笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/流汗微笑.png"
      }, 
      {
        "key": "heo-流鼻涕", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/流鼻涕.png"
      }, 
      {
        "key": "heo-深思", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/深思.png"
      }, 
      {
        "key": "heo-滑稽", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽.png"
      }, 
      {
        "key": "heo-滑稽吃瓜", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽吃瓜.png"
      }, 
      {
        "key": "heo-滑稽喝水", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽喝水.png"
      }, 
      {
        "key": "heo-滑稽奶茶", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽奶茶.png"
      }, 
      {
        "key": "heo-滑稽柠檬", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽柠檬.png"
      }, 
      {
        "key": "heo-滑稽狂汗", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽狂汗.png"
      }, 
      {
        "key": "heo-滑稽被子", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/滑稽被子.png"
      }, 
      {
        "key": "heo-烦恼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/烦恼.png"
      }, 
      {
        "key": "heo-熊熊", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊熊.png"
      }, 
      {
        "key": "heo-熊猫", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊猫.png"
      }, 
      {
        "key": "heo-熊猫唱歌", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊猫唱歌.png"
      }, 
      {
        "key": "heo-熊猫喜欢", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊猫喜欢.png"
      }, 
      {
        "key": "heo-熊猫失望", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊猫失望.png"
      }, 
      {
        "key": "heo-熊猫意外", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熊猫意外.png"
      }, 
      {
        "key": "heo-熬夜", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/熬夜.png"
      }, 
      {
        "key": "heo-爆炸", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/爆炸.png"
      }, 
      {
        "key": "heo-牛年进宝", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/牛年进宝.png"
      }, 
      {
        "key": "heo-狂热", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狂热.png"
      }, 
      {
        "key": "heo-狗头", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头.png"
      }, 
      {
        "key": "heo-狗头围脖", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头围脖.png"
      }, 
      {
        "key": "heo-狗头失望", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头失望.png"
      }, 
      {
        "key": "heo-狗头意外", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头意外.png"
      }, 
      {
        "key": "heo-狗头胖次", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头胖次.png"
      }, 
      {
        "key": "heo-狗头花", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头花.png"
      }, 
      {
        "key": "heo-狗头草", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/狗头草.png"
      }, 
      {
        "key": "heo-猪头", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/猪头.png"
      }, 
      {
        "key": "heo-猪头意外", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/猪头意外.png"
      }, 
      {
        "key": "heo-生病", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/生病.png"
      }, 
      {
        "key": "heo-电话", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/电话.png"
      }, 
      {
        "key": "heo-疑问", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/疑问.png"
      }, 
      {
        "key": "heo-疼痛", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/疼痛.png"
      }, 
      {
        "key": "heo-痛哭", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/痛哭.png"
      }, 
      {
        "key": "heo-看穿一切", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/看穿一切.png"
      }, 
      {
        "key": "heo-眩晕", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/眩晕.png"
      }, 
      {
        "key": "heo-睡觉", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/睡觉.png"
      }, 
      {
        "key": "heo-禁言", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/禁言.png"
      }, 
      {
        "key": "heo-笑哭", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/笑哭.png"
      }, 
      {
        "key": "heo-纠结", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/纠结.png"
      }, 
      {
        "key": "heo-绿帽", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/绿帽.png"
      }, 
      {
        "key": "heo-缺牙笑", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/缺牙笑.png"
      }, 
      {
        "key": "heo-翻白眼", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/翻白眼.png"
      }, 
      {
        "key": "heo-老虎意外", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/老虎意外.png"
      }, 
      {
        "key": "heo-耍酷", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/耍酷.png"
      }, 
      {
        "key": "heo-胡子", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/胡子.png"
      }, 
      {
        "key": "heo-菜狗", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/菜狗.png"
      }, 
      {
        "key": "heo-菜狗花", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/菜狗花.png"
      }, 
      {
        "key": "heo-蒙面滑稽", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/蒙面滑稽.png"
      }, 
      {
        "key": "heo-虎年进宝", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/虎年进宝.png"
      }, 
      {
        "key": "heo-被打", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/被打.png"
      }, 
      {
        "key": "heo-裂开", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/裂开.png"
      }, 
      {
        "key": "heo-警告", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/警告.png"
      }, 
      {
        "key": "heo-读书", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/读书.png"
      }, 
      {
        "key": "heo-财神红包", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/财神红包.png"
      }, 
      {
        "key": "heo-超爱", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/超爱.png"
      }, 
      {
        "key": "heo-这是啥", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/这是啥.png"
      }, 
      {
        "key": "heo-送福", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/送福.png"
      }, 
      {
        "key": "heo-送花", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/送花.png"
      }, 
      {
        "key": "heo-错误", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/错误.png"
      }, 
      {
        "key": "heo-阴险", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/阴险.png"
      }, 
      {
        "key": "heo-难以置信", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/难以置信.png"
      }, 
      {
        "key": "heo-面具", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/面具.png"
      }, 
      {
        "key": "heo-饥渴", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/饥渴.png"
      }, 
      {
        "key": "heo-鬼脸", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/鬼脸.png"
      }, 
      {
        "key": "heo-黑线", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/黑线.png"
      }, 
      {
        "key": "heo-鼓掌", 
        "val": "https://jsd.myxz.top/npm/sticker-heo@2022.7.5/Sticker-100/鼓掌.png"
      }
    ]
  }
```

#tab3

``` json [huxian.json] lang="json"
  {
    "name": "狐妖", 
    "type": "image", 
    "items": [
      {
        "key": "不明嚼栗", 
        "val": "/emoji/huyao/不明嚼栗.png"
      }, 
      {
        "key": "吃我安利", 
        "val": "/emoji/huyao/吃我安利.png"
      }, 
      {
        "key": "伐开心", 
        "val": "/emoji/huyao/伐开心.png"
      }, 
      {
        "key": "大笑", 
        "val": "/emoji/huyao/大笑.png"
      }, 
      {
        "key": "脸红", 
        "val": "/emoji/huyao/脸红.png"
      }, 
      {
        "key": "哭", 
        "val": "/emoji/huyao/哭.png"
      }, 
      {
        "key": "前排", 
        "val": "/emoji/huyao/前排.png"
      }, 
      {
        "key": "沙发", 
        "val": "/emoji/huyao/沙发.png"
      }, 
      {
        "key": "比心", 
        "val": "/emoji/huyao/比心.png"
      }, 
      {
        "key": "吃药", 
        "val": "/emoji/huyao/吃药.png"
      }
    ]
  }
```

#tab4

``` json [mnchen.json] lang="json"
  {
    "name": "前尘小筑", 
    "type": "image", 
    "items": [
      {
        "key": "123", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/123.jpeg"
      }, 
      {
        "key": "213", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/213.jpeg"
      }, 
      {
        "key": "aixing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/aixing.jpeg"
      }, 
      {
        "key": "awsl", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/awsl.jpeg"
      }, 
      {
        "key": "chengsi", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/chengsi.jpeg"
      }, 
      {
        "key": "chugua", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/chugua.jpeg"
      }, 
      {
        "key": "ddd", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/ddd.jpeg"
      }, 
      {
        "key": "dengdeng", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/dengdeng.jpeg"
      }, 
      {
        "key": "dianzhan", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/dianzhan.jpeg"
      }, 
      {
        "key": "haoting", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/haoting.jpeg"
      }, 
      {
        "key": "heiheihei (2)", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/heiheihei (2).jpeg"
      }, 
      {
        "key": "heiheihei", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/heiheihei.jpeg"
      }, 
      {
        "key": "henghengheng", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/henghengheng.jpeg"
      }, 
      {
        "key": "huahua", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/huahua.jpeg"
      }, 
      {
        "key": "ing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/ing.jpeg"
      }, 
      {
        "key": "jidong", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/jidong.jpeg"
      }, 
      {
        "key": "jxry", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/jxry.jpeg"
      }, 
      {
        "key": "kaixing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/kaixing.jpeg"
      }, 
      {
        "key": "ku", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/ku.jpeg"
      }, 
      {
        "key": "la", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/la.jpeg"
      }, 
      {
        "key": "lalala", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/lalala.jpeg"
      }, 
      {
        "key": "liuhang", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/liuhang.jpeg"
      }, 
      {
        "key": "maotou", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/maotou.jpeg"
      }, 
      {
        "key": "pingjing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/pingjing.jpeg"
      }, 
      {
        "key": "shengli", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/shengli.jpeg"
      }, 
      {
        "key": "suan", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/suan.jpeg"
      }, 
      {
        "key": "suijiao", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/suijiao.jpeg"
      }, 
      {
        "key": "suixing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/suixing.jpeg"
      }, 
      {
        "key": "wuyu", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/wuyu.jpeg"
      }, 
      {
        "key": "wuyu2", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/wuyu2.jpeg"
      }, 
      {
        "key": "xbb", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/xbb.jpeg"
      }, 
      {
        "key": "yingcha", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/yingcha.jpeg"
      }, 
      {
        "key": "yyds", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/yyds.jpeg"
      }, 
      {
        "key": "zaoan", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/zaoan.jpeg"
      }, 
      {
        "key": "zbc", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/zbc.jpeg"
      }, 
      {
        "key": "zhengjing", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/zhengjing.jpeg"
      }, 
      {
        "key": "zuideman", 
        "val": "https://jsd.myxz.top/npm/mnochen@1.0.1/zuideman.jpeg"
      }
    ]
  }
```

#tab5

``` json [natu.json] lang="json"
  {
    "name": "那兔",
    "type": "image",
    "items": [
      {
        "key": "那兔-1",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/。。。.png"
      },
      {
        "key": "那兔-2", 
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/一见钟情.png"
      },
      {
        "key": "那兔-3",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/你丫试试.png"
      },
      {
        "key": "那兔-4",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/合个影.png"
      },
      {
        "key": "那兔-5",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/呃.png"
      },
      {
        "key": "那兔-6",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/囧.png"
      },
      {
        "key": "那兔-7",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/奈我何.png"
      },
      {
        "key": "那兔-8",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/好滴.png"
      },
      {
        "key": "那兔-9",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/心碎.png"
      },
      {
        "key": "那兔-10",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/恶代官.png"
      },
      {
        "key": "那兔-11",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/懒得理你.png"
      },
      {
        "key": "那兔-12",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/找事儿.png"
      },
      {
        "key": "那兔-13",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/擦.png"
      },
      {
        "key": "那兔-14",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/深思.png"
      },
      {
        "key": "那兔-15",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/痴呆.png"
      },
      {
        "key": "那兔-16",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/讲道理.png"
      },
      {
        "key": "那兔-17",
        "val": "https://cdn.jsdelivr.net/gh/2x-ercha/twikoo-magic@master/image/那兔/说什么喵.png"
      }
    ]
  }
```

#tab6

``` json [weixin.json] lang="json"
  {
    "name": "微信", 
    "type": "image",
    "items": [
      {
        "key": "微笑", 
        "val": "/emoji/wx/wx_001.png"
      }, 
      {
        "key": "撇嘴", 
        "val": "/emoji/wx/wx_002.png"
      }, 
      {
        "key": "色", 
        "val": "/emoji/wx/wx_003.png"
      }, 
      {
        "key": "发呆", 
        "val": "/emoji/wx/wx_004.png"
      }, 
      {
        "key": "得意", 
        "val": "/emoji/wx/wx_005.png"
      }, 
      {
        "key": "流泪", 
        "val": "/emoji/wx/wx_006.png"
      }, 
      {
        "key": "害羞", 
        "val": "/emoji/wx/wx_007.png"
      }, 
      {
        "key": "闭嘴", 
        "val": "/emoji/wx/wx_008.png"
      }, 
      {
        "key": "睡", 
        "val": "/emoji/wx/wx_009.png"
      }, 
      {
        "key": "大哭", 
        "val": "/emoji/wx/wx_010.png"
      }, 
      {
        "key": "尴尬", 
        "val": "/emoji/wx/wx_011.png"
      }, 
      {
        "key": "发怒", 
        "val": "/emoji/wx/wx_012.png"
      }, 
      {
        "key": "调皮", 
        "val": "/emoji/wx/wx_013.png"
      }, 
      {
        "key": "呲牙", 
        "val": "/emoji/wx/wx_014.png"
      }, 
      {
        "key": "惊讶", 
        "val": "/emoji/wx/wx_015.png"
      }, 
      {
        "key": "难过", 
        "val": "/emoji/wx/wx_016.png"
      }, 
      {
        "key": "囧", 
        "val": "/emoji/wx/wx_017.png"
      }, 
      {
        "key": "抓狂", 
        "val": "/emoji/wx/wx_018.png"
      }, 
      {
        "key": "吐", 
        "val": "/emoji/wx/wx_019.png"
      }, 
      {
        "key": "偷笑", 
        "val": "/emoji/wx/wx_020.png"
      }, 
      {
        "key": "愉快", 
        "val": "/emoji/wx/wx_021.png"
      }, 
      {
        "key": "白眼", 
        "val": "/emoji/wx/wx_022.png"
      }, 
      {
        "key": "傲慢", 
        "val": "/emoji/wx/wx_023.png"
      }, 
      {
        "key": "困", 
        "val": "/emoji/wx/wx_024.png"
      }, 
      {
        "key": "惊恐", 
        "val": "/emoji/wx/wx_025.png"
      }, 
      {
        "key": "憨笑", 
        "val": "/emoji/wx/wx_026.png"
      }, 
      {
        "key": "悠闲", 
        "val": "/emoji/wx/wx_027.png"
      }, 
      {
        "key": "咒骂", 
        "val": "/emoji/wx/wx_028.png"
      }, 
      {
        "key": "疑问", 
        "val": "/emoji/wx/wx_029.png"
      }, 
      {
        "key": "嘘", 
        "val": "/emoji/wx/wx_030.png"
      }, 
      {
        "key": "晕", 
        "val": "/emoji/wx/wx_031.png"
      }, 
      {
        "key": "衰", 
        "val": "/emoji/wx/wx_032.png"
      }, 
      {
        "key": "骷髅", 
        "val": "/emoji/wx/wx_033.png"
      }, 
      {
        "key": "敲打", 
        "val": "/emoji/wx/wx_034.png"
      }, 
      {
        "key": "再见", 
        "val": "/emoji/wx/wx_035.png"
      }, 
      {
        "key": "擦汗", 
        "val": "/emoji/wx/wx_036.png"
      }, 
      {
        "key": "抠鼻", 
        "val": "/emoji/wx/wx_037.png"
      }, 
      {
        "key": "鼓掌", 
        "val": "/emoji/wx/wx_038.png"
      }, 
      {
        "key": "坏笑", 
        "val": "/emoji/wx/wx_039.png"
      }, 
      {
        "key": "右哼哼", 
        "val": "/emoji/wx/wx_040.png"
      }, 
      {
        "key": "鄙视", 
        "val": "/emoji/wx/wx_041.png"
      }, 
      {
        "key": "委屈", 
        "val": "/emoji/wx/wx_042.png"
      }, 
      {
        "key": "快哭了", 
        "val": "/emoji/wx/wx_043.png"
      }, 
      {
        "key": "阴险", 
        "val": "/emoji/wx/wx_044.png"
      }, 
      {
        "key": "亲亲", 
        "val": "/emoji/wx/wx_045.png"
      }, 
      {
        "key": "可怜", 
        "val": "/emoji/wx/wx_046.png"
      }, 
      {
        "key": "笑脸", 
        "val": "/emoji/wx/wx_047.png"
      }, 
      {
        "key": "生病", 
        "val": "/emoji/wx/wx_048.png"
      }, 
      {
        "key": "脸红", 
        "val": "/emoji/wx/wx_049.png"
      }, 
      {
        "key": "破涕为笑", 
        "val": "/emoji/wx/wx_050.png"
      }, 
      {
        "key": "恐惧", 
        "val": "/emoji/wx/wx_051.png"
      }, 
      {
        "key": "失望", 
        "val": "/emoji/wx/wx_052.png"
      }, 
      {
        "key": "无语", 
        "val": "/emoji/wx/wx_053.png"
      }, 
      {
        "key": "嘿哈", 
        "val": "/emoji/wx/wx_054.png"
      }, 
      {
        "key": "捂脸", 
        "val": "/emoji/wx/wx_055.png"
      }, 
      {
        "key": "奸笑", 
        "val": "/emoji/wx/wx_056.png"
      }, 
      {
        "key": "机智", 
        "val": "/emoji/wx/wx_057.png"
      }, 
      {
        "key": "皱眉", 
        "val": "/emoji/wx/wx_058.png"
      }, 
      {
        "key": "耶", 
        "val": "/emoji/wx/wx_059.png"
      }, 
      {
        "key": "吃瓜", 
        "val": "/emoji/wx/wx_060.png"
      }, 
      {
        "key": "加油", 
        "val": "/emoji/wx/wx_061.png"
      }, 
      {
        "key": "汗", 
        "val": "/emoji/wx/wx_062.png"
      }, 
      {
        "key": "天啊", 
        "val": "/emoji/wx/wx_063.png"
      }, 
      {
        "key": "Emm", 
        "val": "/emoji/wx/wx_064.png"
      }, 
      {
        "key": "社会社会", 
        "val": "/emoji/wx/wx_065.png"
      }, 
      {
        "key": "旺柴", 
        "val": "/emoji/wx/wx_066.png"
      }, 
      {
        "key": "好的", 
        "val": "/emoji/wx/wx_067.png"
      }, 
      {
        "key": "打脸", 
        "val": "/emoji/wx/wx_068.png"
      }, 
      {
        "key": "哇", 
        "val": "/emoji/wx/wx_069.png"
      }, 
      {
        "key": "翻白眼", 
        "val": "/emoji/wx/wx_070.png"
      }, 
      {
        "key": "666", 
        "val": "/emoji/wx/wx_071.png"
      }, 
      {
        "key": "让我看看", 
        "val": "/emoji/wx/wx_072.png"
      }, 
      {
        "key": "叹气", 
        "val": "/emoji/wx/wx_073.png"
      }, 
      {
        "key": "苦涩", 
        "val": "/emoji/wx/wx_074.png"
      }, 
      {
        "key": "裂开", 
        "val": "/emoji/wx/wx_075.png"
      }, 
      {
        "key": "嘴唇", 
        "val": "/emoji/wx/wx_076.png"
      }, 
      {
        "key": "爱心", 
        "val": "/emoji/wx/wx_077.png"
      }, 
      {
        "key": "心碎", 
        "val": "/emoji/wx/wx_078.png"
      }, 
      {
        "key": "拥抱", 
        "val": "/emoji/wx/wx_079.png"
      }, 
      {
        "key": "强", 
        "val": "/emoji/wx/wx_080.png"
      }, 
      {
        "key": "弱", 
        "val": "/emoji/wx/wx_081.png"
      }, 
      {
        "key": "握手", 
        "val": "/emoji/wx/wx_082.png"
      }, 
      {
        "key": "胜利", 
        "val": "/emoji/wx/wx_083.png"
      }, 
      {
        "key": "抱拳", 
        "val": "/emoji/wx/wx_084.png"
      }, 
      {
        "key": "勾引", 
        "val": "/emoji/wx/wx_085.png"
      }, 
      {
        "key": "拳头", 
        "val": "/emoji/wx/wx_086.png"
      }, 
      {
        "key": "OK", 
        "val": "/emoji/wx/wx_087.png"
      }, 
      {
        "key": "合十", 
        "val": "/emoji/wx/wx_088.png"
      }, 
      {
        "key": "啤酒", 
        "val": "/emoji/wx/wx_089.png"
      }, 
      {
        "key": "咖啡", 
        "val": "/emoji/wx/wx_090.png"
      }, 
      {
        "key": "蛋糕", 
        "val": "/emoji/wx/wx_091.png"
      }, 
      {
        "key": "玫瑰", 
        "val": "/emoji/wx/wx_092.png"
      }, 
      {
        "key": "凋谢", 
        "val": "/emoji/wx/wx_093.png"
      }, 
      {
        "key": "菜刀", 
        "val": "/emoji/wx/wx_094.png"
      }, 
      {
        "key": "炸弹", 
        "val": "/emoji/wx/wx_095.png"
      }, 
      {
        "key": "便便", 
        "val": "/emoji/wx/wx_096.png"
      }, 
      {
        "key": "月亮", 
        "val": "/emoji/wx/wx_097.png"
      }, 
      {
        "key": "太阳", 
        "val": "/emoji/wx/wx_098.png"
      }, 
      {
        "key": "庆祝", 
        "val": "/emoji/wx/wx_099.png"
      }, 
      {
        "key": "礼物", 
        "val": "/emoji/wx/wx_100.png"
      }, 
      {
        "key": "红包", 
        "val": "/emoji/wx/wx_101.png"
      }, 
      {
        "key": "發", 
        "val": "/emoji/wx/wx_102.png"
      }, 
      {
        "key": "福", 
        "val": "/emoji/wx/wx_103.png"
      }, 
      {
        "key": "烟花", 
        "val": "/emoji/wx/wx_104.png"
      }, 
      {
        "key": "爆竹", 
        "val": "/emoji/wx/wx_105.png"
      }, 
      {
        "key": "猪头", 
        "val": "/emoji/wx/wx_106.png"
      }, 
      {
        "key": "跳跳", 
        "val": "/emoji/wx/wx_107.png"
      }, 
      {
        "key": "发抖", 
        "val": "/emoji/wx/wx_108.png"
      }, 
      {
        "key": "转圈", 
        "val": "/emoji/wx/wx_109.png"
      }
    ]
  }
```

#tab7

::alert{type="warning" card}
#title
注意
#default
本表情包列表可能会出现多种不同风格，会酌情分开（可以统合为一体），因为是从各大社交平台上进行筛选所以会出现一些无法标注用途的东西。

如果冒犯到原作者本人的情况下，可以进行联系
::

::tab{:tabs='["Setphen樽", "大傻椿"]'}
#tab1
``` json lang="json"
  {
    "name": "爱弥斯",
    "type": "image",
    "items": [
      {
        "key": "双连震惊",
        "val": "/image/OwOAsset/WutheringWaves/ams/1.gif"
      },
      {
        "key": "舔屏",
        "val": "/image/OwOAsset/WutheringWaves/ams/2.gif"
      },
      {
        "key": "晕头转向",
        "val": "/image/OwOAsset/WutheringWaves/ams/3.gif"
      },
      {
        "key": "三连问",
        "val": "/image/OwOAsset/WutheringWaves/ams/4.gif"
      },
      {
        "key": "大笑",
        "val": "/image/OwOAsset/WutheringWaves/ams/5.gif"
      },
      {
        "key": "外转打Call",
        "val": "/image/OwOAsset/WutheringWaves/ams/6.gif"
      },
      {
        "key": "挥舞打Call",
        "val": "/image/OwOAsset/WutheringWaves/ams/7.gif"
      },
      {
        "key": "往下看",
        "val": "/image/OwOAsset/WutheringWaves/ams/8.gif"
      },
      {
        "key": "呼吸机",
        "val": "/image/OwOAsset/WutheringWaves/ams/9.gif"
      },
      {
        "key": "抓栏杆哈气",
        "val": "/image/OwOAsset/WutheringWaves/ams/10.gif"
      },
      {
        "key": "抓栏杆委屈",
        "val": "/image/OwOAsset/WutheringWaves/ams/11.gif"
      },
      {
        "key": "别难过",
        "val": "/image/OwOAsset/WutheringWaves/ams/12.gif"
      },
      {
        "key": "LOVE",
        "val": "/image/OwOAsset/WutheringWaves/ams/13.gif"
      },
      {
        "key": "捧心",
        "val": "/image/OwOAsset/WutheringWaves/ams/14.gif"
      },
      {
        "key": "兴奋握刀叉",
        "val": "/image/OwOAsset/WutheringWaves/ams/15.gif"
      },
      {
        "key": "惊讶放键盘",
        "val": "/image/OwOAsset/WutheringWaves/ams/16.gif"
      },
      {
        "key": "敲键盘",
        "val": "/image/OwOAsset/WutheringWaves/ams/17.gif"
      },
      {
        "key": "握键盘无奈",
        "val": "/image/OwOAsset/WutheringWaves/ams/18.gif"
      },
      {
        "key": "握刀",
        "val": "/image/OwOAsset/WutheringWaves/ams/19.gif"
      },
      {
        "key": "黑脸握刀",
        "val": "/image/OwOAsset/WutheringWaves/ams/20.gif"
      },
      {
        "key": "持筷微笑",
        "val": "/image/OwOAsset/WutheringWaves/ams/21.gif"
      },
      {
        "key": "给予东西",
        "val": "/image/OwOAsset/WutheringWaves/ams/22.gif"
      },
      {
        "key": "张嘴",
        "val": "/image/OwOAsset/WutheringWaves/ams/23.gif"
      },
      {
        "key": "0分牌",
        "val": "/image/OwOAsset/WutheringWaves/ams/24.gif"
      },
      {
        "key": "10分牌",
        "val": "/image/OwOAsset/WutheringWaves/ams/25.gif"
      },
      {
        "key": "笑竖拇指",
        "val": "/image/OwOAsset/WutheringWaves/ams/26.gif"
      },
      {
        "key": "无奈嫌弃",
        "val": "/image/OwOAsset/WutheringWaves/ams/27.gif"
      },
      {
        "key": "处理繁忙",
        "val": "/image/OwOAsset/WutheringWaves/ams/28.gif"
      },
      {
        "key": "处理快速",
        "val": "/image/OwOAsset/WutheringWaves/ams/29.gif"
      },
      {
        "key": "生气愤怒",
        "val": "/image/OwOAsset/WutheringWaves/ams/30.gif"
      },
      {
        "key": "睡觉中",
        "val": "/image/OwOAsset/WutheringWaves/ams/31.gif"
      },
      {
        "key": "期待中",
        "val": "/image/OwOAsset/WutheringWaves/ams/32.gif"
      },
      {
        "key": "害羞中",
        "val": "/image/OwOAsset/WutheringWaves/ams/33.gif"
      },
      {
        "key": "忧郁中",
        "val": "/image/OwOAsset/WutheringWaves/ams/34.gif"
      },
      {
        "key": "吸奶茶",
        "val": "/image/OwOAsset/WutheringWaves/ams/35.gif"
      },
      {
        "key": "金球送礼",
        "val": "/image/OwOAsset/WutheringWaves/ams/36.gif"
      },
      {
        "key": "连出三金",
        "val": "/image/OwOAsset/WutheringWaves/ams/37.gif"
      },
      {
        "key": "点头记录",
        "val": "/image/OwOAsset/WutheringWaves/ams/38.gif"
      },
      {
        "key": "打方向盘",
        "val": "/image/OwOAsset/WutheringWaves/ams/39.gif"
      },
      {
        "key": "记录中",
        "val": "/image/OwOAsset/WutheringWaves/ams/40.gif"
      },
      {
        "key": "紧张中",
        "val": "/image/OwOAsset/WutheringWaves/ams/41.gif"
      },
      {
        "key": "惊讶",
        "val": "/image/OwOAsset/WutheringWaves/ams/42.gif"
      },
      {
        "key": "静用声音",
        "val": "/image/OwOAsset/WutheringWaves/ams/43.gif"
      },
      {
        "key": "解禁声音",
        "val": "/image/OwOAsset/WutheringWaves/ams/44.gif"
      },
      {
        "key": "困倦",
        "val": "/image/OwOAsset/WutheringWaves/ams/45.gif"
      },
      {
        "key": "双行流泪",
        "val": "/image/OwOAsset/WutheringWaves/ams/46.gif"
      },
      {
        "key": "非常委屈",
        "val": "/image/OwOAsset/WutheringWaves/ams/47.gif"
      },
      {
        "key": "快速探头",
        "val": "/image/OwOAsset/WutheringWaves/ams/48.gif"
      },
      {
        "key": "探头偷看",
        "val": "/image/OwOAsset/WutheringWaves/ams/49.gif"
      },
      {
        "key": "献花",
        "val": "/image/OwOAsset/WutheringWaves/ams/50.gif"
      },
      {
        "key": "被摸头",
        "val": "/image/OwOAsset/WutheringWaves/ams/51.gif"
      },
      {
        "key": "握拳兴奋",
        "val": "/image/OwOAsset/WutheringWaves/ams/52.gif"
      },
      {
        "key": "闪钱握袋",
        "val": "/image/OwOAsset/WutheringWaves/ams/53.gif"
      },
      {
        "key": "被敲头",
        "val": "/image/OwOAsset/WutheringWaves/ams/54.gif"
      },
      {
        "key": "捧锤手拍",
        "val": "/image/OwOAsset/WutheringWaves/ams/55.gif"
      },
      {
        "key": "黑脸拿红锤",
        "val": "/image/OwOAsset/WutheringWaves/ams/56.gif"
      },
      {
        "key": "黑脸拿勾锁",
        "val": "/image/OwOAsset/WutheringWaves/ams/57.gif"
      },
      {
        "key": "手拿勾锁",
        "val": "/image/OwOAsset/WutheringWaves/ams/58.gif"
      },
      {
        "key": "黑脸摇勾锁",
        "val": "/image/OwOAsset/WutheringWaves/ams/59.gif"
      },
      {
        "key": "非常愤怒",
        "val": "/image/OwOAsset/WutheringWaves/ams/60.gif"
      },
      {
        "key": "U眼睡觉",
        "val": "/image/OwOAsset/WutheringWaves/ams/61.gif"
      },
      {
        "key": "横眼睡觉",
        "val": "/image/OwOAsset/WutheringWaves/ams/62.gif"
      },
      {
        "key": "被窝玩手机",
        "val": "/image/OwOAsset/WutheringWaves/ams/63.gif"
      },
      {
        "key": "玩手机困倦",
        "val": "/image/OwOAsset/WutheringWaves/ams/64.gif"
      },
      {
        "key": "吓得魂飞",
        "val": "/image/OwOAsset/WutheringWaves/ams/65.gif"
      }
    ]
  }
```

#tab2
**注意**
该版本来源于大傻椿，不知原作者是谁所以默认为发布者

``` json lang="json"
  {
    "name": "爱弥斯",
    "type": "image",
    "items": [
      {
        "key": "墙探头",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/墙探头.gif"
      },
      {
        "key": "求盛饭",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/求盛饭.gif"
      },
      {
        "key": "失魂",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/失魂.gif"
      },
      {
        "key": "睡觉中",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/睡觉中.gif"
      },
      {
        "key": "探头",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/探头.gif"
      },
      {
        "key": "舔屏",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/舔屏.gif"
      },
      {
        "key": "捂嘴笑",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/捂嘴笑.gif"
      },
      {
        "key": "献花",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/献花.gif"
      },
      {
        "key": "摇人",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/摇人.gif"
      },
      {
        "key": "支持飞行雪绒",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/支持飞行雪绒.gif"
      },
      {
        "key": "抓住",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/抓住.gif"
      },
      {
        "key": "被摸头",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/被摸头.gif"
      },
      {
        "key": "比心",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/比心.gif"
      },
      {
        "key": "不OK",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/不OK.gif"
      },
      {
        "key": "蹭黑猫",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/蹭黑猫.gif"
      },
      {
        "key": "吃瓜",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/吃瓜.gif"
      },
      {
        "key": "很OK",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/很OK.gif"
      },
      {
        "key": "记录",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/记录.gif"
      },
      {
        "key": "静音",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/静音.gif"
      },
      {
        "key": "脸红",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/脸红.gif"
      },
      {
        "key": "脑袋过载",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/脑袋过载.gif"
      },
      {
        "key": "捏脸",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/捏脸.gif"
      },
      {
        "key": "欧啦欧啦",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/欧啦欧啦.gif"
      },
      {
        "key": "期待",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/期待.gif"
      },
      {
        "key": "气愤",
        "val": "https://nuxtsource.s3.bitiful.net/OwO/ams/大傻椿/气愤.gif"
      }
    ]
  }
```
::
::