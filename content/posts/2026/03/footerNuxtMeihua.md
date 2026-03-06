---
title: 页脚魔改(Nuxt版本)
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-03-03 10:00:00
updated: 2026-03-06 10:00:00
image: /image/PostCover/WutheringWavesPostWidget.avif
categories:
  - 博客魔改
tags:
  - Nuxt
  - 魔改
  - 美化
recommend: true
---
## 前言
之前已经对页脚进行大规模的魔改过，但是效果一直不是很理想，而现在采用模块化来进行魔改是最为简单的一种。
::alert{type="warning" card}
#title
注意
#default
本组件尚未完成整体优化与魔改，请勿使用！在优化与魔改后会自行撤下。
::

## 页脚组件
::alert{type="warning" card}
#title
注意
#default
如何导入组件：

``` vue lang="vue"
<script lang="ts" setup>
// 导入组件位置（位置可以进行变换，只要能被导入位置引入即可）
import CopyrightCard from '../card/footer/copyrightCard.vue';
import InfoCard from '../card/infoCard.vue';
</script>

<template>
  <!-- 导入位置 -->
  <导入的位置-1 />
  <!-- 省略其余代码 -->
  <导入的位置-2 />
</template>
```
::
::tab{:tabs='["欢迎信息", "版权&其余信息"]'}
#tab1
``` vue [infoCard.vue] lang="vue"
<template>
  <div class="FooterCard">
    <div class="head">
      <p class="title">
        {{ blogConfig.title }}
      </p>
      <p class="desc" v-for="(info, index) in footer_card_info" :key="index">
        {{ info.desc }}
      </p>
    </div>
    <div class="footer">
      <div class="button_div">
        <a class="button" v-for="(info, index) in footer_card_info" :key="index" :href="info.link" target="_blank">
          {{ info.link_button_name }}
        </a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
// 提前导入配置，减少运行时延迟
import blogConfig from '~~/blog.config'

// 使用const声明，确保编译时常量优化
const footer_card_info = [{
  desc: '欢迎来到我的博客',
  link: '/about',
  link_button_name: '关于我的'
}]
</script>

<style lang="scss" scoped>
.FooterCard {
  text-align: center;
  
  .head {
    .title {
      font-size: 1.2rem;
      font-weight: 900;
    }
    
    .desc {
      font-size: 1rem;
    }
  }
  
  .footer {
    margin-top: 1rem;
    
    .button_div {
      padding: 0.5rem;
      background: var(--c-bg-2);
      border-radius: 1rem;
      margin: 0 auto;
      max-width: 20%;
      
      .button {
        // 移除默认链接样式
        text-decoration: none;
        color: inherit;
        display: inline-block;
        // 添加过渡效果提升用户体验
        transition: opacity 0.2s ease;
        
        &:hover {
          opacity: 0.8;
        }
      }
    }
  }
}
</style>
```

#tab2
``` vue [copyRightCard.vue] lang="vue"
<script setup lang="ts">
const appConfig = useAppConfig()
const footerGroup = [{
  label: "萌ICP备20251949号",
  tip: "前往萌国ICP备案进行查询",
  url: "https://icp.gov.moe/"
},{
  label: "业务状态",
  tip: "前往查看状态",
  url: "https://kuma.wxuyu.top/status/wxuyu"
}]
</script>
<template>
  <div class="copyrightCard">
    <div class="copyrightNav">
      <div class="timeLoad">
        <div class="Powerby">
          ©{{ appConfig.timeStart }} — 2026 Powerby
        </div>
        <a class="copyrightName" :href="appConfig.url" :title="appConfig.title" target="_blank">
          <NuxtImg class="logo" :alt="appConfig.title" :src="appConfig.header.logo" :class="{circle: appConfig.header.showTitle}" width="25" height="25" loading="lazy" />
          <div class="title">
            {{ appConfig.title }}
          </div>
        </a>
      </div>
      <div class="themes">
        <div class="Themesinfo">
          <p> 采用 </p>
          <a href="https://github.com/L33Z22L11/blog-v3"> Clarity </a>
          <p> 主题 </p>
        </div>
      </div>
      <div class="footerGroup">
        <a :href="group.url" v-for="group in footerGroup">
          <span v-tip="group.tip">{{ group.label }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.copyrightCard {
  .copyrightNav {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    
    .timeLoad {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.9em;
      
      .Powerby, .copyrightName {
        display: flex;
        align-items: center;
        gap: 0.2rem;
      }
      
      .copyrightName {
        padding: 0.5rem;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.2s;
        
        &:hover {
          opacity: 0.8;
        }
        
        .logo {
          width: 25px;
          height: 25px;
          min-width: 25px;
          min-height: 25px;
          border-radius: 50%;
          object-fit: cover;
          
          &.circle {
            border-radius: 50%;
          }
        }
        
        .title {
          font-size: 1em;
          font-weight: 500;
        }
      }
    }
    
    .themes {
      font-size: 0.85em;
      color: var(--c-text-secondary);

      .Themesinfo {
        display: flex;
        gap: 0.5rem;
      }
    }
    .footerGroup {
      font-size: 0.85em;
      color: var(--c-text-secondary);
      display: flex;
      gap: 0.6em;
    }
  }
}
</style>
```
::


## 更新内容
**V20260306-PRE**
- 1.PUG更换为VUE写法，并且修复引入的数据在ts中无法正常显示的问题

**V20251210-PRE**
- 1.优化CSS样式
- 2.优化TS数据表项目

**V20251109-PRE**
- 1.使用PUG语法为组件展示
- 2.使用CSS语法为组件样式