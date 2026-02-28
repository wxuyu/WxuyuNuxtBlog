<script setup lang="ts">
import { LazyPopoverLightbox } from '#components'
import ArtalkManager from '~/utils/artalk-manager'
import Artalk from 'artalk'
const appConfig = useAppConfig()

import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import 'artalk/Artalk.css'

const el = ref<HTMLElement>()
const route = useRoute()
const colorMode = useColorMode()

let artalk: Artalk

onMounted(() => {
  artalk = Artalk.init({
    el: '#artalk',
    pageKey: route.path,
    pageTitle: document.title.replace(` | ${appConfig.title}`, ''),
    server: appConfig.artalk?.server,
    site: appConfig.artalk?.sitename,
    emoticons: appConfig.artalk.owo_src, // 使用配置的表情包
    darkMode: colorMode.value === 'dark',
  })
})

watch(
  () => route.path,
  (path) => {
    nextTick(() => {
      artalk.update({
        pageKey: path,
        pageTitle: document.title,
      })
      artalk.reload()
    })
  }
)

onBeforeUnmount(() => {
  artalk.destroy()
})
</script>

<template>
  <section class="z-comment">
    <h3 class="text-creative">
      <div class="comment-tip">评论</div>
    </h3>
    <div class="commentCard">
      <div id="artalk">
        <p class="loading-box">
          <Icon name="line-md:loading-twotone-loop" class="loading-img" />评论加载中...
        </p>
      </div>
    </div>
  </section>
</template>

<style lang="scss" scoped>
/* 原有样式保持不变 */

/* 新增错误提示样式 */
.artalk-error {
  text-align: center;
  padding: 2rem;
  color: #ff5252;
  
  button {
    margin-top: 1rem;
    padding: 0.5rem 1.5rem;
    background: var(--c-primary);
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    transition: background 0.3s;
    
    &:hover {
      background: var(--c-primary-dark);
    }
  }
}
</style>