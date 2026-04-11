<script setup lang="ts">
import Skillinfo from '../components/yjluo/about/skillinfo.vue'
import Author from '../components/yjluo/about/author.vue'
import Aboutsitetips from '../components/yjluo/about/aboutsitetips.vue'
import MyInfoAndSayHello from '../components/yjluo/about/myInfoAndSayHello.vue'
import Single from '../components/yjluo/about/single.vue'

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <link href="/assets/css/about.css" rel="stylesheet"></link>
  <div id="about-page" style="margin-top: 1rem;margin-left: 1rem;margin-right: 1rem;">
    <Author />
    <div class="author-page-content">
      <div class="author-content">
        <MyInfoAndSayHello />
      </div>
      <div class="author-content">
        <Aboutsitetips />
        <Maxim />
      </div>
      <div class="author-content">
        <!-- 来自于主流HEO主题的衍生版本 -->
        <Skillinfo />
        <!-- 来自于柳神的关于页面版本
        <Social /> -->
      </div>
      <!-- <div class="author-content">
        <Technology />
        <Game />
      </div> -->
      <div class="author-content">
        <Single />
      </div>
    </div>
  </div>
</template>