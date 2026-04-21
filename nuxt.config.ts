import { resolve, dirname } from 'node:path'
import { arch, env, version as nodeVersion, platform } from 'node:process'
import { pathToFileURL } from 'node:url'
import { name as ciName, CLOUDFLARE_PAGES, GITHUB_ACTIONS, NETLIFY } from 'ci-info'
import { mapValues } from 'es-toolkit/object'
import { pascalCase } from 'es-toolkit/string'
import { Temporal } from 'temporal-polyfill'
import blogConfig from './blog.config'
import packageJson from './package.json'
import redirectList from './redirects.json'

function pluginPath(path: string) {
	return pathToFileURL(resolve(`./remark-plugins/${path}.ts`)).href
}

// 🔽 核心修复 1：将 promises 模块重命名为 fsp，避免与类型命名空间冲突
// 不再需要 crypto，保留 fsp 用于文件读写
import fsp from 'fs/promises' 
import fs from 'fs' // 引入同步 fs 用于即时读写

// =========================================================
// 1. 核心：基于构建时间生成版本号 (V年.月.日.时.分.秒)
// =========================================================
function generateBuildTimeVersion(): string {
  const now = new Date()
  
  // 辅助函数：保证两位数格式
  const pad = (num: number) => num.toString().padStart(2, '0')
  
  const year = now.getFullYear()
  const month = pad(now.getMonth() + 1) // 月份从 0 开始
  const day = pad(now.getDate())
  const hours = pad(now.getHours())
  const minutes = pad(now.getMinutes())
  const seconds = pad(now.getSeconds())

  return `V${year}.${month}.${day}.${hours}.${minutes}`
}

// 提前生成主版本号
const masterVersion = generateBuildTimeVersion()
console.log(`[Build] Master Version Generated: ${masterVersion}`)

// 2. SW 版本注入插件
function createSwBuildPlugin(swEntry: string, buildVersion: string) {
  return {
    name: 'vite-plugin-sw-version-injector',
    enforce: 'pre' as const,
    resolveId(id: string) {
      if (id === 'virtual:sw-version') return id
      return null
    },
    async load(id: string) {
      if (id === 'virtual:sw-version') {
        let versionBase = Math.floor(Math.random() * 1000000);
        console.log(`[SW Build] Generated base: ${versionBase}. Pausing 1s...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        const finalVersion = `${versionBase}-${Date.now()}`;
        console.log(`[SW Build] Injected version: ${finalVersion}`);
        return `export const BUILD_VERSION = '${finalVersion}';`;
      }
      return null
    },
    transform(code: string, id: string) {
      if (id === swEntry) {
        const searchValue = "'__INJECTED_VERSION__'"
        const replaceValue = `'${buildVersion}'`
        return code.replace(new RegExp(searchValue, 'g'), replaceValue)
      }
      return code
    }
  }
}

// =========================================================
// 4. 通用：独立构建 Service Worker 的函数
// =========================================================
async function buildServiceWorker(
  outputDir: string, 
  isDev: boolean, 
  buildVersion?: string // 🔽 核心修复 3：将参数设为可选，兼容新旧调用方式
) {
  const { build } = await import('vite')
  const swEntry = resolve(process.cwd(), './app/utils/sw.ts') 
  const swOutput = resolve(outputDir, 'sw.js')

 console.log(`[SW] ${isDev ? 'Dev' : 'Prod'} mode: Building Service Worker...`)

  await build({
    configFile: false,
    build: {
      ssr: false,
      outDir: outputDir,
      emptyOutDir: false, 
      minify: isDev ? false : true, 
      lib: {
        entry: swEntry,
        name: 'sw',
        formats: ['iife'],
        fileName: () => 'sw.js'
      },
      rollupOptions: {
        external: ['virtual:sw-version'], 
        output: {
          entryFileNames: 'sw.js',
          inlineDynamicImports: true
        }
      }
    },
    plugins: buildVersion ? [createSwBuildPlugin(swEntry, buildVersion)] : [] 
  })

  await fsp.access(swOutput).catch(() => {
    throw new Error(`[SW] Build failed: ${swOutput} not found`)
  })
  console.log(`[SW] Build complete -> ${swOutput}`)
}

// 此处配置无需修改
export default defineNuxtConfig({
	app: {
		head: {
			meta: [
				{ name: 'author', content: [blogConfig.author.name, blogConfig.author.email].filter(Boolean).join(', ') },
				{ name: 'color-scheme', content: 'light dark' },
				// 此处为元数据的生成器标识，不建议修改
				{ 'name': 'generator', 'content': `${pascalCase(packageJson.name)} ${packageJson.version}`, 'data-github-repo': packageJson.homepage },
				{ name: 'mobile-web-app-capable', content: 'yes' },
			],
			link: [
				{ rel: 'icon', href: blogConfig.favicon },
				{ rel: 'alternate', type: 'application/atom+xml', href: '/atom.xml' },
				{ rel: 'preconnect', href: 'https://source.yjluo.top' },
				{ rel: 'preconnect', href: blogConfig.author.homepage },
				// { rel: 'stylesheet', href: '/assets/css/artalk.css', media: 'none', onload: 'this.media="all"'  },
        { rel: 'stylesheet', href: 'https://s4.zstatic.net/ajax/libs/lxgw-wenkai-screen-web/1.520.0/lxgwwenkaigbscreen/result.css', media: 'none', onload: 'this.media="all"'  },
			],
			templateParams: {
				separator: '|',
			},
			titleTemplate: `%s %separator ${blogConfig.title}`,
			script: blogConfig.scripts as any,
		},
		rootAttrs: {
			id: 'blog-root',
		},
	},

	compatibilityDate: '2024-08-03',

	components: [
		{ path: '~/components/partial', prefix: 'Z' },
		'~/components',
	],

	css: [
		'@/assets/css/animation.scss',
		'@/assets/css/article.scss',
		'@/assets/css/color.scss',
		'@/assets/css/font.scss',
		'@/assets/css/main.scss',
		'@/assets/css/reusable.scss',
    '@/assets/css/WuWuGameColor.scss',
	],

	// @keep-sorted
	experimental: {
		extractAsyncDataHandlers: true,
		typescriptPlugin: true,
	},

	features: {
		inlineStyles: false,
	},

	nitro: {
		prerender: {
			// 修复部分平台会在文章路径后添加 `/`，导致闪现 404 错误
			// https://github.com/nuxt/content/issues/2378
			autoSubfolderIndex: CLOUDFLARE_PAGES || GITHUB_ACTIONS || NETLIFY ? false : undefined,
		},
	},

	// @keep-sorted
	routeRules: {
		...mapValues(redirectList, to => ({ redirect: { to, statusCode: 308 as const } })),
		'/api/recent-comments': { swr: 60, headers: { 'Content-Type': 'application/json' } },
		'/api/stats': { prerender: true, headers: { 'Content-Type': 'application/json' } },
		'/atom.xml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
		'/favicon.ico': { redirect: { to: blogConfig.favicon } },
		'/zhilu.opml': { prerender: true, headers: { 'Content-Type': 'application/xml' } },
	},

	runtimeConfig: {
		// @keep-sorted
		public: {
			arch,
			buildTime: Temporal.Now.zonedDateTimeISO().toString(),
			// EdgeOne 检测暂时不可用
			ci: env.TENCENTCLOUD_RUNENV === 'SCF' ? 'EdgeOne' : ciName || '',
			nodeVersion,
			platform,
			processReporterLatestEndpoint: env.PROCESS_REPORTER_LATEST_ENDPOINT || blogConfig.presence?.latestEndpoint || '',
      swBuildTime: ''
		},
	},

	/** 在生产环境启用 sourcemap */
	// sourcemap: true,

	typescript: {
		nodeTsConfig: {
			// @keep-sorted
			include: [
				'../remark-plugins/**/*.ts',
				'../scripts/**/*.ts',
			],
		},
	},

	vite: {
		css: {
			preprocessorOptions: {
				scss: {
					additionalData: '@use "@/assets/css/_variable.scss" as *;',
				},
			},
		},
		define: {
			/** 在生产环境启用 Vue DevTools */
			// __VUE_PROD_DEVTOOLS__: 'true',
			/** 在生产环境启用 Vue 水合不匹配详情 */
			// __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: 'true',
		},
		optimizeDeps: {
			// @keep-sorted
			include: ['@shikijs/colorized-brackets', '@shikijs/transformers', '@unhead/schema-org/vue', '@vue/devtools-core', '@vue/devtools-kit', 'embla-carousel-autoplay', 'embla-carousel-vue', 'embla-carousel-wheel-gestures', 'es-toolkit/array', 'es-toolkit/promise', 'es-toolkit/string', 'minisearch', 'parse-domain', 'plain-shiki', 'shiki/themes/catppuccin-latte.mjs', 'shiki/themes/one-dark-pro.mjs', 'temporal-polyfill', 'vue-tippy', 'workbox-window'],
		},
		server: {
			allowedHosts: true,
    },
	},

	// @keep-sorted
	modules: [
		'@bikariya/image-viewer',
		'@bikariya/modals',
		'@bikariya/shiki',
		'@nuxt/a11y',
		'@nuxt/content',
		'@nuxt/hints',
		'@nuxt/icon',
		'@nuxt/image',
		'@nuxtjs/color-mode',
		'@nuxtjs/seo',
		'@pinia/nuxt',
		'@vueuse/nuxt',
		'nuxt-llms',
		'unplugin-yaml/nuxt',
	],

	colorMode: {
		preference: 'system',
		fallback: 'light',
		classSuffix: '',
	},

	content: {
		build: {
			markdown: {
				highlight: false,
				// @keep-sorted
				remarkPlugins: {
					[pluginPath('remark-music')]: {},
					'remark-math': {},
					'remark-reading-time': {},
				},
				// @keep-sorted
				rehypePlugins: {
					[pluginPath('rehype-meta-slots')]: {},
					'rehype-katex': {},
				},
				toc: { depth: 4, searchDepth: 4 },
			},
		},
		experimental: {
			sqliteConnector: 'native',
		},
	},

	hooks: {
		'ready': () => {
			console.info(`
================================
${pascalCase(packageJson.name)} ${packageJson.version}
${packageJson.homepage}
================================
`)
		},
		'content:file:afterParse': (ctx) => {
			const { permalink, path } = ctx.content as Record<string, string | undefined>
			// 优先使用自定义链接（permalink/abbrlink），其次隐藏基于文件路由的 URL 中的 /posts 前缀
			if (permalink)
				ctx.content.path = permalink
			else if (blogConfig.article.hidePostPrefix && path?.startsWith('/posts/'))
				ctx.content.path = path.slice('/posts'.length)
		},
    'nitro:init': (nitro) => {
      // =========================================================
      // 核心改造 3：钩子中不再负责给前端传值，只负责修改物理文件和构建 SW
      // 这样分工明确，绝对不会再出现生产环境 undefined 的问题
      // =========================================================
      try {
        const appConfigPath = resolve(process.cwd(), 'app.config.ts')
        let content = fs.readFileSync(appConfigPath, 'utf-8')
        
        const searchRegex = /serviceWorkerVersion:\s*['"][^'"]*['"]/
        const replaceValue = `serviceWorkerVersion: '${masterVersion}'`
        
        if (content.match(searchRegex)) {
          content = content.replace(searchRegex, replaceValue)
          fs.writeFileSync(appConfigPath, content, 'utf-8')
          console.log(`[AppConfig] Patched to: ${masterVersion}`)
        } else {
          console.warn('[AppConfig] Warning: Pattern not found')
        }
      } catch (e) {
        console.error('[AppConfig] File patch failed:', e)
      }

      // 继续构建 Service Worker
      nitro.hooks.hook('compiled', async () => {
        await buildServiceWorker(nitro.options.output.publicDir, nitro.options.dev, masterVersion)
      })
    }
  },

	icon: {
		customCollections: [
			{ prefix: 'zi', dir: './app/assets/icons' },
		],
		clientBundle: {
			scan: {
				globInclude: ['**\/*.{vue,jsx,tsx,ts,md,mdc,mdx}'],
			},
		},
	},

	image: {
		// 尽量以这些密度点对点显示
		densities: [1, 1.5, 2],
		format: ['avif', 'webp'],
		// Neylify 下 netlify 处理器无法显示站外图片，ipx 处理器无法显示站内图片，需彻底禁用
		// https://github.com/nuxt/image/issues/1353
		provider: NETLIFY ? 'none' : undefined,
	},

	linkChecker: {
		// @keep-sorted
		skipInspections: [
			'no-baseless',
			'no-non-ascii-chars',
			'no-uppercase-chars',
		],
	},

	llms: {
		domain: blogConfig.url,
		title: blogConfig.title,
		description: blogConfig.description,
	},

	ogImage: {
		enabled: false,
	},

	robots: {
		disableNuxtContentIntegration: true,
		disallow: blogConfig.article.robotsNotIndex,
	},

	site: {
		name: blogConfig.title,
		url: blogConfig.url,
		defaultLocale: blogConfig.language,
	},
})
