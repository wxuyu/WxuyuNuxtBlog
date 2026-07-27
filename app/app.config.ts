import type { Nav, NavItem } from '~/types/nav'
import { Temporal } from 'temporal-polyfill'
import blogConfig from '~~/blog.config'
import { version } from '~~/package.json'

// 图标查询：https://yesicon.app/ph?s=bold
// 图标插件：https://marketplace.visualstudio.com/items?itemName=antfu.iconify
// @keep-sorted
export default defineAppConfig({
	// 将 blog.config 中的配置项复制到 appConfig，方便调用
	...blogConfig,

	component: {
		alert: {
			/** 默认使用卡片风格还是扁平风格 */
			defaultStyle: 'card' as 'card' | 'flat',
		},

		codeblock: {
			/** 代码块触发折叠的行数 */
			triggerRows: 32,
			/** 代码块折叠后的行数 */
			collapsedRows: 16,
			/** 启用代码块缩进导航会关闭空格渲染 */
			enableIndentGuide: true,
			/** 代码块缩进导航(Indent Guige)竖线匹配空格数 */
			indent: 4,
			/** tab渲染宽度 */
			tabSize: 3,
		},

		/** 文章开头摘要 */
		excerpt: {
			animation: true,
			caret: '_',
			label: blogConfig.excerpt?.label ?? '智能摘要',
			badge: blogConfig.excerpt?.badge ?? 'Kimi·K2-Turbo',
		},

		presence: {
			/** 右侧在线状态组件轮询间隔（毫秒） */
			refreshInterval: 15000,
		},

		/** 精选文章 Slide */
		slide: {
			/** 适合封面图无字时启用 */
			showTitle: true,
		},

		stats: {
			/** 归档页面每年标题对应的年龄 */
			birthYear: 2006,
			/** blog-stats widget 的预置文本 */
			wordCount: '约10万',
		},

      sidebar: {
         show: 'left' as 'top' | 'left',
      }
	},

	// @keep-sorted
	footer: {
		/** 页脚版权信息，支持 <br> 换行等 HTML 标签 */
		copyright: `© ${Temporal.Now.plainDateISO().year.toString()} ${blogConfig.author.name}`,
		/** 侧边栏底部装饰图片配置 */
		// decorativeImage: {
		//	url: 'https://blog-files.101045700.xyz/MaitetsuVideoFix/Home.webp', // 装饰图 URL，为空则不显示
		//	opacity: 0.6, // 透明度（0~1），越小越淡
		//	height: '12rem', // 装饰层高度
		//	backgroundSize: 'cover', // 背景拉伸方式
		//	backgroundPosition: 'center', // 背景定位
		//	backgroundRepeat: 'no-repeat', // 背景是否重复
		// },
		/** 侧边栏底部图标导航 */
		iconNav: [
			{ icon: 'ph:house-bold', text: '个人主页', url: blogConfig.author.homepage },
			// { icon: 'ri:qq-line', text: '交流群: 169994096', url: 'https://jq.qq.com/?_wv=1027&k=lQfNSeEd' },
			// { icon: 'ph:github-logo-bold', text: 'GitHub: L33Z22L11', url: 'https://github.com/L33Z22L11' },
			{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
			{ icon: 'ph:subway-bold', text: '开往', url: 'https://www.travellings.cn/' },
		] satisfies NavItem[],
		/** 页脚版权信息底部的其他信息 */
		message: '',
		/** 页脚站点地图 */
		nav: [
			{
				title: '探索',
				items: [
					{ icon: 'ph:rss-simple-bold', text: 'Atom订阅', url: '/atom.xml' },
					{ icon: 'ph:subway-bold', text: '开往', url: 'https://www.travellings.cn/' },
				],
			},
			{
				title: '社交',
				items: [
					{ icon: 'ph:github-logo-bold', text: 'wxuyu', url: 'https://github.com/wxuyu' },
					// { icon: 'ri:qq-line', text: '群: 169994096', url: 'https://jq.qq.com/?_wv=1027&k=lQfNSeEd' },
					{ icon: 'ph:envelope-simple-bold', text: blogConfig.author.email, url: `mailto:${blogConfig.author.email}` },
				],
			},
			{
				title: '信息',
				items: [
					// { icon: 'simple-icons:nuxtdotjs', text: `主题: Clarity ${version}`, url: 'https://github.com/L33Z22L11/blog-v3' },
					// { icon: 'ph:swatches-bold', text: '主题和组件文档', url: '/theme' },
					{ icon: 'ph:certificate-bold', text: '萌备20251949号', url: 'https://icp.gov.moe/?keyword=20251949' },
				]
			},
		] satisfies Nav,
	},

	/** 左侧栏顶部 Logo */
	header: {
		logo: '/image/SiteCover/avatar.avif',
		/** 展示标题文本，否则展示纯 Logo */
		showTitle: true,
		subtitle: blogConfig.subtitle,
	},

	/** 友链页面 */
	link: {
		/** 无订阅源展示静音图标 */
		remindNoFeed: true,
		/** 友链分组内随机排序 */
		randomInGroup: true,
      /** 友链朋友圈API */
      CircleApi: 'https://circle.wxuyu.top',
      CircleEndTotal: 20,
	},

  essay: {
    API: {
      ISPEAK: 'https://ispeak.api.wxuyu.top/',
      MEMOS: '',
    },
    CONFIG: {
      ISPEAK_CONFIG: {
        author: '69d21e1f84a9d355ffe37d55',
        error_image: 'https://lib.bsgun.cn/Hexo-static/img/avatar.256.avif'
      },
      LOCAL_ESSAY: {
        page_size: 10
      },
    },
    TYPE: 'local',
  },

  hotGetConfig: {
    Api: 'https://hot-api.liiiu.cn',
    timeout: 200,
    RefreshInterval: 5 * 60 * 1000,
  },

  /** 音乐播放器配置 */
  music: {
    /**
     * 数据源模式
     *   'local'  — 仅本地 TS 数据
     *   'api'    — 仅音乐平台 API
     *   'hybrid' — 本地 + 云端混合（由 enableLocal / enableApi 控制）
     */
    source: 'hybrid' as 'local' | 'api' | 'hybrid',
    /**
     * hybrid 模式下的子开关（仅在 source = 'hybrid' 时生效）
     *   enableLocal = true  → 拉取本地歌单
     *   enableApi   = true  → 拉取云端歌单
     * 两个同时为 true 才合并；仅一个为 true 时退化为单选。
     */
    enableLocal: true,
    enableApi: true,
    /**
     * 歌单合并顺序（hybrid 模式生效）
     *   'local-first' — 本地在前（默认）
     *   'api-first'   — 云端在前
     */
    mergeOrder: 'local-first' as 'local-first' | 'api-first',
    /** 歌词显示 */
    lyrics: {
      show: true,
    },
    /** 默认音量 (0-1) */
    defaultVolume: 0.5,
    /** API 配置（source = 'api' / source = 'hybrid' 且 enableApi = true 时生效）
     *  当前激活的 provider 由 `api.provider` 决定，其余字段按需填入。
     *  - netease：使用 `netease.*` 子配置
     *  - qq：使用 `qq.*` 子配置
     *  - spotify：暂未实装
     */
    api: {
      provider: 'qq' as 'netease' | 'qq' | 'spotify',

      /** 网易云配置（用户自部署 NeteaseCloudMusicApi Enhanced） */
      netease: {
        // 默认指向 http://localhost:3000；如部署在服务器请改为实际地址
        baseUrl: 'https://netease-cloud-music-api-theta-flame-74.vercel.app',
        // 网易云 cookie（MUSIC_U=...；高级音质/私人 FM 需要；非必须时留空）
        cookie: '',
        // 音质等级：standard / higher / exhigh / lossless / hires / jyeffect / sky / dolby / jymaster
        level: 'exhigh' as
          | 'standard' | 'higher' | 'exhigh' | 'lossless'
          | 'hires' | 'jyeffect' | 'sky' | 'dolby' | 'jymaster',
        /**
         * 歌单配置（推荐使用）
         * 每个条目包含 id（必填，数字字符串）+ name/desc/cover/author（可选，不填则用 API 返回值）
         * 留空表示不拉取云端歌单。
         *
         * 示例：
         *   playlists: [
         *     { id: '24381616', name: '我的私人推荐', desc: '自动每日推荐' },
         *     { id: '3778678',  name: '纯音乐', cover: '/img/music/classical.jpg' },
         *   ]
         */
        playlists: [
          { id: '24381616', name: '我的私人推荐', desc: '自动每日推荐', cover: '', author: '' },
        ] as Array<{
          id: string
          name?: string
          desc?: string
          cover?: string
          author?: string
          disabled?: boolean
        }>,
        // 简单歌单 ID 列表（向后兼容）；如果上面 playlists 非空则被忽略
        playlistIds: [] as string[],
        // 是否启用解灰音源（/song/url/match）兜底（默认 false）
        unblock: false,
      },

      /** QQ 音乐配置（提供两个后端实现，通过 `type` 字段切换）
       *   - 'ygking'      → api.ygking.top 公共实例（默认；向后兼容）
       *   - 'sansenjian'  → 自部署 @sansenjian/qq-music-api（默认 baseUrl http://localhost:3200）
       * 切换 type 后无需重启 dev server，下次进入页面或刷新页面生效。
       */
      qq: {
        // 后端实现类型
        type: 'ygking' as 'ygking' | 'sansenjian',
        // baseUrl 留空时根据 type 使用不同默认值：
        //   type='ygking'      → https://api.ygking.top
        //   type='sansenjian'  → http://localhost:3200
        baseUrl: 'https://api.ygking.top',
        // 音质：master / atmos / atmos_2 / atmos_51 / flac / 320 / 128
        quality: '320' as
          | 'master' | 'atmos' | 'atmos_2' | 'atmos_51' | 'flac' | '320' | '128',
        /**
         * 歌单配置（推荐使用）
         * 每个条目包含 id（必填，数字）+ name/desc/cover/author（可选）
         * 留空表示不拉取云端歌单。
         *
         * 示例：
         *   playlists: [
         *     { id: 97773, name: '热歌榜' },
         *     { id: 24381616, desc: '我的收藏' },
         *   ]
         */
        playlists: [
          { id: 8195556947, name: '古风调｜袅娜少女羞，岁月无忧愁' },
        ] as Array<{
          id: number
          name?: string
          desc?: string
          cover?: string
          author?: string
          disabled?: boolean
        }>,
        // 简单歌单 ID 列表（向后兼容）；如果上面 playlists 非空则被忽略
        playlistIds: [] as number[],
        // 是否同时取逐字歌词（QRC）
        fetchQrc: false,
        // 是否同时取翻译
        fetchTrans: false,
        // 是否同时取罗马音（仅 QRC 生效，需 fetchQrc=true）
        fetchRoma: false,
      },
    },
	 defaultMode: 'list' as 'list' | 'single' | 'random',
  },

  serviceWorker: {
    // 1. 主开关：设为 false 时，客户端将注销并停止所有 Service Worker
    enabled: true, 
    
    // 2. 缓存规则
    cacheRules: {
      // 需要拦截缓存的文件后缀
      extensions: ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'woff2', 'woff', 'ttf'],
      // 额外需要缓存的 MIME 类型
      mimeTypes: ['image', 'font'],
      escapeDoors: ['/api/recent-comments', '/api/stats']
    },
    
    // 3. 永久缓存开关与过期时间（单位：秒）
    // 若 permanent 为 true，则无视 maxAge；若为 false，超过 maxAge 的资源会被重新拉取
    permanent: true, 
    maxAge: 3600 * 24 * 30, // 30天
    
    // 4. 逃生门 (Escape Door)
    // 当请求 URL 包含此前缀时，Service Worker 将彻底放行，不做任何拦截
    // 可用于动态大文件下载或需要实时获取的后端接口
    escapeDoor: ['/api/recent-comments'], 
    
    // 5. 版本号 (由构建时自动注入，此处仅为类型提示)
    // 在 sw.ts 中我们会通过模板字符串自动生成时间戳
  },

	/** 左侧栏导航 */
	nav: [
		{
			title: '',
			items: [
				{ icon: 'ph:files-bold', text: '丹青妙笔', url: '/'},
        {
          icon: 'ph:feather-bold',
          text: '笔墨之连',
          url: '#',
          children: [
            { icon: 'ph:archive-bold', text: '经卷藏珍', url: '/archive'},
            { icon: 'ph:signature', text: '云篆星徽', url: '/tags' },
					],
        },
        {
          icon: 'ph:link-bold',
          text: '好友之结',
          url: '#',
          children: [
            { icon: 'ph:link-bold', text: '竹林旧友', url: '/link'},
            { icon: 'ph:fish-bold', text: '塘文集锦', url: '/circle' },
					],
        },
        {
          icon: 'ph:function-bold',
          text: '功能集合',
          url: '#',
          children: [
            { icon: 'i-mingcute:bilibili-line', text: '追更历史', url: '/banguim' },
            { icon: 'ph:star-of-david-bold', text:'优良精装', url:'/equipment'},
            { icon: 'ph:steam-logo-bold', text: '游戏时刻', url: '/steam'},
            { icon: 'ph:lightning-bold', text:'闲言碎语', url:'/essay' },
            { icon: 'bxs:hot', text:'热搜', url:'/hot'}
					],
        },
        // { icon: 'ph:chats-bold', text:'​纸笺寄语', url:'/comments' },
				// { icon: 'ph:aperture-bold', text:'探索发现', url:'/discovery'},
				{ icon: 'ph:apple-podcasts-logo-bold', text:'关于自己', url:'/about' },
			],
		},
	] satisfies Nav,

	pagination: {
		perPage: 10,
		/** 默认排序方式，需要是 this.article.order 中的键名 */
		sortOrder: 'date' as keyof typeof blogConfig.article.order,
		/** 允许（普通/预览/归档）文章列表正序，开启后排序方式左侧图标可切换顺序 */
		allowAscending: false,
	},

	themes: {
		light: {
			icon: 'ph:sun-bold',
			tip: '浅色模式',
		},
		system: {
			icon: 'ph:monitor-bold',
			tip: '跟随系统',
		},
		dark: {
			icon: 'ph:moon-bold',
			tip: '深色模式',
		},
	},
})
