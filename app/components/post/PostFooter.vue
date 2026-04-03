<script setup lang="ts">
import type { ArticleProps } from '~/types/article'
import { sort } from 'radash'
import Reward from '../popover/reward.vue';

defineOptions({ inheritAttrs: false })
const props = defineProps<ArticleProps>()
const appConfig = useAppConfig()

const title = computed(() => props.title || '')
const path = computed(() => props.path || '')
const date = computed(() => props.date)
const updated = computed(() => props.updated)
const references = computed(() => props.references)
const meta = computed(() => props.meta)
const { data: listRaw } = await useAsyncData('index_posts', () => useArticleIndexOptions(), { default: () => [] })

function formatDate(dateStr?: string): string {
	if (!dateStr)
		return ''
	try {
		const d = new Date(dateStr)
		if (Number.isNaN(d.getTime()))
			return ''
		return d.toLocaleDateString('zh-CN', {
			year: 'numeric',
			month: 'long',
			day: 'numeric',
		})
	}
	catch (e) {
		console.error(`Invalid date: ${dateStr}`, e)
		return ''
	}
}

const formattedDate = computed(() => formatDate(date.value))
const formattedUpdatedDate = computed(() => formatDate(updated.value))
const fullUrl = computed(() => {
	if (!path.value)
		return ''
	try {
		return new URL(path.value, appConfig.url).href
	}
	catch {
		return ''
	}
})

// 新增Tag显示
const articlesByTag = computed(() => {
	const result: Record<string, any[]> = {}
	const articles = sort(listRaw.value, a => new Date(a.date || 0).getTime(), true)
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

const RewardStore = useRewardStore()
</script>

<template>
<div v-if="!meta?.hideInfo" class="post-footer">
	<section class="author-card">
		<div class="copyright-badge">
			<Icon name="ph:copyright-bold" />
		</div>

		<div class="card-left">
			<div class="card-header">
				<div class="author-info">
					<h3 class="title">
						{{ title }}
					</h3>
					<div v-if="path" class="url-wrapper">
						<p class="url">
							{{ fullUrl }}
						</p>
					</div>
				</div>
			</div>

			<div class="card-meta">
				<div class="meta-column">
					<div class="meta-item">
						<span class="label">文章作者</span>
						<span class="value">{{ appConfig.author.name }}</span>
					</div>
					<div v-if="date" class="meta-item">
						<span class="label">发布时间</span>
						<span class="value">{{ formattedDate }}</span>
					</div>
					<div v-if="updated && updated !== date" class="meta-item">
						<span class="label">更新时间</span>
						<span class="value">{{ formattedUpdatedDate }}</span>
					</div>
					<div class="meta-item">
						<span class="label">版权信息</span>
						<a :href="appConfig.copyright.url" class="value copyright-link">
							{{ appConfig.copyright.name }}
						</a>
					</div>
				</div>
			</div>
		</div>

		<section v-if="references" class="reference">
			<div id="references" class="title text-creative">
				参考链接
			</div>
			<div class="content">
				<ul>
					<li v-for="({ title: rt, link }, i) in references" :key="i">
						<ProseA :href="link || ''">
							{{ rt ?? link }}
						</ProseA>
					</li>
				</ul>
			</div>
		</section>
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
				<ZButton class="reward-button" @click="RewardStore().open()" style="font-size: 0.85em;">
					<Icon name="proicons:sparkle-2" />
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
	padding: 1.2rem;

	& + section {
		border-top: 1px solid var(--c-border);
	}
}

.title {
	font-weight: bold;
	color: var(--c-text);
}

.content {
	margin-top: 0.5em;
	font-size: 0.9rem;

	li {
		margin: 0.5em 0;
	}
}

.author-card {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	position: relative;
	padding: 1.5rem !important;
}

.copyright-badge {
	position: absolute;
	top: 1.5rem;
	right: 1.5rem;
	font-size: 2rem;
	color: var(--c-border);
	opacity: 0.5;
}

.card-left {
	display: flex;
	flex-direction: column;
	gap: 1rem;
}

.card-header {
	display: flex;
	align-items: flex-start;
}

.author-info .title {
	margin: 0 0 0.5rem;
	font-size: 1.1rem;
	line-height: 1.4;
}

.url-wrapper { display: flex; align-items: center; gap: -0.05rem; }

.url {
	flex: 1;
	min-width: 0;
	margin: 0;
	font-size: 0.85rem;
	word-break: break-all;
	color: var(--c-text-soft);
}

.card-meta {
	flex: 1;
  margin-bottom: 1rem;
  .meta-column {
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
    .meta-item {
      display: flex;
			flex-direction: column;
			gap: .1rem;
      .label {
				color: var(--c-text-2);
				// font-size: .7rem;
				font-weight: 500;
      }
      .value {
				color: var(--c-text);
				// font-size: .8rem;
				word-break: break-word;
				font-size: .9rem;
    		font-weight: 500;
      }
    }
  }
}

.card-signature-text {
	position: absolute;
	right: 1.5rem;
	bottom: 1.5rem;
	font-family: 'Ephesis', var(--font-creative), sans-serif;
	font-size: 2rem;
	font-weight: 700;
	color: var(--c-text);
	opacity: 0.95;
	text-shadow: 0 0 4px rgba(255, 255, 255, 0.25);
	z-index: 2;
	padding: 0.25rem 0.4rem;
	background-color: transparent;
	border-radius: 0.35rem;
}

@media (max-width: 768px) {
	.card-signature-text {
		position: relative;
		right: auto;
		bottom: auto;
		align-self: flex-end;
		margin-top: 0.7rem;
		text-align: right;
		background-color: transparent;
	}
}

@media (prefers-color-scheme: dark) {
	.card-signature-text {
		background-color: transparent;
		text-shadow: 0 0 3px rgba(0, 0, 0, 0.35);
	}
}

.dark .card-signature-text {
	background-color: transparent;
	text-shadow: 0 0 3px rgba(0, 0, 0, 0.35);
}

.reference .content ul { margin: 0; padding: 0; list-style: none; }
.reference .content li { margin: 0.6rem 0; }

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
</style>
