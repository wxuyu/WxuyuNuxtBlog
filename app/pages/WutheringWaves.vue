<script setup lang="ts">
const { data: listRaw } = await useAsyncData('index_previews', () => useArticleIndexOptions('mingchao/%'), { default: () => [] })
const { listSorted, isAscending, sortOrder } = useArticleSort(listRaw)
const { category, categories, listCategorized } = useCategory(listSorted)
</script>
<template>
<BlogHeader class="mobile-only" to="/" tag="h1" />
<UtilHydrateSafe>
  <div class="post-list">
		<TransitionGroup tag="menu" class="proper-height" name="float-in">
      <PostArticleMc
        v-for="article in listCategorized"
        :key="article.path"
        v-bind="article"
        :to="article.path"
        :use-updated="sortOrder === 'updated'"
      />
		</TransitionGroup>
  </div>
</UtilHydrateSafe>
</template>