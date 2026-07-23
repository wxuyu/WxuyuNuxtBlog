<script setup lang="ts">
import { Temporal } from 'temporal-polyfill'

const props = withDefaults(defineProps<{
	icon?: string
	date?: string | Temporal.ZonedDateTime
	format?: dateTimeFormatOptions
	absolute?: boolean
	relative?: boolean
	nospace?: boolean
	tipFormat?: dateTimeFormatOptions
	tipTransform?: (formattedDate: string) => string
}>(), {
	tipTransform: String,
})

const today = Temporal.Now.plainDateISO()
const zdt = computed(() => {
	try {
		return typeof props.date === 'string' ? toZonedTemporal(props.date) : props.date
	}
	catch {
		return null
	}
})

const shouldRelative = computed(() => props.absolute || !zdt.value
	? false
	: props.relative || today.since(zdt.value, { largestUnit: 'week' }).weeks < 1,
)

const mounted = useMounted()
const tooltip = computed(() => mounted.value && zdt.value
	? props.tipTransform(toZdtLocaleString(zdt.value, props.tipFormat))
	: props.date as string,
)

/** Relative time label — client-only to avoid NuxtTime prehydrate mismatch */
const now = useNow({ interval: 60_000 })
const relativeText = computed(() => {
	if (!zdt.value) return ''
	const diff = now.value.getTime() - zdt.value.epochMilliseconds
	const absMs = Math.abs(diff)
	const seconds = Math.floor(absMs / 1000)
	const minutes = Math.floor(seconds / 60)
	const hours = Math.floor(minutes / 60)
	const days = Math.floor(hours / 24)
	const weeks = Math.floor(days / 7)
	const months = Math.floor(days / 30)
	const years = Math.floor(days / 365)
	const prefix = diff < 0 ? '' : ''
	const suffix = diff < 0 ? '后' : '前'
	if (years >= 1) return `${years} 年`
	if (months >= 1) return `${months} 个月`
	if (weeks >= 1) return `${weeks} 周`
	if (days >= 1) return `${days} 天`
	if (hours >= 1) return `${hours} 小时`
	if (minutes >= 1) return `${minutes} 分钟`
	return '刚刚'
})

const fallbackText = computed(() => {
	if (!zdt.value) return 'Invalid Date'
	return toZdtLocaleString(zdt.value, {
		year: zdt.value.year === today.year ? undefined : '2-digit',
		month: 'long',
		day: 'numeric',
	})
})
</script>

<template>
<span :title="tooltip">
	<Icon v-if="icon" :name="icon" />
	<template v-if="icon && !nospace">&nbsp;</template>

	<span v-if="!zdt">Invalid Date</span>

	<time
		v-else-if="format"
		:datetime="toInstantString(zdt)"
		v-text="toZdtLocaleString(zdt, format)"
	/>

	<!-- Replaces <NuxtTime relative> to avoid prehydrate hydration mismatch -->
	<time
		v-else
		:datetime="toInstantString(zdt)"
	>
		{{ mounted && shouldRelative ? relativeText : fallbackText }}
	</time>
</span>
</template>
