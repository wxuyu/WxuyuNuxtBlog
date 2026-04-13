<script setup lang="ts">
import HotPageCardItem from '~/components/yjluo/hot/hotPageMain.vue';

const hotTab = ['哔哩哔哩', '微博', '抖音', '知乎', '36氪', '百度']
const layoutStore = useLayoutStore()
// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div class="HotPageMain">
    <tab :tabs="hotTab">
      <template v-slot:tab1>
        <HotPageCardItem -cache='true' -name-type='哔哩哔哩' -mini-name-type='bilibili' -categrory-type='热搜' />
      </template>
      <template v-slot:tab2>
        <HotPageCardItem -cache='true' -name-type='微博' -mini-name-type='weibo' -categrory-type='热搜' />
      </template>
      <template v-slot:tab3>
        <HotPageCardItem -cache='true' -name-type='抖音' -mini-name-type='douyin' -categrory-type='热搜' />
      </template>
      <template v-slot:tab4>
        <HotPageCardItem -cache='true' -name-type='知乎' -mini-name-type='zhihu' -categrory-type='热搜' />
      </template>
      <template v-slot:tab5>
        <HotPageCardItem -cache='true' -name-type='36氪' -mini-name-type='36kr' -categrory-type='热搜' />
      </template>
      <template v-slot:tab6>
        <HotPageCardItem -cache='true' -name-type='百度' -mini-name-type='baidu' -categrory-type='热搜' />
      </template>
    </tab>    
  </div>
</template>

<style lang="scss" scoped>
.HotPageMain {
  padding: 1rem;
}
</style>