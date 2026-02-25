---
title: 【鸣潮】档案文章组件
description: 该文章主要写了对于低价机器的试水，并提醒是超开类型的机器。在测试的过程中发现机器性能较高，且展示出机器的具体价格，并单独列出只有精简版未采用完整版测试。
date: 2026-02-20 10:00:00
updated: 2026-02-25 20:49:00
image: /image/PostCover/vpsTalk.avif
categories: [博客魔改]
tags: [Nuxt, 魔改, 美化]
recommend: true
---
## 前言
最近，刚好也是游玩了鸣潮这款游戏，然后在B站上看到了一些关于鸣潮的电子设定类网站，观摩了下打算在使用组件来写。在这个过程中，会去除了一些光效并采用自己之前写的一个卡片类文章组件。
::alert{type="warning" card}
#title
注意
#default
大多数组件未适配多角色类型，可以在该版本的基础上进行优化，在本站适配完全部角色后会移除该提示。
::

## 档案组件
### 人物主体
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroMain.vue] lang="ts"
<script setup lang="ts">
import Title from '../card/title.vue';
defineProps<{
  类型: "爱弥斯" | "尤诺" | "奥古斯塔"
  头像?: string
  徽章?: Record<string, string>
  名字?: string
  标签?: Record<string, string>
  简介?: {
    上部分?: string
    称号?: string
    下部分?: string 
  };
  详情信息?: Record<string, string>
  档案?: {
    顶部标题?: string
    报告: Array<{
      序号?: number
      主标题?: string
      独有副标题?: string
      常用副标题?: string
      常用简介?: Record<string, string> | string
      独特简介?: {
        上段简介: string
        上段夹杂简介: string
        中段简介: string
        中段夹杂简介: string
        下段简介: string
        下段夹杂简介: string
        末尾简介: string
      }
      状态?: string
      权限?: string
      更新?: string
    }>
  }
}>();
const numberTop = ref(1)
</script>

<template>
  <div class="heroMain">
    <div class="heroCard">
      <div class="leftInfo">
        <NuxtImg class="avatarImage" :src="头像" />
        <h3 class="avatarName">
          {{ 名字 }}
        </h3>
        <div class="avatarMeta">
          <span class="MetaSpan" v-for="([key, value]) in Object.entries(徽章 ?? {})" :key="key"> {{key}}：{{value }} </span>
        </div>
      </div>
      <div class="rightInfo">
        <div class="panelMain">
          <Title title="简介"></Title>
          <p class="heroDesc">
            {{ 简介?.上部分 }}<span class="lightDesc">{{ 简介?.称号 }}</span
            >{{ 简介?.下部分 }}
          </p>
          <Title title="标签"></Title>
          <span class="tagItem" style="margin-top: 0.5em;margin-bottom: 0.5em;">
            <span class="tag" v-for="([key, value]) in Object.entries(标签 ?? {})" :key="key">
              #{{ value }}
            </span>
          </span>
          <Title title="详情信息"></Title>
          <div class="infoMain">
            <div
              class="infoCard"
              v-for="([key, value]) in Object.entries(详情信息 ?? {})"
              :key="key"
            >
              <div class="infoLabel">{{ key }}</div>
              <div class="infoValue">{{ value }}</div>
            </div>
          </div>
          <Title :title="档案?.顶部标题"></Title>
          <div class="statusMain" style="margin-top: 0.5em;" v-for="data in 档案?.报告">
            <div class="statusHeader" v-show="类型 === '尤诺'">
              <div class="HeaderTitle">
                {{ data.主标题 }}
              </div>
              <div class="HeaderSub" style="font-size: 0.5em;">
                {{ data.常用副标题 }}
              </div>
            </div>
            <div class="statusHeader" v-show="类型 === '爱弥斯'" style="display: flex;">
              <div class="HeaderTitle">
                {{ data.主标题 }}
              </div>
              <div class="HeaderSub" v-if="data.序号 === 1" style="font-size: 0.5em;font-size: .75rem;background: #f003;color: #ff6b85;padding: 2px 6px;border-radius: 4px;">
                {{ data?.独有副标题 }}
              </div>
            </div>
            <div class="statusContent">
              <p v-for="([key, value]) in Object.entries(data.常用简介 ?? {})" :key="key" v-show="类型 === '尤诺'">
                {{ value }}
              </p>
              <div v-show="类型 === '爱弥斯'" class="statusDesc">
                {{ data.独特简介?.上段简介 }}<span class="statusLight">{{ data.独特简介?.上段夹杂简介 }}</span>{{ data.独特简介?.中段简介 }}<span class="statusLight">{{ data.独特简介?.中段夹杂简介 }}</span>{{ data.独特简介?.下段简介 }}<span class="statusLight">{{ data.独特简介?.下段夹杂简介 }}</span>{{ data.独特简介?.末尾简介 }}
              </div>
              <p>
                {{ data.常用简介 }}
              </p>
            </div>
          </div>
        </div>
      </div>      
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heroMain {
  width: 100%;
  height: 320px;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  display: flex;

  .heroCard {
    flex: 1;
    display: flex;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;
  }

  // 左侧信息区（头像+共鸣能力）
  .leftInfo {
    grid-template-rows: auto auto;
    justify-items: center;
    border-radius: 16px;
    padding: 12px;
    border: 2px solid transparent;
    background-clip: padding-box;
    animation: cursorAnimation_link 1s infinite step-start;
    transition: all 0.3s;
    position: relative;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    width: 200px;
    overflow: hidden;

    .avatarImage {
      width: 100%;
      height: auto;
      border-radius: 12px;
      display: block;
    }
    
    .avatarName {
      margin-top: 8px;
      font-size: 14px;
      font-weight: bold;
      text-align: center;
    }
    .avatarMeta {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;

      .MetaSpan {
        font-weight: 600;
        margin-top: 4px;
        font-size: 12px;
        color: var(--c-text-sub);
        background: #ff8cb01a;
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid var(--pink-core);
      }
    }
  }

  // 右侧信息区（名称+描述+状态卡）
  .rightInfo {
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 6;
    overflow-y: scroll;
    scrollbar-width: none;

    .panelMain {
      position: relative;
      z-index: 6;

      .heroName {
        font-size: clamp(1.8rem, 3vw, 2.8rem);
        margin: 0;
        font-weight: 900;
        letter-spacing: 1px;
        line-height: 1;
        color: var(--pink-core);
        text-shadow: 0 0 10px var(--pink-core), 0 0 20px var(--blue-glitch);
        position: relative;
        animation: glitch-b7066fb5 3s infinite;
        position: relative;

        .heroTitle {
          font-size: 0.95rem;
          color: var(--blue-glow);
          margin-left: 8px;
          font-weight: 400;
        }

        &::before,
        &::after {
          content: attr(data-text);
          position: absolute;
          left: 2px;
          text-shadow: -2px 0 var(--blue-glitch);
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim-b7066fb5 5s infinite linear alternate-reverse;
        }

        &::after {
          left: -2px;
          text-shadow: -2px 0 var(--pink-core);
          clip: rect(44px, 450px, 56px, 0);
          animation: glitch-anim2-b7066fb5 5s infinite linear alternate-reverse;
        }
      }

      .heroDesc {
        font-size: 14px;
        color: var(--c-text-content);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        .lightDesc {
          color: var(--pink-core);
          text-shadow: 0 0 8px var(--pink-core);
        }
      }
      .tagItem {
        align-items: center;
        display: flex;
        flex-wrap: wrap;
        gap: .3em .6em;
        .tag {
          background-color: var(--c-bg-soft);
          border-radius: .4em;
          color: var(--c-text-soft);
          font-size: .9em;
          padding: .25em .6em;
          transition: all .2s;
          &:hover {
            background-color: var(--c-primary-soft);
            color: var(--c-primary);
          }
        }
      }
    }
  }

  // 状态卡片（双列网格）
  .infoMain {
    background: transparent;
    border-radius: 0;
    display: grid;
    font-size: 1rem;
    gap: 0.4rem;
    grid-template-columns: repeat(4, 1fr);
    padding: 0;
    margin-top: 0.5em;
    .infoCard {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      margin: 0.5em 0;
      .infoLabel {
        color: var(--c-text-2);
        font-size: 0.8rem;
        font-weight: 500;
      }
      .infoValue {
        color: var(--c-text);
        font-size: 0.8rem;
        word-break: break-word;
      }
    }
  }
  .statusMain {
    background: rgba(122, 92, 61, 0.08);
    border-radius: 6px;
    padding: 10px;    
    .statusHeader {
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }
    .statusContent {
      font-size: 13px;
      color: var(--c-text-content);
      line-height: 1.5;
      .statusDesc {
        color: var(--c-text-content);
        line-height: 1.5;
        .statusLight {
          color: var(--pink-core);
          text-shadow: 0 0 8px var(--pink-core);
        }
      }
    }
  }

  /* ========== 移动端适配（max-width: 768px） ========== */
  @media screen and (max-width: 768px) {
    width: 100%;
    height: auto;
    margin: 1rem 0; 
    border-radius: 0.5rem;
    overflow: hidden; 

    .heroCard {
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem;
    }

    // 左侧信息区适配
    .leftInfo {
      width: 100%;
      padding: 0.5rem;
      border-radius: 10px;
      .avatarImage {
        width: 200px;
        height: 200px;
        border-radius: 8px;
      }
      .avatarName {
        font-size: 12px;
        margin-top: 4px;
      }
      .avatarMeta {
        font-size: 0.7rem;
        gap: 4px;
        .MetaSpan {
          font-size: 0.7rem;
          padding: 3px 6px;
          border-radius: 6px;
        }
      }
    }

    // 右侧信息区适配
    .rightInfo {
      .panelMain {
        padding: 1rem;
        .heroName {
          font-size: clamp(1rem, 2vw, 1.4rem);
          letter-spacing: 0.3px;
          line-height: 1.2;
          .heroTitle {
            font-size: 0.75rem;
            margin-left: 4px;
          }
        }
        .heroDesc {
          font-size: 0.85rem;
          line-height: 1.4;
          .lightDesc {
            font-size: 0.85rem;
          }
        }
        .tagItem {
          gap: 0.2em 0.4em;
          .tag {
            font-size: 0.75em;
            padding: 0.2em 0.5em;
          }
        }
      }
    }

    // 状态卡片适配（单列布局）
    .infoMain {
      grid-template-columns: repeat(3, 1fr);
      gap: 0.2rem;
      font-size: 0.8rem;
      .infoCard {
        gap: 0.1rem;
        .infoLabel,
        .infoValue {
          font-size: 0.75rem;
        }
      }
    }

    // 档案部分适配
    .statusMain {
      padding: 8px;
      border-radius: 5px;
      .statusHeader {
        gap: 6px;
        margin-bottom: 4px;
      }
      .statusContent {
        font-size: 0.8rem;
        line-height: 1.4;
        .statusDesc {
          font-size: 0.8rem;
          line-height: 1.4;
          .statusLight {
            font-size: 0.8rem;
          }
        }
      }
    }

    // 隐藏滚动条（可选，提升移动端体验）
    .rightInfo::-webkit-scrollbar {
      display: none;
    }
    .rightInfo {
      overflow-y: auto;
    }

    // 简化动效（减少移动端性能消耗）
    @keyframes glitch-b7066fb5 {
      0% {
        transform: translate(0);
        text-shadow: -2px 0 var(--blue-glitch), 2px 2px var(--pink-core)
      }
      20% {
        transform: translate(-1px, 1px);
        text-shadow: 1px -1px var(--blue-glitch), -1px 1px var(--pink-core)
      }
      40% {
        transform: translate(1px, -1px);
        text-shadow: -1px 1px var(--blue-glitch), 1px -1px var(--pink-core)
      }
      60% {
        transform: translate(0);
        text-shadow: 1px 0 var(--blue-glitch), -1px -1px var(--pink-core)
      }
      80% {
        transform: translate(1px, 1px);
        text-shadow: -1px -1px var(--blue-glitch), 1px 0 var(--pink-core)
      }
      to {
        transform: translate(0);
        text-shadow: none
      }
    }
  }
}

// 保留全局动效样式（用户要求不改变全局样式）
@keyframes pulse-glow-b7066fb5 {
  0%,
  to {
    filter: drop-shadow(0 0 5px var(--pink-glow)) drop-shadow(0 0 10px var(--blue-glitch))
  }
  50% {
    filter: drop-shadow(0 0 15px var(--pink-core)) drop-shadow(0 0 20px var(--blue-glow))
  }
}
@keyframes scanline-b7066fb5 {
  0% {
    transform: translateY(-100%)
  }
  to {
    transform: translateY(100%)
  }
}
@keyframes blink-b7066fb5 {
  0%,
  to {
    opacity: 1
  }
  50% {
    opacity: .3
  }
}
@keyframes float-particle-b7066fb5 {
  0% {
    transform: translate(0) rotate(0);
    opacity: 0
  }
  10% {
    opacity: .5
  }
  90% {
    opacity: .5
  }
  to {
    transform: translate(calc(100vw * var(--dx)), calc(100vh * var(--dy))) rotate(360deg);
    opacity: 0
  }
}
@keyframes hologram-scan-b7066fb5 {
  0% {
    top: -10%;
    opacity: 0
  }
  20% {
    opacity: .8
  }
  80% {
    opacity: .8
  }
  to {
    top: 110%;
    opacity: 0
  }
}
@keyframes core-pulse-b7066fb5 {
  0% {
    box-shadow: 0 0 5px var(--pink-core), 0 0 15px var(--blue-glitch)
  }
  50% {
    box-shadow: 0 0 15px var(--pink-core), 0 0 30px var(--blue-glow), 0 0 45px var(--pink-light)
  }
  to {
    box-shadow: 0 0 5px var(--pink-core), 0 0 15px var(--blue-glitch)
  }
}
@keyframes borderRotate-b7066fb5 {
  0% {
    filter: hue-rotate(0deg)
  }
  to {
    filter: hue-rotate(360deg)
  }
}
@keyframes itemIn-b7066fb5 {
  to {
    opacity: 1;
    transform: translateY(0)
  }
}
@keyframes glitch-anim-b7066fb5 {
  0% {
    clip: rect(31px, 9999px, 94px, 0)
  }
  5% {
    clip: rect(70px, 9999px, 71px, 0)
  }
  10% {
    clip: rect(29px, 9999px, 83px, 0)
  }
  15% {
    clip: rect(16px, 9999px, 91px, 0)
  }
  20% {
    clip: rect(2px, 9999px, 36px, 0)
  }
  25% {
    clip: rect(27px, 9999px, 9px, 0)
  }
  30% {
    clip: rect(9px, 9999px, 53px, 0)
  }
  35% {
    clip: rect(17px, 9999px, 24px, 0)
  }
  40% {
    clip: rect(74px, 9999px, 61px, 0)
  }
  45% {
    clip: rect(17px, 9999px, 83px, 0)
  }
  50% {
    clip: rect(74px, 9999px, 55px, 0)
  }
  55% {
    clip: rect(38px, 9999px, 48px, 0)
  }
  60% {
    clip: rect(94px, 9999px, 42px, 0)
  }
  65% {
    clip: rect(35px, 9999px, 23px, 0)
  }
  70% {
    clip: rect(41px, 9999px, 46px, 0)
  }
  75% {
    clip: rect(35px, 9999px, 3px, 0)
  }
  80% {
    clip: rect(41px, 9999px, 96px, 0)
  }
  85% {
    clip: rect(52px, 9999px, 59px, 0)
  }
  90% {
    clip: rect(69px, 9999px, 97px, 0)
  }
  95% {
    clip: rect(10px, 9999px, 71px, 0)
  }
  to {
    clip: rect(67px, 9999px, 38px, 0)
  }
}
@keyframes glitch-anim2-b7066fb5 {
  0% {
    clip: rect(65px, 9999px, 59px, 0)
  }
  5% {
    clip: rect(88px, 9999px, 67px, 0)
  }
  10% {
    clip: rect(94px, 9999px, 7px, 0)
  }
  15% {
    clip: rect(73px, 9999px, 14px, 0)
  }
  20% {
    clip: rect(96px, 9999px, 71px, 0)
  }
  25% {
    clip: rect(13px, 9999px, 35px, 0)
  }
  30% {
    clip: rect(72px, 9999px, 66px, 0)
  }
  35% {
    clip: rect(70px, 9999px, 22px, 0)
  }
  40% {
    clip: rect(13px, 9999px, 98px, 0)
  }
  45% {
    clip: rect(63px, 9999px, 7px, 0)
  }
  50% {
    clip: rect(80px, 9999px, 21px, 0)
  }
  55% {
    clip: rect(27px, 9999px, 52px, 0)
  }
  60% {
    clip: rect(89px, 9999px, 14px, 0)
  }
  65% {
    clip: rect(51px, 9999px, 80px, 0)
  }
  70% {
    clip: rect(2px, 9999px, 37px, 0)
  }
  75% {
    clip: rect(71px, 9999px, 86px, 0)
  }
  80% {
    clip: rect(19px, 9999px, 46px, 0)
  }
  85% {
    clip: rect(82px, 9999px, 8px, 0)
  }
  90% {
    clip: rect(48px, 9999px, 3px, 0)
  }
  95% {
    clip: rect(68px, 9999px, 100px, 0)
  }
  to {
    clip: rect(47px, 9999px, 2px, 0)
  }
}
</style>
```

#tab2
::hero
---
头像: /image/PageInternal/Wuthering Waves/ams/author/11.avif
徽章:
  共鸣能力: 长航的星辉
名字: 爱弥斯
称号: 电子幽灵
简介:
  上部分: 曾是星炬学院的隧者适格者，如今已成为在星海轻歌的
  下部分: 。她在寂静的星海中飞行，星屑在身侧崩解，时间在身后消亡。漫漫孤寂并未消失，它只是被拉伸、稀释、重塑，最终成为她羽翼的一部分。“我知道，只要抬头，那颗星总能找到我。”
详情信息: 
  首次登场: 3.0版本
  正式实装: 3.1版本
  共鸣属性: 热熔
  武器: 讯刀
标签:
  标签1: 星炬学院拉贝尔学部
  标签2: 隧者适格者
  标签3: 飞行雪绒
---
::
::
#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
hero属性

| 配置项   | 类型                                      | 说明                                     |
|----------|-------------------------------------------|------------------------------------------|
| 类型     | "爱弥斯"、"尤诺"、"奥古斯塔"              | 角色类型（目前只有几种，未适配完成）     |
| 头像     | string                                    | 角色头像                                 |
| 徽章     | Record<string, string>                    | 角色徽章(共鸣能力、属性等等)             |
| 名字     | string                                    | 角色名字                                 |
| 标签     | Record<string, string>                    | 角色曾用标签                             |
| 详情信息 | Record<string, string>                    | 角色全局信息                             |
| 简介     | 简介[]?                                   | 角色全局简介（包含上部分、称号、下部分） |
| 档案     | 档案[]?                                   | 角色全局特殊&非特殊报告（补充一些设定）  |

简介属性
| 配置项   | 类型                |
|----------|---------------------|
| 上部分   | string              |
| 下部分   | string              |
| 称号     | string              |

档案属性
| 配置项          | 类型                          | 说明                                                                                     |
|-----------------|-------------------------------|------------------------------------------------------------------------------------------|
| 顶部标题        | string?                       | 全局标题，用于报告顶部展示                                                               |
| 报告            | Array<报告[]>                 | 报告数据集合，使用Array来进行多展示                                                      |

报告属性
| 配置项     | 类型                            | 说明                                                                                     |
|------------|---------------------------------|------------------------------------------------------------------------------------------|
| 序号       | number?                         | 报告条目序号                                                                             |
| 主标题     | string?                         | 报告核心标题                                                                             |
| 独有副标题 | string?                         | 仅当前报告特有的补充说明                                                                 |
| 常用副标题 | string?                         | 通用补充说明                                                                             |
| 常用简介   | Record<string,string><br>string | 多语言配置项（键值对）或单一字符串简介                                                   |
| 独特简介   | Array<独特简介[]>               | 特殊类型简介，在未来的过程当中特殊类型的档案内容来进行设置                               |
| 状态       | string                          | 状态标识（如：草稿/审核中/已发布）                                                       |
| 权限       | string                          | 访问权限控制（如：只读/编辑/管理员）                                                     |
| 更新       | string                          | 最后更新时间戳或版本号                                                                   |

#tab2
``` md lang="md"
::hero
---
类型: 爱弥斯
头像: /image/PageInternal/Wuthering Waves/ams/avatar/1.jpg
徽章:
  称号: 电子幽灵
名字: 爱弥斯
简介:
  上部分: 曾是星炬学院的隧者适格者，如今已成为在星海轻歌的
  下部分: 。她在寂静的星海中飞行，星屑在身侧崩解，时间在身后消亡。漫漫孤寂并未消失，它只是被拉伸、稀释、重塑，最终成为她羽翼的一部分。“我知道，只要抬头，那颗星总能找到我。”
详情信息: 
  首次登场: 3.0版本
  正式实装: 3.1版本
  共鸣属性: 热熔
  武器: 讯刀
  共鸣能力: 长航的星辉
标签:
  标签1: 星炬学院拉贝尔学部
  标签2: 隧者适格者
  标签3: 飞行雪绒
档案:
  顶部标题: 共鸣状况 · 电子幽灵档案
  报告:
    - 序号: 1 
      主标题: 频谱检验报告
      独有副标题: ▇▂▇数据损毁▇▋▌
      独特简介:
        上段简介: 「调自深空联合：星炬学院 学生档案」 「共鸣能力检验报告 RA2362-G」 学生姓名：爱弥斯 是否具有适格者资质：是 共鸣能力概述：受试样本拉贝尔曲线呈稳定上升态，最终趋向稳定波动，检测结果判断为自然型共鸣者，声痕位于胸口。 根据入学前提交的个人档案与学生自述，对象▇▇▂▇▋▌▏▉█……
        上段夹杂简介: 很遗憾，这份报告现在已经没有参考价值了，毕竟是生前的记录了~
        中段简介: 就让本人来补充一下吧。现在的我，已经是
        中段夹杂简介: 隧者的共鸣者，声痕相比之前也发生了变化，但状态不算很稳定。
        下段简介: 能力……可以显化「隧者兵装」并与之融合，简单来说就是变身啦！当然，为了方便战斗，我也给机兵设计了一套自运转的逻辑，目前模拟配合起来的感受还不错，能够更大限度地利用光炮的覆盖范围。除此之外，我也能以
        下段夹杂简介: 电子幽灵的形式进入数据系统内部
        末尾简介: 。不过，这或许不能称之为共鸣能力的一部分，将之归结于共鸣时的特殊状态带来的……▇▉▇▇▂▇ “奇怪，这名学生的档案怎么损毁了？打开后都是数据错误。” “那个失踪的适格者？嗯……上报给洛瑟菈校长吧。”
    - 序号: 2
      主标题: 超频诊断报告
      常用简介: 受试样本拉贝尔波形检测图呈椭圆形波动，时域表示稳定，未见任何异常波动倾向。检测结果判断为正常阶段。 诊断结果：超频临界值正常，稳定性高，暂无超频风险。 无过往超频史，拉贝尔曲线稳定。 暂无需心理辅导。 “爱弥斯同学……本学年状态尚处稳定，但我们还是需要更密切地关注她的精神状态。如果情况有变，要及时进行心理干预。” “那孩子明明看起来那么开朗……” “所以，保持关注就好。既然她希望这样生活，那就相信她的判断，我们作为师长，就做好该做的事吧。”
---
::
```
::

### 人物物品
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroSpecial.vue] lang="ts"
<!-- .vitepress/components/InfoCard.vue -->
<script setup lang="ts">
import { ref } from 'vue'
import Title from '../card/title.vue';

defineProps<{
  heroSpecialList?: Array<{
    物品名称: string       // 卡片标题
    物品含意: string        // 卡片描述
    物品简介: string
    物品图像: string       // 卡片主图
    物品彩蛋: string
  }>
}>()

// 跟踪当前激活的卡片索引（初始激活第一个）
const activeIndex = ref(0)
</script>

<template>
  <div class="infoCard">
    <!-- 左侧导航区：渲染所有导航头像，点击切换激活项 -->
    <div class="navArea">
      <div 
        class="navItem" 
        v-for="(item, index) in heroSpecialList" 
        :key="index"
        @click="activeIndex = index"
        :class="{ active: activeIndex === index }"
      >
        <NuxtImg 
          v-if="item.物品图像" 
          :src="item.物品图像" 
          alt="导航头像"
          class="nuxtImage"
          style="width: 40px; height: 40px; border-radius: 50%; object-fit: cover;"
        />
      </div>
    </div>

    <!-- 右侧内容区：仅渲染当前激活的卡片内容 -->
    <div class="contentArea" v-if="heroSpecialList?.[activeIndex]">
      <div class="cardLeft">
        <!-- 卡片主图 -->
        <img :src="heroSpecialList[activeIndex]?.物品图像" class="cardImage" alt="卡片主图" />
        <!-- 卡片标题 -->
        <h3 class="cardTitle">{{ heroSpecialList[activeIndex]?.物品名称 || '默认标题' }}</h3>
        <!-- 卡片附属名称（如角色名） -->
        <div class="cardSubInfo">
          <span>{{ heroSpecialList[activeIndex]?.物品含意 || '默认名称' }}</span>
        </div>
      </div>
      <div class="cardRight">
        <!-- 卡片描述 -->
        <Title title="描述" />
        <div class="cardDesc">
          {{ heroSpecialList[activeIndex]?.物品简介 || '暂无描述信息' }}
        </div>
        <Title title="彩蛋" />
        <div class="cardYouLai">
          {{ heroSpecialList[activeIndex]?.物品彩蛋 || "未写入" }}
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.infoCard {
  width: 100%;
  height: 320px;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  display: flex; /* 整体左右布局 */

  /* 左侧导航区：垂直排列头像 */
  .navArea {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem;
    width: 60px; /* 导航区宽度，适配头像垂直排列 */
    gap: 8px;    /* 头像之间的间距 */

    .navItem {
      cursor: pointer;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--c-bg-hover); /*  hover 背景色 */
      }

      &.active {
        background-color: var(--c-bg-active); /* 激活态背景色 */
      }
    }
  }

  /* 右侧内容区：卡片详情 */
  .contentArea {
    flex: 1;
    display: flex;
    gap: 1rem;
    padding: 1rem;
    overflow: hidden;

    .cardLeft {
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      align-items: center;
      width: 200px; /* 左侧卡片预览区宽度 */
      overflow: hidden;

      .cardImage {
        width: 100%;
        object-fit: cover;
        border-radius: 8px;
      }

      .cardTitle {
        margin-top: 8px;
        font-size: 14px;
        font-weight: bold;
        color: var(--c-text-title);
        text-align: center;
        // @include text-overflow; /* 若需单行省略，可封装 mixin */
      }

      .cardSubInfo {
        margin-top: 4px;
        font-size: 12px;
        color: var(--c-text-sub);
        background: rgba(122, 92, 61, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
      }
    }

    .cardRight {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
      overflow-y: scroll; /* 启用垂直滚动 */
      padding-right: 20px; /* 防止内容被遮挡 */
      /* 隐藏滚动条 - Webkit浏览器 */
      &::-webkit-scrollbar {
          width: 0;
          background: transparent;
      }
      /* 隐藏滚动条 - Firefox */
      scrollbar-width: none;
      /* 隐藏滚动条 - IE/Edge */
      -ms-overflow-style: none;
      
      .cardDesc, .cardYouLai {
        font-size: 14px;
        color: var(--c-text-content);
        line-height: 1.6;
        display: -webkit-box;
        -webkit-box-orient: vertical;
        .title {
          background: #ffffffb2;
          color: #ff9900b2
        }
      }
      .cardYouLai {
        display: block;
        color: var(--blue-glow);
        font-size: .85rem;
        border-left: 3px solid var(--pink-core);
        padding-left: 12px;
      }
      
      .tagItem {
        display: flex;
        flex-wrap: wrap;
        gap: .3rem;

        .tag {
          border-radius: .3rem;
          display: inline-block;
          font-size: 14px;
          white-space: nowrap;
        }
      }
      
      /* 技能模块样式 */
      .cardSkills {
        .skillsContainer {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        
        .skillItem {
          background: rgba(122, 92, 61, 0.08);
          border-radius: 6px;
          padding: 10px;
          
          .skillHeader {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
            
            .skillIcon {
              width: 24px;
              height: 24px;
              border-radius: 4px;
              object-fit: cover;
            }
            
            .skillName {
              font-size: 15px;
              color: var(--c-text-title);
            }
            .skillXg {
              font-size: 12px;
              color: var(--c-bg-content);
            }
          }
          .skillDesc {
            font-size: 13px;
            color: var(--c-text-content);
            line-height: 1.5;
          }
        }
        
        .noSkill {
          color: var(--c-text-sub);
          font-style: italic;
          padding: 8px;
          text-align: center;
          background: rgba(122, 92, 61, 0.05);
          border-radius: 6px;
        }
      }
    }
  }
}

/* 在原有样式基础上添加移动端适配 */
@media (max-width: 768px) {
  .infoCard {
    flex-direction: column;
    height: auto;
    padding: 0.5rem;
    
    .navArea {
      flex-direction: row;
      width: 100%;
      padding: 0.5rem;
      justify-content: flex-start;
      overflow-x: auto;
      
      .navItem {
        flex-shrink: 0;
        margin: 0 4px;
        
        .nuxtImage {
          width: 32px;
          height: 32px;
        }
      }
    }
    
    .contentArea {
      flex-direction: column;
      padding: 0.5rem;
      gap: 0.5rem;
      
      .cardLeft {
        width: 100%;
        align-items: center;
        
        .cardImage {
          max-width: 150px;
          height: auto;
        }
        
        .cardTitle {
          font-size: 20px;
        }
        
        .cardSubInfo {
          font-size: 15px;
        }
      }
      
      .cardRight {
        width: 100%;
        padding-right: 0;
        
        .cardDesc, .cardYouLai {
          font-size: 13px;
        }
        
        .tagItem .tag {
          font-size: 12px;
          padding: 2px 4px;
        }
        
        .cardSkills {
          .skillItem {
            padding: 8px;
            
            .skillHeader .skillName {
              font-size: 14px;
            }
            
            .skillDesc {
              font-size: 12px;
            }
          }
        }
      }
    }
  }
}

/* 超小屏幕优化 */
@media (max-width: 480px) {
  .infoCard {
    .contentArea {
      .cardLeft .cardImage {
        max-width: 150px;
      }
      
      .cardRight {
        .cardSkills .skillItem {
          padding: 6px;
        }
      }
    }
  }
}
</style>
```

#tab2
::hero-special
---
heroSpecialList:
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item1.avif
    物品名称: 《太空战士卡佳VI》
    物品含意: 一盘游戏卡带
    物品彩蛋: ※ 官方彩蛋：小屋里面右侧书柜有本《太空战士卡佳VI-星际导航图谱:全星系探索路线与任务图文攻略》
    物品简介: 《太空战士卡佳VI》，在索拉里斯的游戏爱好者中为人津津乐道的经典系列最新作。沉浸式的角色扮演剧情，丰富有趣的战斗系统，体验成为英雄的孤独之旅，结识十数位可招募的个性伙伴，与宇宙中的邪恶势力进行激烈对抗……除了这些部分，作为彩蛋的那个小游戏也是让爱弥斯极为喜欢的部分，她在通关后经常和家人一起在小屋中联机游玩。“哼哼，拼方块的积分排行榜，最后果然还是我排第一！”
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item2.avif
    物品名称: 隧者手办
    物品含意: 友情的证明
    物品彩蛋: ※ 那年之后，朋友们再也看不见她，但每年的歌友会依然在举办
    物品简介: 捂在爱弥斯眼上的那双手移开后，面前摆着的就是这样的一个小盒子。身边的四位好友笑眯眯地怂恿爱弥斯赶紧拆开，盒中的小型隧者手办就这么露了出来。适格者们像是叽叽喳喳的小动物那样祝贺她生日快乐，希望她能顺利成为那个成功驾驶隧者的人，希望她们能一起去真正的星空……爱弥斯的嘴唇动了动，最终也并未把自己藏在心底深处的那个愿望说出来。她珍惜地摩挲了一下这份礼物，站起身来，笑着扑进朋友们的怀里。
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item3.avif
    物品名称: 纸飞机
    物品含意: 穿越时间的思念
    物品彩蛋: ※ 纸飞机是贯穿时间线的意象，象征着思念与告别
    物品简介: 爱弥斯坐在学院楼栋顶层，悠然地享受微风吹拂。她折过无数纸飞机，但一直记得最初在小屋的那只。午后的光透过窗户照射进来，寒冷的雪和风都被挡在了窗外，只有火炉被烧得劈啪作响的声音。为晚饭炖着的汤散发着甜美醇厚的香气，身边的家人正手指灵巧地为她折出能飞得更远的纸飞机。爱弥斯抬起脸，看到【TA】正微笑着将手中的纸飞机递来。那景象在恍惚的回忆中消逝，眼前仍旧是学院的风景。爱弥斯微微一笑，把手中新折的纸飞机投入风中。
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/food.avif
    物品名称: 超级豹风雪
    物品含意: 飞行雪绒的特调
    物品彩蛋: ※ 小时候，小爱因为把海豹带入家中导致地板湿透，阿漂教训她之后觉得过头买了育儿书籍也在小屋书柜
    物品简介: 轻软甜蜜的雪白冰淇淋浮在深色的咖啡上，雪绒豹豹冰雕正安然地泡在其中。在图书馆熬夜苦读时轻轻饮上一口，苦味已被清甜调和，爽口又提神。爱弥斯参加星炬学院社团饮品创新大赛的获奖之作，据本人称是表达了作者的思乡之情。玩笑话里也有三分真心。在那片冰冷寂静的雪原上，与家人和海豹们玩耍的童年记忆已然相隔遥远，却仍时常停留在她的心头。
---
::
::

#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
| 配置项	     | 类型	                            | 说明                                          |
|--------------|----------------------------------|-----------------------------------------------|
| 物品图像     | string                           | 物品图片（与物品切换图标绑定）                |
| 物品名称     | string                           | 物品名称                                      |
| 物品含义     | string                           | 物品的小标签，说明其中的含义                  |
| 物品彩蛋     | string                           | 物品的小彩蛋，说明该物品在过去或者地方的位置  |
| 物品简介     | string                           | 物品的简介，通常与来历、分量等等有关          |

#tab2
``` md lang="md"
::hero-special
---
heroSpecialList:
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item1.avif
    物品名称: 《太空战士卡佳VI》
    物品含意: 一盘游戏卡带
    物品彩蛋: ※ 官方彩蛋：小屋里面右侧书柜有本《太空战士卡佳VI-星际导航图谱:全星系探索路线与任务图文攻略》
    物品简介: 《太空战士卡佳VI》，在索拉里斯的游戏爱好者中为人津津乐道的经典系列最新作。沉浸式的角色扮演剧情，丰富有趣的战斗系统，体验成为英雄的孤独之旅，结识十数位可招募的个性伙伴，与宇宙中的邪恶势力进行激烈对抗……除了这些部分，作为彩蛋的那个小游戏也是让爱弥斯极为喜欢的部分，她在通关后经常和家人一起在小屋中联机游玩。“哼哼，拼方块的积分排行榜，最后果然还是我排第一！”
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item2.avif
    物品名称: 隧者手办
    物品含意: 友情的证明
    物品彩蛋: ※ 那年之后，朋友们再也看不见她，但每年的歌友会依然在举办
    物品简介: 捂在爱弥斯眼上的那双手移开后，面前摆着的就是这样的一个小盒子。身边的四位好友笑眯眯地怂恿爱弥斯赶紧拆开，盒中的小型隧者手办就这么露了出来。适格者们像是叽叽喳喳的小动物那样祝贺她生日快乐，希望她能顺利成为那个成功驾驶隧者的人，希望她们能一起去真正的星空……爱弥斯的嘴唇动了动，最终也并未把自己藏在心底深处的那个愿望说出来。她珍惜地摩挲了一下这份礼物，站起身来，笑着扑进朋友们的怀里。
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/item3.avif
    物品名称: 纸飞机
    物品含意: 穿越时间的思念
    物品彩蛋: ※ 纸飞机是贯穿时间线的意象，象征着思念与告别
    物品简介: 爱弥斯坐在学院楼栋顶层，悠然地享受微风吹拂。她折过无数纸飞机，但一直记得最初在小屋的那只。午后的光透过窗户照射进来，寒冷的雪和风都被挡在了窗外，只有火炉被烧得劈啪作响的声音。为晚饭炖着的汤散发着甜美醇厚的香气，身边的家人正手指灵巧地为她折出能飞得更远的纸飞机。爱弥斯抬起脸，看到【TA】正微笑着将手中的纸飞机递来。那景象在恍惚的回忆中消逝，眼前仍旧是学院的风景。爱弥斯微微一笑，把手中新折的纸飞机投入风中。
  - 物品图像: /image/PageInternal/Wuthering Waves/ams/Special/food.avif
    物品名称: 超级豹风雪
    物品含意: 飞行雪绒的特调
    物品彩蛋: ※ 小时候，小爱因为把海豹带入家中导致地板湿透，阿漂教训她之后觉得过头买了育儿书籍也在小屋书柜
    物品简介: 轻软甜蜜的雪白冰淇淋浮在深色的咖啡上，雪绒豹豹冰雕正安然地泡在其中。在图书馆熬夜苦读时轻轻饮上一口，苦味已被清甜调和，爽口又提神。爱弥斯参加星炬学院社团饮品创新大赛的获奖之作，据本人称是表达了作者的思乡之情。玩笑话里也有三分真心。在那片冰冷寂静的雪原上，与家人和海豹们玩耍的童年记忆已然相隔遥远，却仍时常停留在她的心头。
---
::
```
::

### 人物故事
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue lang="vue" [heroStories.vue]
<script setup lang="ts">
const props = defineProps<{
  heroStories: Array<{
    内容标题: string
    内容: Record<string, string>
    密钥: number
  }>
  顶部标题: string
}>()

const activeIndex = ref(0)

// 添加过渡动画方向
const slideDirection = ref<'left' | 'right'>('right')

function prevPage() {
  if (props.heroStories.length === 0) return
  if (activeIndex.value > 0) {
    slideDirection.value = 'left'
    activeIndex.value--
  }
}

function nextPage() {
  if (props.heroStories.length === 0) return
  if (activeIndex.value < props.heroStories.length - 1) {
    slideDirection.value = 'right'
    activeIndex.value++
  }
}

// 触摸滑动支持
const touchStartX = ref(0)
const touchEndX = ref(0)

// function handleTouchStart(e: TouchEvent) {
//   touchStartX.value = e.touches[0].clientX
// }

// function handleTouchMove(e: TouchEvent) {
//   touchEndX.value = e.touches[0].clientX
// }

function handleTouchEnd() {
  const diff = touchStartX.value - touchEndX.value
  const threshold = 50 // 最小滑动距离

  if (Math.abs(diff) > threshold) {
    if (diff > 0) {
      nextPage()
    } else {
      prevPage()
    }
  }
  
  touchStartX.value = 0
  touchEndX.value = 0
}
</script>

<template>
  <div class="storiesContainer">
    <div 
      class="storiesMain" 
      v-if="heroStories?.[activeIndex]"
    >
      <!-- 装饰性背景元素 -->
      <div class="decorative-bg">
        <div class="circle circle-1"></div>
        <div class="circle circle-2"></div>
      </div>

      <header class="storiesHeader">
        <div class="header-content">
          <span class="header-icon">📖</span>
          <h2 class="header-title">{{ 顶部标题 || '未写入' }}</h2>
        </div>
      </header>

      <main class="storiesBody">
        <Transition :name="`slide-${slideDirection}`" mode="out-in">
          <div :key="activeIndex" class="content-wrapper">
            <h3 class="storiesTitle">
              <span class="title-decorator"></span>
              {{ heroStories[activeIndex]?.内容标题 }}
            </h3>
            <div class="storiesContent">
              <p 
                class="storiesSpan" 
                v-for="([key, value], index) in Object.entries(heroStories[activeIndex]?.内容 ?? {})"
                :key="key"
                :style="{ animationDelay: `${index * 0.05}s` }"
              >
                {{ value }}
              </p>
            </div>
          </div>
        </Transition>
      </main>

      <footer class="storiesFooter">
        <button 
          class="page-btn prev-btn" 
          @click="prevPage"
          :disabled="activeIndex === 0"
          aria-label="上一页"
        >
          <span class="btn-icon">◀</span>
          <span class="btn-text">上一页</span>
        </button>
        
        <div class="footerPageNumber">
          <span class="current-page">{{ heroStories[activeIndex]?.密钥 }}</span>
          <span class="separator">/</span>
          <span class="total-pages">{{ heroStories.length }}</span>
        </div>
        
        <button 
          class="page-btn next-btn" 
          @click="nextPage"
          :disabled="activeIndex === heroStories.length - 1"
          aria-label="下一页"
        >
          <span class="btn-text">下一页</span>
          <span class="btn-icon">▶</span>
        </button>
      </footer>

      <!-- 进度指示器 -->
      <!-- <div class="progress-dots">
        <span 
          v-for="(story, index) in heroStories.slice(0, 5)" 
          :key="story.密钥"
          class="dot"
          :class="{ active: index === activeIndex }"
          @click="activeIndex = index"
        ></span>
        <span v-if="heroStories.length > 5" class="dot-more">...</span>
      </div> -->
    </div>

    <!-- 空状态 -->
    <div v-else class="empty-state">
      <div class="empty-icon">📚</div>
      <p class="empty-text">暂无故事内容</p>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.storiesContainer {
  margin-top: 24px;
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border-radius: 0.75em;
  padding: 24px;
  transition: all .3s;
  position: relative;
  overflow: hidden;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);

  // 移动端适配
  @media (max-width: 768px) {
    margin-top: 16px;
    padding: 16px;
    border-radius: 0.5em;
  }

  .storiesMain {
    position: relative;
    z-index: 1;

    // 装饰性背景
    .decorative-bg {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      pointer-events: none;
      overflow: hidden;
      opacity: 0.4;
      z-index: 0;

      .circle {
        position: absolute;
        border-radius: 50%;
        background: radial-gradient(circle, var(--pink-core) 0%, transparent 70%);
        opacity: 0.1;
        animation: float 8s ease-in-out infinite;

        &.circle-1 {
          width: 200px;
          height: 200px;
          top: -50px;
          right: -50px;
        }

        &.circle-2 {
          width: 150px;
          height: 150px;
          bottom: -30px;
          left: -30px;
          animation-delay: -4s;
        }
      }
    }

    .storiesHeader {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255, 140, 176, .2);
      margin-bottom: 20px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 12px 16px;
        margin-bottom: 16px;
      }

      .header-content {
        display: flex;
        align-items: center;
        gap: 12px;

        .header-icon {
          font-size: 1.5rem;
          animation: pulse 2s ease-in-out infinite;

          @media (max-width: 768px) {
            font-size: 1.3rem;
          }
        }

        .header-title {
          font-size: 1.3rem;
          color: var(--pink-core);
          margin: 0;
          font-weight: 600;
          letter-spacing: 0.5px;

          @media (max-width: 768px) {
            font-size: 1.1rem;
          }
        }
      }
    }

    .storiesBody {
      padding: 0 20px;
      min-height: 200px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 0 16px;
        min-height: 180px;
      }

      .content-wrapper {
        animation: fadeInContent 0.3s ease-out;
      }

      .storiesTitle {
        font-size: 1.2rem;
        color: var(--blue-glow);
        margin-bottom: 16px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        line-height: 1.4;

        @media (max-width: 768px) {
          font-size: 1.05rem;
          margin-bottom: 12px;
        }

        .title-decorator {
          width: 4px;
          height: 1.2em;
          background: linear-gradient(to bottom, var(--blue-glow), var(--pink-core));
          border-radius: 2px;
          flex-shrink: 0;
        }
      }

      .storiesContent {
        .storiesSpan {
          display: block;
          margin-bottom: 12px;
          line-height: 1.8;
          color: var(--c-text);
          font-size: 0.95rem;
          opacity: 0;
          animation: fadeInUp 0.4s ease-out forwards;

          @media (max-width: 768px) {
            font-size: 0.9rem;
            line-height: 1.7;
            margin-bottom: 10px;
          }

          &:last-child {
            margin-bottom: 0;
          }
        }
      }
    }

    .storiesFooter {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-top: 1px solid rgba(255, 140, 176, .2);
      margin-top: 20px;
      position: relative;
      z-index: 1;

      @media (max-width: 768px) {
        padding: 12px 16px;
        margin-top: 16px;
        gap: 8px;
      }

      .page-btn {
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 8px 16px;
        border: 1px solid var(--c-border);
        background: transparent;
        color: var(--blue-glow);
        border-radius: 6px;
        cursor: pointer;
        transition: all 0.3s ease;
        font-size: 0.9rem;
        font-weight: 500;

        @media (max-width: 768px) {
          padding: 6px 12px;
          font-size: 0.85rem;
          gap: 4px;
        }

        .btn-icon {
          transition: transform 0.3s ease;
        }

        .btn-text {
          @media (max-width: 480px) {
            display: none;
          }
        }

        &:hover:not(:disabled) {
          background: var(--blue-glow);
          color: white;
          border-color: var(--blue-glow);
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);

          .btn-icon {
            transform: scale(1.2);
          }
        }

        &:active:not(:disabled) {
          transform: translateY(0);
        }

        &:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        &.prev-btn .btn-icon {
          &:hover {
            transform: translateX(-3px);
          }
        }

        &.next-btn .btn-icon {
          &:hover {
            transform: translateX(3px);
          }
        }
      }

      .footerPageNumber {
        display: flex;
        align-items: center;
        gap: 6px;
        color: var(--blue-glow);
        font-weight: 600;
        font-size: 1rem;

        @media (max-width: 768px) {
          font-size: 0.9rem;
        }

        .current-page {
          font-size: 1.2em;
          color: var(--pink-core);
        }

        .separator {
          opacity: 0.5;
        }

        .total-pages {
          opacity: 0.7;
        }
      }
    }

    // 进度指示器
    .progress-dots {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 8px;
      padding: 12px 0 0;
      position: relative;
      z-index: 1;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--c-border);
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: var(--blue-glow);
          transform: scale(1.3);
        }

        &.active {
          background: var(--pink-core);
          width: 24px;
          border-radius: 4px;
          transform: scale(1);
        }
      }

      .dot-more {
        color: var(--c-border);
        font-weight: bold;
        padding: 0 4px;
      }
    }
  }

  // 空状态
  .empty-state {
    text-align: center;
    padding: 60px 20px;
    color: var(--c-text);
    opacity: 0.6;

    @media (max-width: 768px) {
      padding: 40px 20px;
    }

    .empty-icon {
      font-size: 3rem;
      margin-bottom: 16px;
      animation: pulse 2s ease-in-out infinite;

      @media (max-width: 768px) {
        font-size: 2.5rem;
      }
    }

    .empty-text {
      font-size: 1rem;
      margin: 0;
    }
  }
}

// 过渡动画
.slide-right-enter-active,
.slide-right-leave-active,
.slide-left-enter-active,
.slide-left-leave-active {
  transition: all 0.3s ease;
}

.slide-right-enter-from {
  opacity: 0;
  transform: translateX(30px);
}

.slide-right-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-enter-from {
  opacity: 0;
  transform: translateX(-30px);
}

.slide-left-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

// 关键帧动画
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeInContent {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.8;
    transform: scale(1.05);
  }
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(10px, -10px) scale(1.05);
  }
  66% {
    transform: translate(-10px, 10px) scale(0.95);
  }
}
</style>
```

#tab2
::hero-stories
---
heroStories:
  - 内容标题: 在雪原上
    内容: 
      内容1: 雪落在爱弥斯的鼻尖上，湿润的凉意让她感觉有些痒痒的，她盯着湖面看了一会儿，最终还是决定放弃玩水的打算。
      内容2: 前段时间，她耗费心思努力从湖里面捞出来了几根硕大的狐尾蒲藻当做武器，和冰原上的雪绒海豹们玩耍。在这场大战中她扮演英雄，海豹们扮演坏蛋——考虑到这群慵懒温和的生物爬行速度很慢，基本都是爱弥斯大获全胜。可惜那次玩过了头，狐尾蒲藻的碎块使小屋狼藉满地，那个人回家之后，在门口沉默了很久。
      内容3: 自然，爱弥斯挨了一顿训。
      内容4: 事后那个人似乎对此有些愧疚，觉得自己对孩子凶过了头，又买了一堆卡带作为补偿和应对措施。这招相当有效，电子游戏的魅力迅速俘虏了爱弥斯，她就暂时把在现实里大战的事儿抛之脑后了。而在所有的卡带里，她最喜欢的是《太空战士卡佳》系列。在宇宙中一边旅行一边拯救世界？太棒了！谁不想扮演一个忧郁、帅气又意志坚定的英雄呢？
      内容5: 爱弥斯推开门，那个人正坐在沙发上看书，她高高兴兴地挤过去，举起手柄。和我玩！女孩的动作传达着这一讯号，于是对方笑着刮了刮女孩的鼻尖，欣然应允。
      冬日漫长，但此刻炉火燃烧，一切都温暖平静。
      内容6: 游戏进行了一段时间，爱弥斯说，今天的任务就做到这里吧，我和你说，我在地图右侧找到了一个隐藏房间呢！密码是9072，开门之后可以玩拉海洛方块，可好玩儿了。那个人问，爱弥斯，你不是昨天还着急继续推任务拯救世界吗？对，她摇晃着脑袋笑着说，但今天我又不想了……而且，要是任务做完了，游戏也就结束了……我还想和你一起玩更久呢。就算是拯救世界，也是需要休息的，对吧？你要学会劳逸结合啦！
      内容7: 那只温暖的手揉了揉她的发顶，带着一丝奇妙的感慨低声道：你说得对，爱弥斯。我会试着这么做的。
      内容8: 那……要从现在做起噢？
      内容9: 好，从现在做起。那个人笑了笑。其实……现在我在这里，已经算是在休息。来吧，我们玩拉海洛方块，你先。
    密钥: 1
  - 内容标题: 年轻人们
    内容: 
      内容1: 虚质逆向工程学的成绩出分的下午，爱弥斯和她的朋友们例常的午饭时间一片愁云惨淡。
      内容2: 埃拉拉一头鲜艳的红发都有些黯淡，虚弱地哀鸣着，啊，连食堂的饭都不香了……！在她身边认真咀嚼一碗不明物质的诺娃则说，朋友，虽然这分数的确让人难受，但我们不能本末倒置——这食堂的饭它本来也不香啊。琳正因为分数大受打击，塞莱斯特在温声安慰她，爱弥斯则以神游天外的表情吸了一口她特调过口味的嘻嘻果冻，和身边几位关系融洽的适格者们进行着漫谈。
      内容3: 埃拉拉突然扭头看她：爱弥斯！你、你一点都不着急吗？
      内容4: 她眨巴眼睛：着急什么？……啊，分数？但这次大家成绩不都差不多嘛，萨迦教授判分太严格啦，又不是大家真的不行，没事没事。说到一半，爱弥斯拿出纸巾递给她们中性格最柔软的那位。啊，小琳，擦擦泪——！
      内容5: 塞莱斯特接了过去，和其他几个人对视一眼，轻声道：你好像不太在意作为适格者的未来。
      内容6: 她平常会怎么说呢？大约会找几个话题打打闹闹地糊弄过去，但今天是那个人的生日，爱弥斯正在思念对方，因此有些忘记在朋友们前掩饰情绪。适格者……也只是一种可能性嘛，她语调平淡地说，比起这个，有人曾说更希望我能轻松快乐地生活，我也觉得这样比较好。我的理想没有大家那么厉害啦，懒散的人松弛点也很正常吧？
      内容7: 真的吗？朋友们望着她的眼睛问。
      内容8: 爱弥斯只是回以微笑：真的。
      内容9: 但并非如此，只是因为那个理想太过沉重、太过傲慢、太过荒谬，因此不能在平稳的词句中被宣之于口。它每一日都比前一日成长得更加膨大，在爱弥斯的心灵中扎入根须，但她视之不见，因为她已经接受了那句嘱托。如果日复一日的快乐就是好的，那就让她这么一直快乐下去吧！她会信守承诺，除非……
      内容10: 思绪被打断，埃拉拉在她的脸颊上狠狠捏了一把。
      内容11: 怎么啦？爱弥斯皱着脸含混不清地说道。
      内容12: 心口不一的坏人，她的朋友抱怨道，好了好了不问你了，下午图书馆复习一起去吗？
      内容13: 她点头道：当然~
      内容14: 爱弥斯笑着和朋友们打闹作一团，慢悠悠走向电梯。她们都还很年轻，并不急于一时去寻找答案，在这所满载着天才的学院中，拥有无限可能的未来。
    密钥: 2
  - 内容标题: 唯不可见者可见
    内容: 
      内容1: 爱弥斯走到镜子前，镜面并未映照出她的影子。
      内容2: 在她死后，整个世界就与之错开了。适格者们曾讨论过人的本质是什么，埃拉拉说是爱，诺娃说是记忆，塞莱斯特说是自我，琳说是信仰……不对，爱弥斯想，人的本质是频率。以她现在的情况而言，她只能这么去理解。是因为和隧者共鸣，因此她的存在性质也被改变了？她的躯体已经在模拟驾驶舱中被撕碎，她应该死了，却仍旧存在……不过，她现在已经不再去想存在的本质是什么这种问题了。尽管对一个电子幽灵而言，漫长的时间足够去思考任何问题。
      内容3: 但爱弥斯现在知道了更重要的事。
      内容4: 在她进入高悬天际的隧者炉芯后，她看到了藏在其中的那条讯息。
      内容5: 原来是这样，她想，原来是这样。所以这条讯息从未被读到，因为在最初它就已经被放置在了无法被查阅的地方，只有此时身为隧者共鸣者的她才能看见。整个地下空洞都仰赖着这“太阳”生存，拉海洛人自然不会有机会知晓。她该高兴吗？以这条讯息的内容而言，她将有机会实现自己的愿景——但这的确又像个阴差阳错的玩笑，因为那并不是她想象中的实现方式。可这是只有她能做到的事。
      内容6: 如果有我能做的事，我就会去做。
      内容7: ……对，是该这样。爱弥斯想起那个人，在心里为自己加油。她觉得自己可以再勇敢些，再坚定些。当然，现在还不够，但没关系，还有时间去做准备。从这方面而言，她已经受到了命运的优待。想着想着，她不禁轻轻哼起歌来。可惜，飞行雪绒的曲子没法再更新了，如果能预料到明天，她会写完那首歌的。
      内容8: 镜面没有映出她的面孔，因此爱弥斯并未看到，她脸上的微笑像是被一划被蜡笔涂歪的痕迹，在末端戛然而止。
    密钥: 3
  - 内容标题: 问我何所惧，问我何所忧
    内容: 
      内容1: 寂静。
      内容2: 她转过身，看到了那只“眼睛”。啊，是的，形似眼睛，但爱弥斯知道那不是。黑洞？也许人类可以用自己所知的东西去这么称呼，但在她的眼中，在已经与隧者共鸣的她眼中，那是某种在不断漫溢发生的“现象”。被其吞噬和笼罩的东西失去存在，深空联合称其为虚质——那就这么叫吧，对于处在比之更低维度的生物而言，总要有个称呼。这就和人类叫它“阿列夫一”是同样的道理。
      内容3: 爱弥斯已经不止一次和它“对视”了。对于在虚质空间和外部不断往返的她而言，这是必然会遭遇的事，只能习惯。
      内容4: 直到前不久为止，她都还是会受到一定的影响。虚无，对死亡的渴望，无意义，寂静的宇宙……凝视阿列夫一带来的负面影响，就连身为死者的她都难以避免。但现在，在爱弥斯于那被吞噬的文明的残骸中探索后，她看着那只巨大的，超越了时间与空间的眼睛，只听到了自己趋近疯狂的大笑声。
      这就是那个人一直追寻的东西吗？笑声从她的喉咙中沉闷地响起。这就是真相？
      内容5: 真荒谬。
      内容6: 一切自年幼时萌发的愿景和理想，意义都因此消解。爱弥斯忽然觉得很累，但在疲惫之后，又有一丝萦绕不去的伤心和担忧钻进她的心魂。那个人该怎么办呢？那个人知道这些事吗？如果知道，爱弥斯不敢想象对方一直以来是抱持着何种感情在世间行走。如果不知道……那她就应该把这一切都藏起来，都砸碎，都销毁……她的心中一半是冰冷的担忧，一半是燃烧的怒火。生平第一次，她知晓了何为仇恨。
      内容7: 那只被爱弥斯造出的纸飞机幻影，在她的掌心被揉皱成一团纸屑，落向无尽的虚空。
    密钥: 4
  - 内容标题: 一切未曾说出的
    内容: 
      内容1: 爱弥斯慢慢踏着楼梯向上，回到了桌边。
      内容2: 因为刚才那个梦醒来后，她也睡不着了。事实上，她本就无需睡眠，梦也更像是记忆以另一种形式进行重播。明天她和【TA】就会抵达隧者脚下，她不太确定会发生什么，因此想要做好准备。
      内容3: 话语是意义的准备，因此她想把一些想和【TA】说，却在此刻还无法宣之于口的话记录来下。
      内容4: 该说些什么好呢？也许应该把这么多年发生的事情，都告诉对方。大事小事，欢乐和忧伤，无关紧要的一切，关系世界命运的一切……或者，也可以小小的责备对方一下，因为时间已经过去了很久，对方缺席了太久，她要分享的东西也堆积得太多。如果这些都不太对，那么就把这次公路片之旅画下来，就像以前那样。她说了又删，删了又说，最后只留下了一小段内容。
      内容5: “我知道，只要抬头，那颗星总能找到我。”
      内容6: 爱弥斯在房间中的电子设备里留下了这段话，等待它在更久一些之后的时间被发现，或者永远不被发现。
      内容7: 此刻，她也的确没有更多想要的东西了。
      内容8: 【TA】现在看起来还挺快乐的，这比任何事都要好。如果可以，那就永远隐瞒下去吧，只要那个人能得到幸福，其他事情她都可以付之一笑。她可以做个自私的人，也可以做个无私的人，可面对家人，人难免都会护短，爱弥斯也不能免俗。真相又有什么重要的呢？
      内容9: 只要【TA】能自由而快乐地活着就好。
      内容10: 爱弥斯想着想着，忽然意识到这和过去束缚过她的那句嘱托并无区别。她忍不住笑了一下。此刻万籁俱寂，雪无声地落在天地间，于消融前等待着春日的降临。
    密钥: 5
顶部标题: 爱弥斯纪事 · 远航星
---
::
::
#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
hero-stories属性
| 配置项	     | 类型	                            | 说明                                          |
|--------------|----------------------------------|-----------------------------------------------|
| 顶部标题     | string                           | 组件标题显示                                  |
| heroStories  | heroStories[]                    | 组件全局信息                                  |

heroStories属性
| 配置项	     | 类型	                            | 说明                                          |
|--------------|----------------------------------|-----------------------------------------------|
| 内容标题     | string                           | 内容整体标题                                  |
| 内容         | Record<string, string>           | 内容填入显示                                  |

#tab2
``` md lang="md"
::hero-stories
---
heroStories:
  - 内容标题: 在雪原上
    内容: 
      内容1: 雪落在爱弥斯的鼻尖上，湿润的凉意让她感觉有些痒痒的，她盯着湖面看了一会儿，最终还是决定放弃玩水的打算。
      内容2: 前段时间，她耗费心思努力从湖里面捞出来了几根硕大的狐尾蒲藻当做武器，和冰原上的雪绒海豹们玩耍。在这场大战中她扮演英雄，海豹们扮演坏蛋——考虑到这群慵懒温和的生物爬行速度很慢，基本都是爱弥斯大获全胜。可惜那次玩过了头，狐尾蒲藻的碎块使小屋狼藉满地，那个人回家之后，在门口沉默了很久。
      内容3: 自然，爱弥斯挨了一顿训。
      内容4: 事后那个人似乎对此有些愧疚，觉得自己对孩子凶过了头，又买了一堆卡带作为补偿和应对措施。这招相当有效，电子游戏的魅力迅速俘虏了爱弥斯，她就暂时把在现实里大战的事儿抛之脑后了。而在所有的卡带里，她最喜欢的是《太空战士卡佳》系列。在宇宙中一边旅行一边拯救世界？太棒了！谁不想扮演一个忧郁、帅气又意志坚定的英雄呢？
      内容5: 爱弥斯推开门，那个人正坐在沙发上看书，她高高兴兴地挤过去，举起手柄。和我玩！女孩的动作传达着这一讯号，于是对方笑着刮了刮女孩的鼻尖，欣然应允。
      冬日漫长，但此刻炉火燃烧，一切都温暖平静。
      内容6: 游戏进行了一段时间，爱弥斯说，今天的任务就做到这里吧，我和你说，我在地图右侧找到了一个隐藏房间呢！密码是9072，开门之后可以玩拉海洛方块，可好玩儿了。那个人问，爱弥斯，你不是昨天还着急继续推任务拯救世界吗？对，她摇晃着脑袋笑着说，但今天我又不想了……而且，要是任务做完了，游戏也就结束了……我还想和你一起玩更久呢。就算是拯救世界，也是需要休息的，对吧？你要学会劳逸结合啦！
      内容7: 那只温暖的手揉了揉她的发顶，带着一丝奇妙的感慨低声道：你说得对，爱弥斯。我会试着这么做的。
      内容8: 那……要从现在做起噢？
      内容9: 好，从现在做起。那个人笑了笑。其实……现在我在这里，已经算是在休息。来吧，我们玩拉海洛方块，你先。
    密钥: 1
  - 内容标题: 年轻人们
    内容: 
      内容1: 虚质逆向工程学的成绩出分的下午，爱弥斯和她的朋友们例常的午饭时间一片愁云惨淡。
      内容2: 埃拉拉一头鲜艳的红发都有些黯淡，虚弱地哀鸣着，啊，连食堂的饭都不香了……！在她身边认真咀嚼一碗不明物质的诺娃则说，朋友，虽然这分数的确让人难受，但我们不能本末倒置——这食堂的饭它本来也不香啊。琳正因为分数大受打击，塞莱斯特在温声安慰她，爱弥斯则以神游天外的表情吸了一口她特调过口味的嘻嘻果冻，和身边几位关系融洽的适格者们进行着漫谈。
      内容3: 埃拉拉突然扭头看她：爱弥斯！你、你一点都不着急吗？
      内容4: 她眨巴眼睛：着急什么？……啊，分数？但这次大家成绩不都差不多嘛，萨迦教授判分太严格啦，又不是大家真的不行，没事没事。说到一半，爱弥斯拿出纸巾递给她们中性格最柔软的那位。啊，小琳，擦擦泪——！
      内容5: 塞莱斯特接了过去，和其他几个人对视一眼，轻声道：你好像不太在意作为适格者的未来。
      内容6: 她平常会怎么说呢？大约会找几个话题打打闹闹地糊弄过去，但今天是那个人的生日，爱弥斯正在思念对方，因此有些忘记在朋友们前掩饰情绪。适格者……也只是一种可能性嘛，她语调平淡地说，比起这个，有人曾说更希望我能轻松快乐地生活，我也觉得这样比较好。我的理想没有大家那么厉害啦，懒散的人松弛点也很正常吧？
      内容7: 真的吗？朋友们望着她的眼睛问。
      内容8: 爱弥斯只是回以微笑：真的。
      内容9: 但并非如此，只是因为那个理想太过沉重、太过傲慢、太过荒谬，因此不能在平稳的词句中被宣之于口。它每一日都比前一日成长得更加膨大，在爱弥斯的心灵中扎入根须，但她视之不见，因为她已经接受了那句嘱托。如果日复一日的快乐就是好的，那就让她这么一直快乐下去吧！她会信守承诺，除非……
      内容10: 思绪被打断，埃拉拉在她的脸颊上狠狠捏了一把。
      内容11: 怎么啦？爱弥斯皱着脸含混不清地说道。
      内容12: 心口不一的坏人，她的朋友抱怨道，好了好了不问你了，下午图书馆复习一起去吗？
      内容13: 她点头道：当然~
      内容14: 爱弥斯笑着和朋友们打闹作一团，慢悠悠走向电梯。她们都还很年轻，并不急于一时去寻找答案，在这所满载着天才的学院中，拥有无限可能的未来。
    密钥: 2
  - 内容标题: 唯不可见者可见
    内容: 
      内容1: 爱弥斯走到镜子前，镜面并未映照出她的影子。
      内容2: 在她死后，整个世界就与之错开了。适格者们曾讨论过人的本质是什么，埃拉拉说是爱，诺娃说是记忆，塞莱斯特说是自我，琳说是信仰……不对，爱弥斯想，人的本质是频率。以她现在的情况而言，她只能这么去理解。是因为和隧者共鸣，因此她的存在性质也被改变了？她的躯体已经在模拟驾驶舱中被撕碎，她应该死了，却仍旧存在……不过，她现在已经不再去想存在的本质是什么这种问题了。尽管对一个电子幽灵而言，漫长的时间足够去思考任何问题。
      内容3: 但爱弥斯现在知道了更重要的事。
      内容4: 在她进入高悬天际的隧者炉芯后，她看到了藏在其中的那条讯息。
      内容5: 原来是这样，她想，原来是这样。所以这条讯息从未被读到，因为在最初它就已经被放置在了无法被查阅的地方，只有此时身为隧者共鸣者的她才能看见。整个地下空洞都仰赖着这“太阳”生存，拉海洛人自然不会有机会知晓。她该高兴吗？以这条讯息的内容而言，她将有机会实现自己的愿景——但这的确又像个阴差阳错的玩笑，因为那并不是她想象中的实现方式。可这是只有她能做到的事。
      内容6: 如果有我能做的事，我就会去做。
      内容7: ……对，是该这样。爱弥斯想起那个人，在心里为自己加油。她觉得自己可以再勇敢些，再坚定些。当然，现在还不够，但没关系，还有时间去做准备。从这方面而言，她已经受到了命运的优待。想着想着，她不禁轻轻哼起歌来。可惜，飞行雪绒的曲子没法再更新了，如果能预料到明天，她会写完那首歌的。
      内容8: 镜面没有映出她的面孔，因此爱弥斯并未看到，她脸上的微笑像是被一划被蜡笔涂歪的痕迹，在末端戛然而止。
    密钥: 3
  - 内容标题: 问我何所惧，问我何所忧
    内容: 
      内容1: 寂静。
      内容2: 她转过身，看到了那只“眼睛”。啊，是的，形似眼睛，但爱弥斯知道那不是。黑洞？也许人类可以用自己所知的东西去这么称呼，但在她的眼中，在已经与隧者共鸣的她眼中，那是某种在不断漫溢发生的“现象”。被其吞噬和笼罩的东西失去存在，深空联合称其为虚质——那就这么叫吧，对于处在比之更低维度的生物而言，总要有个称呼。这就和人类叫它“阿列夫一”是同样的道理。
      内容3: 爱弥斯已经不止一次和它“对视”了。对于在虚质空间和外部不断往返的她而言，这是必然会遭遇的事，只能习惯。
      内容4: 直到前不久为止，她都还是会受到一定的影响。虚无，对死亡的渴望，无意义，寂静的宇宙……凝视阿列夫一带来的负面影响，就连身为死者的她都难以避免。但现在，在爱弥斯于那被吞噬的文明的残骸中探索后，她看着那只巨大的，超越了时间与空间的眼睛，只听到了自己趋近疯狂的大笑声。
      这就是那个人一直追寻的东西吗？笑声从她的喉咙中沉闷地响起。这就是真相？
      内容5: 真荒谬。
      内容6: 一切自年幼时萌发的愿景和理想，意义都因此消解。爱弥斯忽然觉得很累，但在疲惫之后，又有一丝萦绕不去的伤心和担忧钻进她的心魂。那个人该怎么办呢？那个人知道这些事吗？如果知道，爱弥斯不敢想象对方一直以来是抱持着何种感情在世间行走。如果不知道……那她就应该把这一切都藏起来，都砸碎，都销毁……她的心中一半是冰冷的担忧，一半是燃烧的怒火。生平第一次，她知晓了何为仇恨。
      内容7: 那只被爱弥斯造出的纸飞机幻影，在她的掌心被揉皱成一团纸屑，落向无尽的虚空。
    密钥: 4
  - 内容标题: 一切未曾说出的
    内容: 
      内容1: 爱弥斯慢慢踏着楼梯向上，回到了桌边。
      内容2: 因为刚才那个梦醒来后，她也睡不着了。事实上，她本就无需睡眠，梦也更像是记忆以另一种形式进行重播。明天她和【TA】就会抵达隧者脚下，她不太确定会发生什么，因此想要做好准备。
      内容3: 话语是意义的准备，因此她想把一些想和【TA】说，却在此刻还无法宣之于口的话记录来下。
      内容4: 该说些什么好呢？也许应该把这么多年发生的事情，都告诉对方。大事小事，欢乐和忧伤，无关紧要的一切，关系世界命运的一切……或者，也可以小小的责备对方一下，因为时间已经过去了很久，对方缺席了太久，她要分享的东西也堆积得太多。如果这些都不太对，那么就把这次公路片之旅画下来，就像以前那样。她说了又删，删了又说，最后只留下了一小段内容。
      内容5: “我知道，只要抬头，那颗星总能找到我。”
      内容6: 爱弥斯在房间中的电子设备里留下了这段话，等待它在更久一些之后的时间被发现，或者永远不被发现。
      内容7: 此刻，她也的确没有更多想要的东西了。
      内容8: 【TA】现在看起来还挺快乐的，这比任何事都要好。如果可以，那就永远隐瞒下去吧，只要那个人能得到幸福，其他事情她都可以付之一笑。她可以做个自私的人，也可以做个无私的人，可面对家人，人难免都会护短，爱弥斯也不能免俗。真相又有什么重要的呢？
      内容9: 只要【TA】能自由而快乐地活着就好。
      内容10: 爱弥斯想着想着，忽然意识到这和过去束缚过她的那句嘱托并无区别。她忍不住笑了一下。此刻万籁俱寂，雪无声地落在天地间，于消融前等待着春日的降临。
    密钥: 5
顶部标题: 爱弥斯纪事 · 远航星
---
::
```
::

### 时间线&彩蛋
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroTimelineEaster.vue] lang="vue"
<script setup lang="ts">
import Title from '../card/title.vue';
import Badge from './Badge.vue';

defineProps<{
  类型?: '爱弥斯' | '尤诺'
  顶部?: {
    标题?: string
    副标题?: string
  }
  时间线?: Array<{
    标签: string | Record<string, string>
    信息: Record<string, string>
  }>
  彩蛋?: Array<{
    图标?: string
    标题?: string
    副标题?: string
    信息?: { 上部分: string, 重要部分: string, 下部分: string, 显示: "YES" | "NO"}
    简介?: string | Record<string, string>
    提示?: Array<{
      图标?: string
      内容?: string
    }>
  }>
}>()
</script>

<template>
  <div class="heroTimelineEasterMain">
    <div class="heroTimelineEasterCard">
      <div class="timelineEasterHeader">
        <Title :title="顶部?.标题" />
        <Badge :text="顶部?.副标题" />
      </div>
      
      <!-- 时间线部分 - 修复为两列布局 -->
      <div class="heroTimelineList">
        <div class="heroTimelineMain" v-for="(main, index) in 时间线" :key="index">
          <div class="heroTimelineCard" v-for="([key, value]) in Object.entries(main.信息 ?? {})" :key="key">
            <div class="heroTimelineLabel">
              {{ key }}<Badge :text="main.标签" />
            </div>
            <div class="heroTimelineValue">{{ value }}</div>
          </div>
        </div>
      </div>

      <div class="heroEaster" v-for="main in 彩蛋" :id="类型">
        <div class="easterHeader">
          <span v-show="类型 === '爱弥斯'" class="easterIcon" id="ams">{{ main.图标 }}</span>
          <span class="esterTitle">{{ main.标题 }}</span>
        </div>
        <div class="easterContent" v-show="类型 === '爱弥斯'">
          <p v-if="类型 === '爱弥斯'" class="easterP">
            {{ main.信息?.上部分 }} <Badge v-show="main.信息?.显示 === 'YES'" :text="main.信息?.重要部分" /> {{ main.信息?.下部分 }}
          </p>
          <p class="easterP">
            {{ main.简介 }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heroTimelineEasterMain {
  width: 100%;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  display: flex;

  .heroTimelineEasterCard {
    flex: 1;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;

    .timelineEasterHeader {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
    }

    /* 修复时间线布局 - 一行两列 */
    .heroTimelineList {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      
      .heroTimelineMain {
        display: grid;
        gap: 0.4rem;
        padding: 0;
        
        .heroTimelineCard {
          display: flex;
          flex-direction: column;
          margin: 0.5em 0;
          
          .heroTimelineLabel {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            color: var(--c-text-2);
            font-size: 0.8rem;
            font-weight: 500;
          }
          
          .heroTimelineValue {
            color: var(--c-text);
            font-size: 0.8rem;
            word-break: break-word;
          }
        }
      }
    }
    .heroEaster {
      background-color: var(--c-bg-soft);
      border-radius: 0.4em;
      color: var(--c-text-soft);
      font-size: 1em;
      padding: 0.5em 0.6em;
      transition: all 0.2s;
      .easterHeader {
        display: flex;
        align-items: center;
        // gap: 8px;
        // margin-bottom: 8px;
        font-size: 0.9em;
        .easterIcon {
          font-size: 0.9em;
        }
        .easterTitle {
          font-weight: 700;
          font-size: 0.9em;
        }
      }
      .easterContent {
        font-size: 0.9em;
        .easterP {
          margin: 0;
        }
      }
    }
  }
}
// 外置样式
.heroEaster#爱弥斯 {
  background: #ff8cb00d;
  border: 1px dashed var(--pink-core);
}
</style>
```
#tab2
::hero-timeline-easter
---
类型: '爱弥斯'
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: EMS-DATA
时间线:
  - 标签: 2.8版本
    信息:
      伏笔埋下: “那一晚上的失忆以及手的虚化”埋下爱弥斯相关伏笔
  - 标签: 3.0版本
    信息:
      初次登场: 第一次相遇即是告别
  - 标签: 3.1版本
    信息:
      真相揭晓: “我不后悔，但还是...好舍不得你”
  - 标签: 时间闭环
    信息:
      因果循环: “...别...难过...”
彩蛋:
  - 标题: 官方彩蛋 · 摩斯密码
    信息: 
      上部分: 官方OST《以虚无紧系因果》中隐藏摩斯密码，截取后翻译为
      重要部分: BCAKHOME
      下部分: —— “回家”
      显示: YES
  - 标题: 飞行雪绒 · 爱弥斯个人账号
    简介: 爱弥斯生前以“飞行雪绒”为网名分享原创歌曲，歌友会每年都会筹办
---
::
::
#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1

#tab2
``` md lang="md"
::hero-timeline-easter
---
类型: '爱弥斯'
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: EMS-DATA
时间线:
  - 标签: 2.8版本
    信息:
      伏笔埋下: “那一晚上的失忆以及手的虚化”埋下爱弥斯相关伏笔
  - 标签: 3.0版本
    信息:
      初次登场: 第一次相遇即是告别
  - 标签: 3.1版本
    信息:
      真相揭晓: “我不后悔，但还是...好舍不得你”
  - 标签: 时间闭环
    信息:
      因果循环: “...别...难过...”
彩蛋:
  - 标题: 官方彩蛋 · 摩斯密码
    信息: 
      上部分: 官方OST《以虚无紧系因果》中隐藏摩斯密码，截取后翻译为
      重要部分: BCAKHOME
      下部分: —— “回家”
      显示: YES
  - 标题: 飞行雪绒 · 爱弥斯个人账号
    简介: 爱弥斯生前以“飞行雪绒”为网名分享原创歌曲，歌友会每年都会筹办
---
::
```
::

## 更新日志
**V20260225-pre**
- 1.添加全新模块，并且更新了新模块的配置
- 2.更新全部模块的样式，并且使用复合型TS配置项`部分`
- 3.更新文章中旧配置项，并且出现写入配置项
- 4.更新部分模块中的显隐逻辑
- 5.浓缩部分新模块配置项
- 6.部分模块即将完工

**V20260224-pre**
- 1.更新了相关配置项的使用方式
- 2.更新了模块在文章中的写法

**V20260223-pre**
- 1.更新基础模块，并且优化部分逻辑
- 2.更新一些配置项，取消部分未使用的样式