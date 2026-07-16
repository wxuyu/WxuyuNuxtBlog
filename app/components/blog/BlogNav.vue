<script setup lang="ts">
import { watch } from 'vue'
import { useRoute } from 'vue-router'

// TODO: 暂时移除 SidebarDecorImage，保留实现以备恢复
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()
const searchStore = useSearchStore()

// Sidebar 底部装饰图由 SidebarDecorImage 组件实现

const { text } = useTextSelection()
const debouncedSelection = refDebounced(text)

const route = useRoute()
const openMenuKeys = ref<Record<string, boolean>>({})

const itemKey = (groupIndex: number, itemIndex: number) => `g${groupIndex}-i${itemIndex}`

const hasSubItems = (item: any) => Boolean(item.children && item.children.length)

function isActive(item: any): boolean {
	if (item.url && item.url !== '#' && !isExtLink(item.url) && route.path === item.url)
		return true

	if (item.children?.length)
		return item.children.some(isActive)

	return false
}

const isOpen = (key: string) => Boolean(openMenuKeys.value[key])

function toggleSubMenu(key: string) {
	openMenuKeys.value[key] = !openMenuKeys.value[key]
}

function openActiveMenus() {
	appConfig.nav.forEach((group, groupIndex) => {
		group.items.forEach((item, itemIndex) => {
			if (hasSubItems(item) && isActive(item))
				openMenuKeys.value[itemKey(groupIndex, itemIndex)] = true
		})
	})
}

watch(() => route.path, openActiveMenus, { immediate: true })
</script>

<template>

</template>

<style lang="scss" scoped>

</style>