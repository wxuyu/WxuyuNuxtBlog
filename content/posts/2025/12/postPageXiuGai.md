---
title: 文章美化
description: 该文章记录了项目版本迭代中的UI优化与功能调整，包括增加可后期换配置且内置移动到赞赏总览触发效果的打赏弹窗、优化头部封面移动端预览、增加版权图标虚化及打赏入口、将本地desc预览改ai摘要样式、增加版权卡片及更换头部信息样式。
date: 2025-12-09 10:00:00
updated: 2025-12-09 20:49:00
image: /image/PostCover/postMeihua.avif
categories: [站点魔改]
tags: [Nuxt, 魔改, 美化]
recommend: 6
---
## 功能增加与删减
### V20251209-OFFICIAL
新增内容
- 增加打赏弹窗，可通过后期更换掉配置文件，内置移动到赞赏总览时触发效果
- 优化头部文章信息封面在移动端浏览时无法正常预览全部
- 增加版权图标虚化功能，增加打赏弹窗入口

### V20251201-OFFICIAL
新增内容
- 将本地`desc`的预览样式更换为ai摘要样式（核心功能未改变）
- 增加版权卡片，使用`v-if`进行部分展示
- 将头部文章信息进行样式更换

## 目录结构
- `/app/components/post/PostHeader.vue`：文章顶部信息卡片。
- `/app/components/post/PostFooter.vue`：文章底部信息卡片，包含调用`打赏弹窗`的方式、复刻`Butterfly主题`的`版权模块`
- `/app/components/popover/reward.vue`：打赏弹窗的处理、调用方式、主界面、开关逻辑，使用了`MyDialog.vue`的处理逻辑，内置了`rewardCard.vue`的模块显示
- `/app/components/card/rewardCard.vue`：打赏弹窗的卡片显示，使用了`张洪Heo`的样式。

## 教程开始
### 主要渲染的模块
::alert{type="warning" card}
#title
**注意**
#default
该文章在主题的3.4.9版本中可正常使用，若要进行适配可以按照该文章进行适配
::

::tab{:tabs='["PostHeader.vue", "PostFooter.vue", "reward.vue", "rewardCard.vue"]'}
#tab1
``` vue [PostHeader.vue] lang="vue"
<script setup lang="ts">
import type ArticleProps from '~/types/article'
import { sort } from 'radash'

defineOptions({ inheritAttrs: false })
const props = defineProps<ArticleProps>()

const appConfig = useAppConfig()

const categoryLabel = computed(() => props.categories?.[0])
const categoryIcon = computed(() => getCategoryIcon(categoryLabel.value))

const shareText = `【${appConfig.title}】${props.title}\n\n${
	props.description ? `${props.description}\n\n` : ''}${
	new URL(props.path!, appConfig.url).href}`

const { copy, copied } = useCopy(shareText)
</script>

<template>
<!-- 💩夸克浏览器，桌面端只有IE不支持 :has() 了 -->
<div class="post-header" :class="{ 'has-cover': image, 'text-revert': meta?.coverRevert }">
	<!-- <NuxtImg v-if="image" class="post-cover" :src="image" :alt="title" />
	<div class="post-nav">
		<div class="operations">
			<ZButton
				:icon="copied ? 'ph:check-bold' : 'ph:share-bold' "
				@click="copy()"
			>
				文字分享
			</ZButton>
		</div>

		<div v-if="!meta?.hideInfo" class="post-info">
			<time
				v-if="date"
				v-tip="`创建于 ${getLocaleDatetime(props.date)}`"
				:datetime="getIsoDatetime(date)"
			>
				<Icon name="ph:calendar-dots-bold" />
				{{ getPostDate(props.date) }}
			</time>

			<time
				v-if="isTimeDiffSignificant(date, updated, .999)"
				v-tip="`修改于 ${getLocaleDatetime(props.updated)}`"
				:datetime="getIsoDatetime(updated)"
			>
				<Icon name="ph:calendar-plus-bold" />
				{{ getPostDate(props.updated) }}
			</time>

			<span v-if="categoryLabel">
				<Icon :name="categoryIcon" />
				{{ categoryLabel }}
			</span>

			<span>
				<Icon name="ph:paragraph-bold" />
				{{ formatNumber(readingTime?.words) }} 字
			</span>
		</div>
	</div>

	<h1 class="post-title" :class="getPostTypeClassName(type)">
		{{ title }}
	</h1> -->
	<div class="cover-wrapper">
		<NuxtImg v-if="image" class="post-cover" :src="image" :alt="title"/>
	</div>
	<div class="cover-nav">
		<div class="post-info">
			<span class="date">
				<Icon name="ph:calendar-dots-bold" />
				<time :datetime="getIsoDatetime(date)">
					{{ getPostDate(props.date) }}
				</time>
			</span>
			<span class="categroy" v-if="categoryLabel">
				<Icon :name="categoryIcon" />
				{{ categoryLabel }}
			</span>
			<span class="wordsCount">
				<Icon name="ph:paragraph-bold" />
				{{ formatNumber(readingTime?.words) }} 字
			</span>
			<span class="update">
				<Icon name="ph:calendar-plus-bold" />
				<time time :datetime="getIsoDatetime(updated)" >
					{{ getPostDate(props.updated) }}
				</time>
			</span>
			<span class="tagItem">
				<Icon name="ph:tag-bold" />
				<span class="tag" v-for="([key, value]) in Object.entries(tags ?? {})" :key="key">
					{{ value }}
				</span>
			</span>
		</div>
		<div class="post-title" :class="getPostTypeClassName(type)">
			{{ title }}
		</div>
	</div>
</div>
</template>

<style lang="scss" scoped>
.post-header.has-cover {
	background-color: var(--c-bg-2);
  background-color: transparent;
  border-radius: 1rem 1rem 0 0;
  flex-direction: column;
  gap: 0;
  margin: .5rem;
	.cover-wrapper {
    border-radius: 1rem 1rem 0 0;
    height: 360px;
    overflow: hidden;
    overflow: clip;
    position: relative;
		@media (max-width: 768px) {
			height: auto;
		}
		.post-cover {
			height: 100%;
			-o-object-fit: cover;
			object-fit: cover;
			width: 100%;
		}
	}
	.cover-nav {
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    background: transparent;
    border-radius: 0;
    display: flex;
    flex-direction: column;
    gap: .3rem;
    padding: 1.6rem 1.2rem;
		.post-info {
			align-items: center;
			color: var(--c-text-soft);
			display: flex;
			flex-wrap: wrap;
			gap: .6em 1.2em;
			-moz-column-gap: clamp(1em, 3%, 1.5em);
			column-gap: clamp(1em, 3%, 1.5em);
			font-size: .85rem;
			line-height: 1.5;
			margin: 0;
			order: -1;
			padding: 0;
			span {
				align-items: center;
				display: flex;
				gap: .3em;
			}
			.tagItem {
				align-items: center;
				display: flex;
				flex-wrap: wrap;
				gap: .3em .6em;
				.tag {
					background-color: var(--c-bg-soft);
					border-radius: .4em;
					color: var(--c-text-soft);
					font-size: .9em;
					padding: .25em .6em;
					transition: all .2s;
					&:hover {
						background-color: var(--c-primary-soft);
						color: var(--c-primary);
					}
				}
			}
		}
		.post-title {
			-webkit-backdrop-filter: none;
			backdrop-filter: none;
			background: none;
			border: none;
			box-shadow: none;
			color: var(--c-text);
			font-size: 1.6rem;
			font-weight: 600;
			line-height: 1.4;
			margin: 0;
			padding: 0;
		}
	}
}

.post-header {
  border-radius: 1rem;
  color: var(--c-text);
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin: .5rem;
	.cover-wrapper {
    overflow: hidden;
    overflow: clip;
    position: relative;
	}
	.cover-nav {
    display: flex;
    flex-direction: column;
    gap: .3rem;
    opacity: .9;
    padding: 1.6rem 1.2rem;
    position: relative;
		.post-info {
			align-items: center;
			color: var(--c-text-soft);
			display: flex;
			flex-wrap: wrap;
			gap: .6em 1.2em;
			-moz-column-gap: clamp(1em, 3%, 1.5em);
			column-gap: clamp(1em, 3%, 1.5em);
			font-size: .85rem;
			line-height: 1.5;
			margin: 0;
			order: -1;
			padding: 0;
		}
	}
}
</style>

<!-- 隐藏起来的样式 -->
<!-- <style lang="scss" scoped>
.post-header {
	display: flex;
	flex-direction: column;
	justify-content: space-between;
	gap: 1rem;
	margin: 0.5rem;
	border-radius: 1rem;
	background-color: var(--c-bg-2);
	color: var(--c-text);

	@media (max-width: $breakpoint-mobile) {
		margin: 0;
		border-radius: 0;
	}

	&:hover .operations {
		opacity: 1;
	}

	&.has-cover {
		aspect-ratio: 16 / 9;
    color: #fff;
    min-height: 200px;
    overflow: hidden;
    overflow: clip;
    position: relative;
    transition: font-size .2s;

		&:hover {
			font-size: 0.8em;
		}

		.post-info {
			filter: drop-shadow(0 1px 2px #000);
		}

		.post-title {
			background-image: linear-gradient(transparent, #0003, #0005);
			text-shadow: 0 1px 1px #0003, 0 1px 2px #0003;

			&.text-story {
				text-align: center;
			}
		}

		&.text-revert {
			text-shadow: 0 0 2px #FFF, 0 1px 0.5em #FFF;
			color: #333;

			.post-title {
				background-image: linear-gradient(transparent, #FFF3, #FFF5);
			}
		}
	}
}

.operations {
	position: absolute;
	opacity: 0;
	inset-inline-end: 1em;
	color: var(--c-text-1);
	transition: opacity 0.2s;
	z-index: 1;
}

.post-cover {
	position: absolute;
	inset: 0;
	width: 100%;
	height: 100%;
	object-fit: cover;
}

.post-title {
	padding: 0.8em 1rem;
	font-size: 1.6em;
	line-height: 1.2;
	z-index: 1;
}

.post-nav {
	position: relative;
	opacity: 0.9;
	padding: 0.8em 1rem;

	// 如果在父级设置字体尺寸，会影响祖先字体尺寸改变的行为
	// 并且设置相对尺寸会导致过渡
	>* {
		font-size: 0.8rem;
	}

	.post-info {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5em 1.2em;
		column-gap: clamp(1em, 3%, 1.5em);
	}
}
</style> -->
```

#tab2
``` vue [PostFooter.vue] lang="vue"
<script setup lang="ts">
import { PostFooter } from '#components';
import type ArticleProps from '~/types/article'
const { data: stats } = useFetch('/api/stats')

const ReWardStore = useReWardStore()

defineOptions({ inheritAttrs: false })
const props = defineProps<ArticleProps>()

const appConfig = useAppConfig()

const item = {
	作者: appConfig.author.name,
	发布时间: getLocalePostDatetime(props.date),
	更新时间: getLocalePostDatetime(props.updated),
	许可协议: "CC BY-NC-SA 4.0",
}

import { sort } from 'radash'

const { data: listRaw } = await useAsyncData<ArticleProps[]>('index_posts', () => useArticleIndex().then(data => data.data.value))

const articlesByTag = computed(() => {
	const result: Record<string, any[]> = {}
	const articles = sort(listRaw.value || [], a => new Date(a.date || 0).getTime(), true)
	for (const article of articles) {
		if (article.tags) {
			for (const tag of article.tags) {
				if (!result[tag]) {
					result[tag] = []
				}
				result[tag].push(article)
			}
		}
	}
	return result
})

const sortedTags = computed(() => {
	return Object.keys(articlesByTag.value).sort((a, b) => {
		const aCount = articlesByTag.value[a]?.length || 0
		const bCount = articlesByTag.value[b]?.length || 0
		return bCount - aCount
	})
})
</script>

<template>
<div class="post-footer">
	<!-- <section v-if="references" class="reference">
		<div id="references" class="title text-creative">
			参考链接
		</div>

		<div class="content">
			<ul>
				<li v-for="{ title, link }, i in references" :key="i">
					<ProseA :href="link || ''">
						{{ title ?? link }}
					</ProseA>
				</li>
			</ul>
		</div>
	</section>

	<section class="license">
		<div class="title text-creative">
			许可协议
		</div>

		<div class="content">
			<p>
				本文采用 <ProseA :href="appConfig.copyright.url">
					{{ appConfig.copyright.name }}
				</ProseA>
				许可协议，转载请注明出处。
			</p>
		</div>
	</section> -->
	<section class="authorCard">
		<div class="header">
			<span class="authorInfo">
				<h3 class="title">{{ title }}</h3>
				<ZRawLink :to="appConfig.url + path" class="url">
					{{ appConfig.url }}{{ path }}
				</ZRawLink>
			</span>
			<span class="authorIcon">
				<icon name="ph:copyright-bold" />
			</span>
		</div>
		<div class="meta">
      <div class="card-specs">
        <div class="spec-item" v-for="([key, value]) in Object.entries(item ?? {})" :key="key">
          <h3 class="spec-label">
            {{ key }}
          </h3>
          <h3 class="spec-value" v-if="key === '作者' || key === '发布时间' || key === '更新时间'">
            {{ value }}
          </h3>
					<ZRawLink class="spec-value" to="https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hans" v-if="key === '许可协议'">
						{{ value }}
					</ZRawLink>
        </div>
      </div>
		</div>
	</section>
	<section class="post-bottom">
		<div class="left">
			<div class="tagsItem">
				<ZRawLink class="tags" v-for="([key, value]) in Object.entries(tags ?? {})" :key="key" :to="'/?tags=' + value">
					{{ value }}
					<span class="tagNumber">{{ articlesByTag[value]?.length }}</span>
				</ZRawLink>
			</div>	
		</div>
		<div class="right">
			<div class="post-reward">
				<ZButton class="reward-button" @click="ReWardStore.open()">
					打赏
				</ZButton>
			</div>
		</div>
	</section>
</div>
</template>

<style lang="scss" scoped>
.post-footer {
	margin: 2rem 0.5rem;
	border: 1px solid var(--c-border);
	border-radius: 1rem;
	background-color: var(--c-bg-2);
}

section {
	padding: 1rem;

	& + section {
		border-top: 1px solid var(--c-border);
	}
}

.authorCard {
  display: flex;
  flex-direction: column;
  position: relative;
	padding: 1.5rem;
	overflow: hidden;

	.header {
    align-items: flex-start;
    display: flex;
    justify-content: space-between;
    margin-bottom: 1rem;
		.authorInfo {
			flex: 1;
			.title {
				font-size: 1.1rem;
				line-height: 1.4;
				margin: 0 0 .5rem;
			}
			.url {
				color: var(--c-text-soft);
				font-size: .85rem;
				margin: 0;
				word-break: break-all;
			}
		}
		.authorIcon {
			position: absolute;
			filter: blur(5px);
			right: -26px;
			font-size: 200px;
			opacity: .2;
			z-index: 2;
			-webkit-transition: all .3s ease-in-out;
			-moz-transition: all .3s ease-in-out;
			-o-transition: all .3s ease-in-out;
			-ms-transition: all .3s ease-in-out;
			transition: all .3s ease-in-out;
			top: -25%;
			&:hover {
				filter: none;
			}
		}
	}
	.meta {
		flex: 1;
    margin-bottom: 1rem;

		.card-specs {
			background: transparent;
			border-radius: 0;
			display: grid;
			font-size: .8rem;
			gap: .8rem;
			grid-template-columns: repeat(5, 1fr);
			padding: 0;
			@media (max-width: 768px) {
				grid-template-columns: repeat(3, 1fr);
			}

			.spec-item {
				display: flex;
				flex-direction: column;
				gap: .1rem;
				.spec-label {
					color: var(--c-text-2);
					// font-size: .7rem;
					font-weight: 500;
				}
				.spec-value {
					color: var(--c-text);
					// font-size: .8rem;
					word-break: break-word;
					font-size: .9rem;
    			font-weight: 500;
				}
			}
		}
	}
}

.post-bottom {
	width: 100%;
  display: flex;
  justify-content: space-between;
  flex-direction: row;

	.left {
    white-space: nowrap;
    display: flex;
    text-overflow: ellipsis;
    flex-wrap: wrap;

		.tagsItem {
			display: flex;
			padding: 0;
			width: 100%;
			flex-wrap: wrap;
			flex-direction: row;
			gap: 8px;

			.tags {
				background: var(--heo-card-bg);
				border: var(--style-border-always);
				color: var(--heo-fontcolor);
				border-radius: 8px;
				margin: 0;
				display: flex;
				align-items: center;
				white-space: nowrap;
				height: 32px;
				padding: 0 .6rem;
				width: fit-content;
				font-size: .85em;
				transition: all .2s ease-in-out 0s;

				.tagNumber {
					padding: 2px;
					background: var(--heo-fontcolor);
					min-width: 22.5px;
					display: inline-block;
					border-radius: 4px;
					text-align: center;
					font-size: 0.7rem;
					color: var(--heo-card-bg);
					margin-left: 4px;
					line-height: 1;
					transition: .2s;
				}
			}
		}
	}
}

// .title {
// 	font-weight: bold;
// 	color: var(--c-text);
// }

// .content {
// 	margin-top: 0.5em;
// 	font-size: 0.9rem;

// 	li {
// 		margin: 0.5em 0;
// 	}
// }
</style>
```

#tab3
``` vue [reward.vue] lang="vue"
<script setup lang="ts">
const props = defineProps<{
  show?: boolean
  duration?: number
  onClose?: () => void
}>()
const emit = defineEmits<{
  close: []
}>()
function handleClose() {
  props.onClose?.() || emit('close')
}
</script>

<template>
  <Transition name="float-in">
    <div v-if="show" class="popover-mask" @click="handleClose" />
  </Transition>

  <Transition name="float-in">
    <div v-if="show" class="popover-panel">
      <div class="panel-header">
        <h2>
          打赏中心
        </h2>
        <button class="close-btn" aria-label="关闭" @click="handleClose">
          <Icon name="ph:x-bold" />
        </button>
      </div>

      <div class="panel-content">
        <ul class="rewardMain">
          <LazyCardRewardCard />
        </ul>
      </div>
    </div>
  </Transition>
</template>

<style lang="scss" scoped>
.popover-mask {
  position: fixed;
  inset: 0;
  background-color: #0003;
  backdrop-filter: blur(0.2em);
  transition: opacity var(--delay, 200);
  z-index: 100;
  &.v-enter-from,
  &.v-leave-to {
    opacity: 0;
  }
}
.popover-panel {
  --float-distance: 20vh;
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 95%;
  max-height: 85vh;
  max-height: 85dvh;
  max-width: 500px;
  border: 1px solid var(--c-primary);
  border-radius: 1em;
  box-shadow: 0 0.25em 0.5em var(--ld-shadow);
  background-color: var(--ld-bg-card);
  padding: 1.2em;
  overflow-y: auto;
  transition: all var(--delay, 200);
  z-index: 1000;
  .panel-header {
    margin-bottom: 1em;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    h2 {
      margin: 0;
      font-size: 1.2em;
      font-weight: 600;
      color: var(--c-text);
    }
    .close-btn {
      padding: 0.4em;
      border: none;
      border-radius: 0.5em;
      background-color: transparent;
      color: var(--c-text-2);
      cursor: pointer;
      transition: all 0.1s;
      &:hover {
        background-color: var(--c-bg-soft);
        color: var(--c-text-1);
      }
    }
  }
  .panel-content {
    font-size: 0.95em;
    color: var(--c-text-1);
    line-height: 1.6;
    .rewardMain {
      border-radius: 12px;
      background-color: var(--ld-bg-card);
      border: var(--style-border-always);
      padding: .8rem;
      display: flex;
      box-shadow: var(--heo-shadow-border);
      flex-direction: column;
      align-items: center;
    }
  }
}
.float-in-enter-active,
.float-in-leave-active {
  transition: all var(--delay, 200);
}
.float-in-enter-from,
.float-in-leave-to {
  opacity: 0;
  transform: translate(-50%, calc(-50% - 20vh));
}
@media (max-width: 768px) {
  .popover-panel {
    width: 95vw;
    max-height: 75vh;
    max-height: 75dvh;
  }
}
</style>
```

#tab4
``` vue [rewardCard.vue] lang="vue"
<script lang="ts" setup>
const rewardInfo = ref({
	titleInfo: "感谢你赐予我前进的力量",
  shoukuan: {
    微信: "https://oss.hlcode.cn/server/2025/12/09/8va1765275351031.png",
    支付宝: "https://oss.hlcode.cn/server/2025/12/09/8va1765275351031.png",
  },
  link: "/"
})
</script>

<template>
  <span class="reward-title">
    {{ rewardInfo.titleInfo }}
  </span>
  <ul class="reward-group">
    <li class="reward-item" v-for="([key, value]) in Object.entries(rewardInfo.shoukuan ?? {})" :key="key">
      <ZRawLink :to="value" target="_blank" class="reward-image-url">
        <NuxtImg :src="value" class="reward-image"></NuxtImg>
      </ZRawLink>
      <div class="reward-desc">
        {{ key }}
      </div>
    </li>
  </ul>
  <ZRawLink :to="rewardInfo.link" target="_blank" class="reward-all-info">
    <div class="reward-all-info-text">赞赏者名单</div>
    <div class="reward-all-info-desc">因为你们的支持让我意识到写文章的价值🙏</div>
  </ZRawLink>
</template>

<style lang="scss">
.reward-title {
  font-weight: 700;
  color: var(--heo-red);
}
.reward-group {
  display: flex;
  margin-top: .5rem;
  .reward-item {
    display: inline-block;
    padding: 0 8px;
    list-style-type: none;
    vertical-align: top;
    :first-child {
      .reward-image-url {
        .reward-image {
          border-color: var(--heo-green);
          --heo-green: #3e9f50;
          box-shadow: var(--heo-shadow-lightblack);
          border-radius: 12px;
          border: var(--style-border-always);
        }
      }
    }
    :first-child {
      .reward-image-url {
        .reward-image {
          border-color: var(--heo-blue);
          --heo-blue: #425AEF;
          box-shadow: var(--heo-shadow-lightblack);
          border-radius: 12px;
          border: var(--style-border-always);
        }
      }
    }

    .reward-image-url {
      background-color: transparent;
      color: var(--heo-fontcolor);
      text-decoration: none;
      transition: all .3s ease-out 0s;
      overflow-wrap: break-word;
      -webkit-user-drag: none;
      .reward-image {
        width: 130px;
        height: 130px;
        border-radius: 8px;
      }
    }
    .reward-desc {
      padding-top: 0;
      margin-top: -8px;
      width: 130px;
      color: #858585;
      flex-direction: column;
      display: flex;
      align-items: center;
    }
  }
}

.reward-all-info {
  background: var(--heo-secondbg);
  color: var(--heo-fontcolor);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  padding: 10px 30px;
  border: var(--style-border-always);
  margin: 8px;
  width: calc(100% - 16px);
  &:hover {
    color: var(--heo-white);
    background: var(--heo-red);
    background-image: url(https://myxzblog.cn-nb1.rains3.com/JgNrST23690481619450556342.avif);
    box-shadow: var(--heo-shadow-red);
    border-color: var(--heo-red);
  }
  .reward-all-info-text {
    margin-bottom: 0;
    font-weight: 700;
    align-items: center;
    flex-direction: column;
    display: flex;
    font-size: 1rem;
  }
  .reward-all-info-desc {
    font-size: 0.78rem;
    align-items: center;
    flex-direction: column;
    display: flex;
  }
}
</style>
```
::