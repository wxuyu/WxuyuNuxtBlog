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
import fs from 'fs/promises'
import crypto from 'crypto' // 引入 Node.js 内置的加密模块
import { fileURLToPath } from 'url'

// 获取当前文件的目录路径，兼容 ESM
const __filename = fileURLToPath(import.meta.url)

function pluginPath(path: string) {
	return pathToFileURL(resolve(`./remark-plugins/${path}.ts`)).href
}

// =========================================================
// 1. 核心：自定义版本号生成器（满足复杂的进位规则）
// =========================================================
function generateSequentialVersion(): string {
  // 生成 30 字节（240位）的随机数，转为 BigInt 以保证绝对精度
  // 这能提供极大的熵空间，确保每次构建都不会重复
  const randomHex = crypto.randomBytes(30).toString('hex')
  const bigInt = BigInt(`0x${randomHex}`)
  
  // 依据你的规则从低位到高位（或从右到左）切片：
  // 第6部分 (e): 取最后 1 位数字 (0-9)
  const p5 = (bigInt / 10n) % 1000000000n
  
  // 第5部分 (d): 取接下来的 9 位数字 (0-999999999)
  const p4 = (bigInt / 10000000000n) % 10000000n
  
  // 第4部分 (c): 取接下来的 7 位数字 (0-9999999)
  const p3 = (bigInt / 100000000000000000n) % 100000n
  
  // 第3部分 (b): 取接下来的 5 位数字 (0-99999)
  const p2 = (bigInt / 10000000000000000000000n) % 10n
  
  // 第2部分 (a): 取接下来的 1 位数字 (0-9)
  const p1 = bigInt % 10n

  // 拼接成你指定的最终格式
  return `WenXuYu_ServiceWorker_V${p1}.${p2}.${p3}.${p4}.${p5}_alpha`
}

// =========================================================
// 2. 核心：带有“延迟生成”逻辑的 Vite 插件工厂
// =========================================================
function createSwBuildPlugin(swEntry: string, buildVersion: string) {
  return {
    name: 'vite-plugin-sw-version-injector',
    enforce: 'pre' as const,

    resolveId(id: string) {
      if (id === 'virtual:sw-version') {
        return id;
      }
      return null;
    },

    async load(id: string) {
      if (id === 'virtual:sw-version') {
        // 1. 生成随机基础数字
        let versionBase = Math.floor(Math.random() * 1000000);
        console.log(`[SW Build] Generated base version: ${versionBase}. Pausing for 1 second...`);
        
        // 2. 💤 停滞 1 秒钟
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 3. 结合时间戳生成最终版本号
        const finalVersion = `${versionBase}-${Date.now()}`;
        console.log(`[SW Build] Final version injected: ${finalVersion}`);

        return `export const BUILD_VERSION = '${finalVersion}';`;
      }
      return null;
    },

    transform(code: string, id: string) {
      if (id === swEntry) {
        return code.replace(
          /import\s+{\s*BUILD_VERSION\s*}\s+from\s+['"]virtual:sw-version['"];/,
          ''
        ).replace(/'__INJECTED_VERSION__'/g, `'${buildVersion}'`); 
      }
      return code;
    }
  }
}

// =========================================================
// 3. 通用：独立构建 Service Worker 的函数
// =========================================================
async function buildServiceWorker(outputDir: string, isDev: boolean) {
  const { build } = await import('vite')
  const swEntry = resolve(process.cwd(), './app/utils/sw.ts') 
  const swOutput = resolve(outputDir, 'sw.js')

  console.log(`[SW] ${isDev ? 'Dev' : 'Prod'} mode: Building Service Worker...`)

  // 调用我们全新的复杂版本号生成器
  const buildVersion = generateSequentialVersion();
  console.log(`[SW] Generated Complex Version: ${buildVersion}`);

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
    plugins: [createSwBuildPlugin(swEntry, buildVersion)]
  })

  await fs.access(swOutput).catch(() => {
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
      if (nitro.options.dev) {
        nitro.hooks.hook('compiled', async () => {
          const version = generateSequentialVersion();
          nitro.options.runtimeConfig.public.swVersion = version;
          await buildServiceWorker(nitro.options.output.publicDir, true)
        })
      } else {
        nitro.hooks.hook('compiled', async () => {
          const version = generateSequentialVersion();
          nitro.options.runtimeConfig.public.swVersion = version;
          await buildServiceWorker(nitro.options.output.publicDir, false)
        })
      }
    },
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
