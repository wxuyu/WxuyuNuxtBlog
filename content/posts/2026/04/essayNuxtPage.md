---
title: 说说页面（Nuxt版本）
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-04-11 14:00:00
updated: 2026-04-11 22:00:00
image: /image/PostCover/footerNuxtMeihua.avif
categories: [站点魔改]
tags: ['Nuxt', '页面']
recommend: true
---
## 前言
对于自身来讲，在为了区分闲言和文章的过程中总会用到这个的，但是一直在本地部署->无服务器部署->云服务器部署这三环里面绕圈。如果给3种不同部署方式来进行单独页面配置会导致页面开销极大。而自己的博客相较之前的不同框架来讲易用性会更好，所以我就一直想着要不做模块拆分+嵌套引入的方式来完成这个操作，从而通过`v-if`或者`v-else-if`来进行适配条件。那么话到此处，就先来上手吧。

## 魔改前的配置

既然要来实践了，在多模块的驱动下。如果每一个都需要单独配置，那就会导致后续重写的难度会逐步增加，这会导致整体易用性困难。那就需要我们来进行全局配置，通过调用`app.config.ts`或者`blog.config.ts`中的自定义配置项来解决这个问题。
如以下配置:
``` ts ['blog.config.ts'] lang="ts" 
  essay: {
    API: {
      ISPEAK: 'https://ispeak.api.wxuyu.top/',
      MEMOS: '',
    },
    CONFIG: {
      ISPEAK_CONFIG: {
        author: '69d21e1f84a9d355ffe37d55',
        error_image: 'https://lib.bsgun.cn/Hexo-static/img/avatar.256.avif'
      },
      LOCAL_ESSAY: {
        page_size: 10
      },
    },
    TYPE: 'local',
  },
```

| 配置项          | 功能                                                                                                                            |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| ESSAY_API    | 集合不同类别的API链接，通过在不同模块中调用该配置项中的特定内容来进行链接<BR>拼接的位置，例如：`${API.ISPEAK}/api`                                                        |
| ESSAY_CONFIG | 集合不同类别的配置项，通过在不同模块中调用配置项中的特定内容来进行拼合链接<BR>或者作为显示多少数据量，例如：`${API.ISPEAK}/api/${test_config_post}?author${CONFIG.ISPEAK.author}` |
| TYPE         | 通过不同模块中的类别判定来驱动`v-if` 或者`v-else-is` 来进行显示隐藏                                                                                   |

## 核心代码
### 页面配置
以下为整体的显隐逻辑页面，因为博客框架是用到纸鹿的博客源码进行构造，其他博客框架按照如何实现来进行适配
``` vue lang="vue"
<script setup lang="ts">
import Ispeak_Page_Main from '~/components/yjluo/essay/ispeak/Page_Main.vue';
import Local_Page_Main from '~/components/yjluo/essay/local/PageMain.vue';
// 全局配置
const appConfig = useAppConfig()
const layoutStore = useLayoutStore()

// 设置侧边栏组件
layoutStore.setAside(['blog-stats', 'blog-tech', 'blog-log'])
</script>

<template>
  <div v-if="appConfig.essay.TYPE === 'ispeak'">
    <Ispeak_Page_Main />
  </div>
  <div v-if="appConfig.essay.TYPE === 'memos'">

  </div>
  <template v-if="appConfig.essay.TYPE === 'local'">
    <Local_Page_Main />
  </template>
  
  <PostComment />
</template>
```

### 数据源
整体的数据源其实很杂，所以这边我用直观的展示方式来给到需要的人。
::tab{:tabs='["ispeak", "local"]'}
#tab1
这个数据原版是采用了ispeak官方原版未构建成js时的源码来进行加入

``` ts lang="ts"
export interface TagType {
  bgColor: string
  createAt: Date
  description: string
  name: string
  orderNo: number
  user: string
  _id: string
}
export interface SpeakType {
  author: { nickName: string; avatar: string }
  content: string
  createdAt: Date
  showComment: '1' | '0'
  tag: TagType
  title: string
  type: '0' | '1' | '2'
  updatedAt: Date
  _id: string
}
```

#tab2
该版本采用了[栖童の小站](https://blog.linux-qitong.top/)的数据框架，也是依靠这个文件来进行重构。同时这个版本有两个文件，一个在types里面，另外一个是在你能引入到的地方。

::tab{:tabs='["local.type", "local.data"]'}
#tab1
``` ts lang="ts"
export type TalkItem = {  
  text?: string
  date: string
  images?: string[]
  video?: {
    type?: 'raw' | 'bilibili' | 'bilibili-nano' | 'youtube' | 'douyin' | 'douyin-wide' | 'tiktok'
    id: string
    ratio?: string | number
    poster?: string
  }
  tags?: string[]
  location?: string
}
```

#tab2
``` ts lang="ts"
import type { TalkItem } from "~/types/local.essay"

export default [{
  text: 'cscscs',
  date: '2026-04-10 14:33',
  video: {
    id: 'https://media.w3.org/2010/05/sintel/trailer.mp4',
    poster: 'https://lf-package-cn.feishucdn.com/obj/atsx-throne/hire-fe-prod/portal/i18n/static/image/video-poster.d9fdf4be.jpeg'
  },
  image: [
  ],
  tags: ['cs'],
  location: 'cs'
}]
```
::
::

### 整体页面
::tab{:tabs='["ispeak", "local"]'}
#tab1
未写完，请勿使用

#tab2
::tab{:tabs='["页面", "卡片"]'}
#tab1
``` vue lang="vue"
<script setup lang="ts">
import Speak_Body_Card from './Body/Speak_Body_Card.vue';
</script>

<template>
  <div class="Speak_Main" style="padding: 1rem;">
    <Speak_Body_Card />
  </div>
</template>
```

#tab2
```vue lang="vue"
<script setup lang="ts">
import appConfig from '~/app.config';
import Button from '~/components/partial/Button.vue';
import Speak from '~/data/essay/local/speak';

const recentTalks = [...Speak]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, appConfig.essay.CONFIG.LOCAL_ESSAY.page_size)

function replyTalk(content: string): void {
  const input = document.querySelector('#twikoo .tk-input textarea')
  if (!(input instanceof HTMLTextAreaElement)) return

  if (content.trim()) {
    const quotes = content.split('\n').map(str => `> ${str}`)
    input.value = `${quotes}\n\n`
  } else {
    input.value = ''
  }
  input.dispatchEvent(new InputEvent('input'))

  const length = input.value.length
  input.setSelectionRange(length, length)
  input.focus()
}
</script>

<template>
  <div class="Speak_Card" v-for="talk in Speak" :key="talk.date">
    <div class="Speak_Card_Header">
      <div class="Card_Header_Left">
        <NuxtImg class="Card_Header_Image" :src="appConfig.author.avatar" />
        <div class="Card_Header_Warp">
          <span>{{ appConfig.author.name }}</span>
          <div class="Header_Warp_Time">{{ talk.date }}</div>
        </div>
      </div>
    </div>
    <div class="Speak_Card_Content">
      <div class="Card_Content_Text" v-if="talk.text" v-html="talk.text" />
      <div v-if="talk.image" class="zone_imgbox">
        <figure v-for="(img, imgIndex) in talk.image" :key="imgIndex" class="img-item">
          <Pic :src="img" zoom class="talk-img" loading="lazy" :fetchpriority="imgIndex === 0 ? 'high' : 'low'" />
        </figure>
      </div>
      <VideoEmbed class="video" v-if="talk.video" v-bind="talk.video" height="" />
    </div>
    <div class="Speak_Card_Footer">
      <div class="tag">
        <Badge class="tagCard" v-for="tag in talk.tags">
          <Icon name="i-tabler:tag" />
          {{ tag }}
        </Badge>        
      </div>
      <button class="comment-btn" @click="replyTalk(talk.text)" v-tip="`评论`">
          <Icon name="ph:chats-bold" class="icon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.Speak_Card {
  animation: float-in .3s backwards;
  animation-delay: var(--delay);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  .Speak_Card_Header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    flex-wrap: wrap;
    .Card_Header_Left {
      align-items: center;
      display: flex;
      gap: 10px;
      .Card_Header_Image {
        border-radius: 50%;
        box-shadow: 2px 4px 1rem var(--ld-shadow);
        width: 3em;
        @supports (corner-shape: squircle) {
          corner-shape: superellipse(1.2);
        }
      }
      .Card_Header_Warp {
        .Header_Warp_Name {
          align-items: center;
          display: flex;
          gap: 5px;
        }
        .Header_Warp_Time {
          color: var(--c-text-3);
          font-family: var(--font-monospace);
          font-size: 0.8rem;
        }
      }
    }
  }
  .Speak_Card_Content {
    color: var(--c-text-2);
    display: flex;
    flex-direction: column;
    gap: .5rem;
    line-height: 1.6;

    :deep(a[href]) {
      margin: -.1em -.2em;
      padding: .1em .2em;
      background: linear-gradient(var(--c-primary-soft), var(--c-primary-soft)) no-repeat center bottom / 100% .1em;
      color: var(--c-primary);
      transition: all .2s;

      &:hover {
        border-radius: .3em;
        background-size: 100% 100%;
      }
    }

    :deep(.zone_imgbox) {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;

      .img-item {
        position: relative;
        padding-bottom: 100%;
        border-radius: 8px;
        overflow: hidden;

        img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: zoom-in;
          transition: transform .3s;

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }
  .Speak_Card_Footer {
    align-items: center;
    color: var(--c-text-3);
    display: flex;
    justify-content: space-between;
    .tag {
      display: flex;
      font-size: .7rem;
      gap: 4px;
      :deep(.tagCard) {
        font-size: 12px;
        font-weight: 700;
      }
    }
  }
}
</style>
```
::
::