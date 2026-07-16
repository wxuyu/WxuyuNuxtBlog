<template lang="pug">
.FooterIntroCard
  .head
    p.title {{ blogConfig.title }}
    p.desc 记录技术与生活的个人博客
  .footer
    .link_group
      NuxtLink(to="/about") 了解更多
      a(href="https://github.com/L33Z22L11/blog-v3" target="_blank") 主题来源
</template>

<script lang="ts" setup>
import blogConfig from '~~/blog.config'
</script>

<style lang="scss" scoped>
.FooterIntroCard {
  text-align: center;

  .head {
    .title {
      font-size: 1.2rem;
      font-weight: 900;
    }

    .desc {
      font-size: 0.9rem;
      color: var(--c-text-2);
      margin-top: 0.3rem;
    }
  }

  .footer {
    margin-top: 0.8rem;

    .link_group {
      display: flex;
      justify-content: center;
      gap: 1rem;
      font-size: 0.8rem;

      a {
        text-decoration: none;
        color: var(--c-text-2);
        transition: color 0.2s;

        &:hover {
          color: hsl(var(--thyuu--main-color));
        }
      }
    }
  }
}
</style>
