<script setup lang="ts">
import SkillList from '~/components/about/SkillList.vue'
import AuthorInfo from '~/components/about/AuthorInfo.vue'
import SiteIntro from '~/components/about/SiteIntro.vue'
import PersonalGreeting from '~/components/about/PersonalGreeting.vue'
import AboutContent from '~/components/about/AboutContent.vue'

const layoutStore = useLayoutStore()
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <link href="/assets/css/about.css" rel="stylesheet"></link>
  <div id="about-page" style="margin-top: 1rem;margin-left: 1rem;margin-right: 1rem;">
    <AuthorInfo />
    <div class="author-page-content">
      <div class="author-content">
        <PersonalGreeting />
      </div>
      <div class="author-content">
        <SiteIntro />
        <Maxim />
      </div>
      <div class="author-content">
        <!-- 来自于主流HEO主题的衍生版本 -->
        <SkillList />
        <!-- 来自于柳神的关于页面版本
        <Social /> -->
      </div>
      <!-- <div class="author-content">
        <Technology />
        <Game />
      </div> -->
      <div class="author-content">
        <AboutContent />
      </div>
    </div>
  </div>
</template>