<script setup lang="ts">

const props = defineProps<{
	/** story 下标从 1 开始 */
	故事?: string[]
	居中?: boolean
	密钥?: string | number
  标题?: string
}>()

// 使用 v-bind:active 以传递 Number 值
const activeStory = ref(Number(props.密钥) || 1)
</script>

<template>
<div :class="{ 居中 }" class="heroStoryMain WuWuGameColor">
  <showcase-section-title :title="`${props.标题}`" style="margin-bottom: 10px;"/>
	<div class="storys">
		<button
			v-for="(story, storyIndex) in 故事"
			:key="storyIndex"
			:class="{ active: activeStory === storyIndex + 1 }"
			@click="activeStory = storyIndex + 1"
		>
			{{ story }}
		</button>
	</div>
	<div v-for="storyIndex in props?.故事?.length" v-show="activeStory === storyIndex" :key="storyIndex" class="story-content">
		<slot :name="`story${storyIndex}`" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.float-in-leave-active {
	/* stylelint-disable-next-line declaration-no-important */
	position: revert !important;
}

.heroStoryMain {
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  /* display: flex; */
  padding: 1rem;
}

.center {
	width: fit-content;
	max-width: 100%;
	margin-inline: auto;
}

.storys {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5em;
	position: relative;
	width: fit-content;
	margin: 0 auto;
	font-size: 0.9em;
	line-height: 1.4;
}

button {
	position: relative;
	margin-bottom: 0.5em;
	padding: 0.3em 0.5em;
	border-radius: 0.4em;
	color: var(--c-text-2);
	transition: all 0.2s;

	&:hover {
		background-color: var(--c-bg-soft);
		color: var(--c-text);
	}

	&::before, &::after {
		display: block;
		position: absolute;
		bottom: -0.5em;
		inset-inline: 0.8em;
		height: 2px;
		border-radius: 1em;
		pointer-events: none;
	}

	&::after {
		content: "";
		inset-inline: -0.8em;
		background-color: var(--c-border);
	}

	&.active {
		box-shadow: 0 1px 0.5em var(--ld-shadow);
		background-color: var(--ld-bg-card);
		color: var(--c-text);

		&::before {
			content: "";
			background-color: var(--c-primary);
			z-index: 1;
		}
	}
}

.story-content {
	margin: 1em 0;
}
</style>