---
title: 【鸣潮】档案文章组件
description: 该文章展示多个以鸣潮为主题的档案组件，包含具体代码、属性表格对应、预览整体组件、写法展示四种类型，并在文章末尾附加更新报告。
date: 2026-02-20 10:00:00
updated: 2026-02-26 10:00:00
image: /image/PostCover/WutheringWavesPostWidget.avif
categories: [站点魔改]
tags:
  - Nuxt
  - 魔改
  - 美化
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

// ==================== 类型定义 ====================
interface Props {
  类型: '爱弥斯' | '尤诺' | '奥古斯塔';
  头像: string;
  徽章: Record<string, string>;
  名字: string;
  标签: Record<string, string>;
  简介: string[];
  详情信息: Record<string, string>;
  档案: {
    具体信息: Array<{
      序号: number;
      徽章: string;
    }>;
    外挂信息: {
      简介: string[];
    };
    顶栏信息: {
      主标题: string;
    };
  };
}

const props = defineProps<Props>();

// ==================== 计算属性 ====================
const getInfoGridColumns = (type: string): number => {
  const columnMap: Record<string, number> = {
    爱弥斯: 4,
    尤诺: 3,
    奥古斯塔: 3,
  };
  return columnMap[type] || 3;
};
</script>

<template>
  <div class="hero-main">
    <div class="hero-card">
      <!-- ==================== 左侧头像区 ==================== -->
      <div class="left-info">
        <NuxtImg class="avatar-image" :src="头像" />
        <h3 class="avatar-name">{{ 名字 }}</h3>
        <div class="avatar-meta">
          <span
            v-for="[key, value] in Object.entries(徽章 ?? {})"
            :key="key"
            class="meta-tag"
          >
            {{ key }}:{{ value }}
          </span>
        </div>
      </div>

      <!-- ==================== 右侧内容区 ==================== -->
      <div class="right-info">
        <div class="panel-main">
          <!-- 简介 -->
          <Title title="简介" />
          <div class="hero-desc">
            <slot name="desc" />
          </div>

          <!-- 标签 -->
          <Title title="标签" />
          <div class="tag-container">
            <span
              v-for="[key, value] in Object.entries(标签 ?? {})"
              :key="key"
              class="tag"
            >
              #{{ value }}
            </span>
          </div>

          <!-- 详情信息 -->
          <Title title="详情信息" />
          <div
            class="info-grid"
            :style="{ gridTemplateColumns: `repeat(${getInfoGridColumns(类型)}, 1fr)` }"
          >
            <div
              v-for="[key, value] in Object.entries(详情信息 ?? {})"
              :key="key"
              class="info-item"
            >
              <div class="info-label">{{ key }}</div>
              <div class="info-value">{{ value }}</div>
            </div>
          </div>

          <!-- 档案 -->
          <Title :title="档案?.顶栏信息.主标题" />
          <div
            v-for="data in 档案?.具体信息"
            :key="data.序号"
            class="status-card"
            :class="`type-${类型}`"
          >
            <div class="status-header">
              <div
                v-for="(item, index) in 档案.外挂信息.简介 ?? []"
                v-show="data.序号 === index + 1"
                :key="index"
                class="header-title"
              >
                {{ item }}
              </div>
              <div
                v-if="类型 === '爱弥斯'"
                class="header-badge"
                :class="`badge-${data.序号}`"
              >
                {{ data.徽章 }}
              </div>
            </div>
            <div class="status-content">
              <div
                v-for="statusIndex in 档案?.外挂信息.简介.length"
                v-show="data.序号 === statusIndex"
                :key="statusIndex"
              >
                <slot :name="`status${statusIndex}`" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
/* ==================== 主容器样式(保持原样) ==================== */
.hero-main {
  width: 100%;
  height: 320px;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.3s ease;
  display: flex;
}

.hero-card {
  flex: 1;
  display: flex;
  gap: 1rem;
  padding: 1rem;
  overflow: hidden;
}

/* ==================== 左侧头像区(保持原样) ==================== */
.left-info {
  position: relative;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 200px;
  padding: 12px;
  border-radius: 16px;
  border: 2px solid transparent;
  background-clip: padding-box;
  transition: all 0.3s;
  overflow: hidden;

  .avatar-image {
    width: 100%;
    height: auto;
    border-radius: 12px;
    display: block;
  }

  .avatar-name {
    margin-top: 8px;
    font-size: 14px;
    font-weight: 700;
    text-align: center;
    color: var(--c-text);
  }

  .avatar-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: center;
    margin-top: 4px;

    .meta-tag {
      font-size: 12px;
      font-weight: 600;
      color: var(--c-text-sub);
      background: rgba(255, 140, 176, 0.1);
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid var(--pink-core);
    }
  }
}

/* ==================== 右侧内容区(保持原样) ==================== */
.right-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow-y: auto;
  scrollbar-width: none;

  &::-webkit-scrollbar {
    display: none;
  }
}

.panel-main {
  position: relative;
  z-index: 6;

  .hero-desc {
    font-size: 14px;
    color: var(--c-text-content);
    line-height: 1.6;
    margin-bottom: 1rem;
  }
}

/* ==================== 标签样式(保持原样) ==================== */
.tag-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.3em 0.6em;
  margin: 0.5em 0;

  .tag {
    background-color: var(--c-bg-soft);
    border-radius: 0.4em;
    color: var(--c-text-soft);
    font-size: 0.9em;
    padding: 0.25em 0.6em;
    transition: all 0.2s;
    cursor: pointer;

    &:hover {
      background-color: var(--c-primary-soft);
      color: var(--c-primary);
    }
  }
}

/* ==================== 详情信息网格(保持原样) ==================== */
.info-grid {
  display: grid;
  gap: 0.4rem;
  margin: 0.5em 0;
  font-size: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  margin: 0.5em 0;

  .info-label {
    color: var(--c-text-2);
    font-size: 0.8rem;
    font-weight: 500;
  }

  .info-value {
    color: var(--c-text);
    font-size: 0.8rem;
    word-break: break-word;
  }
}

/* ==================== 档案状态卡(保持原样) ==================== */
.status-card {
  background: rgba(122, 92, 61, 0.08);
  border-radius: 6px;
  padding: 10px;
  margin-top: 0.5em;

  .status-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 6px;

    .header-title {
      font-weight: 600;
      color: var(--c-text);
    }

    .header-badge {
      font-size: 0.75rem;
      padding: 2px 6px;
      border-radius: 4px;

      &.badge-1 {
        background: rgba(255, 0, 0, 0.2);
        color: #ff6b85;
      }
    }
  }

  &.type-尤诺 .status-header {
    margin-bottom: 2px;
  }

  .status-content {
    font-size: 13px;
    color: var(--c-text-content);
    line-height: 1.5;
  }
}

/* ==================== 移动端适配(保持原样) ==================== */
@media screen and (max-width: 768px) {
  .hero-main {
    height: auto;
    margin: 1rem 0;
    border-radius: 0.5rem;
  }

  .hero-card {
    flex-direction: column;
    gap: 0.5rem;
    padding: 0.75rem;
  }

  .left-info {
    width: 100%;
    padding: 0.5rem;
    border-radius: 10px;

    .avatar-image {
      width: 200px;
      height: 200px;
      border-radius: 8px;
    }

    .avatar-name {
      font-size: 12px;
      margin-top: 4px;
    }

    .avatar-meta {
      font-size: 0.7rem;
      gap: 4px;

      .meta-tag {
        font-size: 0.7rem;
        padding: 3px 6px;
        border-radius: 6px;
      }
    }
  }

  .panel-main {
    .hero-desc {
      font-size: 0.85rem;
      line-height: 1.4;
    }
  }

  .tag-container {
    gap: 0.2em 0.4em;

    .tag {
      font-size: 0.75em;
      padding: 0.2em 0.5em;
    }
  }

  .info-grid {
    grid-template-columns: repeat(3, 1fr) !important;
    gap: 0.2rem;
    font-size: 0.8rem;
  }

  .info-item {
    gap: 0.1rem;

    .info-label,
    .info-value {
      font-size: 0.75rem;
    }
  }

  .status-card {
    padding: 8px;
    border-radius: 5px;

    .status-header {
      gap: 6px;
      margin-bottom: 4px;
    }

    .status-content {
      font-size: 0.8rem;
      line-height: 1.4;
    }
  }
}
</style>
```

#tab2
::hero
---
类型: 爱弥斯
头像: /image/PageInternal/Wuthering Waves/Avatar/ams.jpg
徽章:
  称号: 电子幽灵
名字: 爱弥斯
详情信息: 
  首次登场: 3.0版本
  正式实装: 3.1版本
  共鸣属性: 热熔
  武器: 讯刀
  共鸣能力: 长航的星辉
标签:
  - 星炬学院拉贝尔学部
  - 隧者适格者
  - 飞行雪绒
档案:
  具体信息:
    - 序号: 1 
      徽章: ▇▂▇数据损毁▇▋▌
    - 序号: 2
  外挂信息:
    简介: ["频谱检验报告", "超频诊断报告"]
  顶栏信息:
    主标题: 共鸣状况 · 电子幽灵档案
---
#desc
曾是星炬学院的隧者适格者，如今已成为在星海轻歌的<span class="highlight" style="color: var(--pink-core);text-shadow: 0 0 8px var(--pink-core);">电子幽灵</span>。她在寂静的星海中飞行，星屑在身侧崩解，时间在身后消亡。漫漫孤寂并未消失，它只是被拉伸、稀释、重塑，最终成为她羽翼的一部分。“我知道，只要抬头，那颗星总能找到我。”

#status1
「调自深空联合：星炬学院 学生档案」 「共鸣能力检验报告 RA2362-G」 学生姓名：爱弥斯 是否具有适格者资质：是 共鸣能力概述：受试样本拉贝尔曲线呈稳定上升态，最终趋向稳定波动，检测结果判断为自然型共鸣者，声痕位于胸口。 根据入学前提交的个人档案与学生自述，对象▇▇▂▇▋▌▏▉█……<span class="glitch-text">很遗憾，这份报告现在已经没有参考价值了，毕竟是生前的记录了~</span>就让本人来补充一下吧。现在的我，已经是<span class="glitch-text">隧者的共鸣者，声痕相比之前也发生了变化，但状态不算很稳定。</span>能力……可以显化「隧者兵装」并与之融合，简单来说就是变身啦！当然，为了方便战斗，我也给机兵设计了一套自运转的逻辑，目前模拟配合起来的感受还不错，能够更大限度地利用光炮的覆盖范围。除此之外，我也能以<span class="glitch-text">电子幽灵的形式进入数据系统内部。</span>不过，这或许不能称之为共鸣能力的一部分，将之归结于共鸣时的特殊状态带来的……▇▉▇▇▂▇ “奇怪，这名学生的档案怎么损毁了？打开后都是数据错误。” “那个失踪的适格者？嗯……上报给洛瑟菈校长吧。”
<style>
.glitch-text {
  color: #ff6b85;
}
</style>

#status2
受试样本拉贝尔波形检测图呈椭圆形波动，时域表示稳定，未见任何异常波动倾向。检测结果判断为正常阶段。 诊断结果：超频临界值正常，稳定性高，暂无超频风险。 无过往超频史，拉贝尔曲线稳定。 暂无需心理辅导。 “爱弥斯同学……本学年状态尚处稳定，但我们还是需要更密切地关注她的精神状态。如果情况有变，要及时进行心理干预。” “那孩子明明看起来那么开朗……” “所以，保持关注就好。既然她希望这样生活，那就相信她的判断，我们作为师长，就做好该做的事吧。”
::
::

#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
hero属性

| 配置项  | 类型                       | 说明                                                     |
| ---- | ------------------------ | ------------------------------------------------------ |
| 类型   | `"爱弥斯"、"尤诺"、"奥古斯塔"`      | 角色类型（目前只有几种，未适配完成）                                     |
| 头像   | `string`                 | 角色头像                                                   |
| 徽章   | `Record<string, string>` | 角色徽章(共鸣能力、属性等等)                                        |
| 名字   | `string`                 | 角色名字                                                   |
| 标签   | `Record<string, string>` | 角色曾用标签                                                 |
| 详情信息 | `Record<string, string>` | 角色全局信息                                                 |
| 简介   | `string[]`               | 角色简介内容，通过使用 **string[]** 类型搭配 **solt** 标签，防止无法被文章字数计数到 |
| 档案   | `档案[]`                   | 角色档案数据                                                 |

档案属性

| 配置项 | 类型            | 说明                                                       |
| --- | ------------- | -------------------------------------------------------- |
| 标题  | `string?`     | 预留输入标题数据，作为档案主标题显示                                       |
| 简介  | `string[]`    | 预留输入简介数据，通过使用 **string[]** 类型搭配 **solt** 标签，防止无法被文章字数计数到 |
| 信息  | `Array<信息[]>` | 使用 `**Array**` 方式来进行分开，具有多适应性的效果                         |

信息属性

| 配置项 | 类型     | 说明                            |
| --- | ------ | ----------------------------- |
| 序号  | number | 作为锚定档案简介的显示计数                 |
| 主标题 | string | 作为每个档案中的主要标题                  |
| 副标题 | string | 作为每个档案中的副标题，为一类标签具有补充效应，可选可不选 |


#tab2
``` md lang="md"
::hero
---
类型: 爱弥斯
头像: /image/PageInternal/Wuthering Waves/Avatar/ams.jpg
徽章:
  称号: 电子幽灵
名字: 爱弥斯
详情信息: 
  首次登场: 3.0版本
  正式实装: 3.1版本
  共鸣属性: 热熔
  武器: 讯刀
  共鸣能力: 长航的星辉
标签:
  - 星炬学院拉贝尔学部
  - 隧者适格者
  - 飞行雪绒
档案:
  具体信息:
    - 序号: 1 
      徽章: ▇▂▇数据损毁▇▋▌
    - 序号: 2
  外挂信息:
    简介: ["频谱检验报告", "超频诊断报告"]
  顶栏信息:
    主标题: 共鸣状况 · 电子幽灵档案
---
#desc
曾是星炬学院的隧者适格者，如今已成为在星海轻歌的<span class="highlight" style="color: var(--pink-core);text-shadow: 0 0 8px var(--pink-core);">电子幽灵</span>。她在寂静的星海中飞行，星屑在身侧崩解，时间在身后消亡。漫漫孤寂并未消失，它只是被拉伸、稀释、重塑，最终成为她羽翼的一部分。“我知道，只要抬头，那颗星总能找到我。”

#status1
「调自深空联合：星炬学院 学生档案」 「共鸣能力检验报告 RA2362-G」 学生姓名：爱弥斯 是否具有适格者资质：是 共鸣能力概述：受试样本拉贝尔曲线呈稳定上升态，最终趋向稳定波动，检测结果判断为自然型共鸣者，声痕位于胸口。 根据入学前提交的个人档案与学生自述，对象▇▇▂▇▋▌▏▉█……<span class="glitch-text">很遗憾，这份报告现在已经没有参考价值了，毕竟是生前的记录了~</span>就让本人来补充一下吧。现在的我，已经是<span class="glitch-text">隧者的共鸣者，声痕相比之前也发生了变化，但状态不算很稳定。</span>能力……可以显化「隧者兵装」并与之融合，简单来说就是变身啦！当然，为了方便战斗，我也给机兵设计了一套自运转的逻辑，目前模拟配合起来的感受还不错，能够更大限度地利用光炮的覆盖范围。除此之外，我也能以<span class="glitch-text">电子幽灵的形式进入数据系统内部。</span>不过，这或许不能称之为共鸣能力的一部分，将之归结于共鸣时的特殊状态带来的……▇▉▇▇▂▇ “奇怪，这名学生的档案怎么损毁了？打开后都是数据错误。” “那个失踪的适格者？嗯……上报给洛瑟菈校长吧。”
<style>
.glitch-text {
  color: #ff6b85;
}
</style>

#status2
受试样本拉贝尔波形检测图呈椭圆形波动，时域表示稳定，未见任何异常波动倾向。检测结果判断为正常阶段。 诊断结果：超频临界值正常，稳定性高，暂无超频风险。 无过往超频史，拉贝尔曲线稳定。 暂无需心理辅导。 “爱弥斯同学……本学年状态尚处稳定，但我们还是需要更密切地关注她的精神状态。如果情况有变，要及时进行心理干预。” “那孩子明明看起来那么开朗……” “所以，保持关注就好。既然她希望这样生活，那就相信她的判断，我们作为师长，就做好该做的事吧。”
::
```
::

### 人物物品
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroSpecial.vue] lang="ts"
<script setup lang="ts">
import { ref, computed } from 'vue';
import Title from '../card/title.vue';

const props = defineProps<{
  heroSpecialList?: Array<{
    物品名称?: string       // 卡片标题
    物品含意?: string        // 卡片描述
    物品图像?: string       // 卡片主图
    密钥?: number
  }>
  类型: '爱弥斯' | '莫宁' | '琳奈'
  物品彩蛋?: string[]
  物品简介?: string[]
}>();

// 跟踪当前激活的卡片索引（初始激活第一个）
const activeIndex = ref(0);

// 计算每个卡片内容的显示状态（始终渲染，通过CSS控制显隐）
const cardVisibility = computed(() => {
  return (index: number) => activeIndex.value === index;
});
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

    <!-- 右侧内容区：始终渲染所有卡片内容，通过CSS控制显示/隐藏 -->
    <div class="contentArea">
      <div 
        v-for="(item, index) in heroSpecialList" 
        :key="index"
        class="cardContentWrapper"
        :style="{ display: cardVisibility(index) ? 'flex' : 'none' }"
      >
        <div class="cardLeft">
          <!-- 卡片主图 -->
          <img :src="item.物品图像" class="cardImage" alt="卡片主图" />
          <!-- 卡片标题 -->
          <h3 class="cardTitle">{{ item.物品名称 || '默认标题' }}</h3>
          <!-- 卡片附属名称（如角色名） -->
          <div class="cardSubInfo">
            <span>{{ item.物品含意 || '默认名称' }}</span>
          </div>
        </div>
        <div class="cardRight">
          <!-- 卡片描述 -->
          <Title title="描述" />
          <div class="cardDesc" v-for="index in props.物品简介?.length" v-show="item.密钥 === index">
            <slot :name="`desc${index}`" />
          </div>
          <!-- 彩蛋区域（仅爱弥斯类型显示） -->
          <div v-if="类型 === '爱弥斯'">
            <Title title="彩蛋" />
            <div class="cardYouLai" v-for="index in props.物品彩蛋?.length" v-show="item.密钥 === index">
              <slot :name="`caidan${index}`" />
            </div>
          </div>
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
        text-align: center
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
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item1.avif
    物品名称: 《太空战士卡佳VI》
    物品含意: 一盘游戏卡带
    密钥: 1
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item2.avif
    物品名称: 隧者手办
    物品含意: 友情的证明
    密钥: 2
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item3.avif
    物品名称: 纸飞机
    物品含意: 穿越时间的思念
    密钥: 3
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/food.avif
    物品名称: 超级豹风雪
    物品含意: 飞行雪绒的特调
    密钥: 4
类型: 爱弥斯
物品彩蛋: ["《太空战士卡佳VI》", "隧者手办", "纸飞机", "超级豹风雪"]
物品简介: ["《太空战士卡佳VI》", "隧者手办", "纸飞机", "超级豹风雪"]
---
#desc1
《太空战士卡佳VI》，在索拉里斯的游戏爱好者中为人津津乐道的经典系列最新作。沉浸式的角色扮演剧情，丰富有趣的战斗系统，体验成为英雄的孤独之旅，结识十数位可招募的个性伙伴，与宇宙中的邪恶势力进行激烈对抗……除了这些部分，作为彩蛋的那个小游戏也是让爱弥斯极为喜欢的部分，她在通关后经常和家人一起在小屋中联机游玩。“哼哼，拼方块的积分排行榜，最后果然还是我排第一！”

#desc2
捂在爱弥斯眼上的那双手移开后，面前摆着的就是这样的一个小盒子。身边的四位好友笑眯眯地怂恿爱弥斯赶紧拆开，盒中的小型隧者手办就这么露了出来。适格者们像是叽叽喳喳的小动物那样祝贺她生日快乐，希望她能顺利成为那个成功驾驶隧者的人，希望她们能一起去真正的星空……爱弥斯的嘴唇动了动，最终也并未把自己藏在心底深处的那个愿望说出来。她珍惜地摩挲了一下这份礼物，站起身来，笑着扑进朋友们的怀里。

#desc3
爱弥斯坐在学院楼栋顶层，悠然地享受微风吹拂。她折过无数纸飞机，但一直记得最初在小屋的那只。午后的光透过窗户照射进来，寒冷的雪和风都被挡在了窗外，只有火炉被烧得劈啪作响的声音。为晚饭炖着的汤散发着甜美醇厚的香气，身边的家人正手指灵巧地为她折出能飞得更远的纸飞机。爱弥斯抬起脸，看到【TA】正微笑着将手中的纸飞机递来。那景象在恍惚的回忆中消逝，眼前仍旧是学院的风景。爱弥斯微微一笑，把手中新折的纸飞机投入风中。

#desc4
轻软甜蜜的雪白冰淇淋浮在深色的咖啡上，雪绒豹豹冰雕正安然地泡在其中。在图书馆熬夜苦读时轻轻饮上一口，苦味已被清甜调和，爽口又提神。爱弥斯参加星炬学院社团饮品创新大赛的获奖之作，据本人称是表达了作者的思乡之情。玩笑话里也有三分真心。在那片冰冷寂静的雪原上，与家人和海豹们玩耍的童年记忆已然相隔遥远，却仍时常停留在她的心头。

#caidan1
※ 官方彩蛋：小屋里面右侧书柜有本《太空战士卡佳VI-星际导航图谱:全星系探索路线与任务图文攻略》

#caidan2
※ 那年之后，朋友们再也看不见她，但每年的歌友会依然在举办

#caidan3
※ 纸飞机是贯穿时间线的意象，象征着思念与告别

#caidan4
※ 小时候，小爱因为把海豹带入家中导致地板湿透，阿漂教训她之后觉得过头买了育儿书籍也在小屋书柜
::
::

#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1

| 配置项	     | 类型	                            | 说明                                          |
| ------------ | -------------------------------- | --------------------------------------------- |
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
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item1.avif
    物品名称: 《太空战士卡佳VI》
    物品含意: 一盘游戏卡带
    密钥: 1
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item2.avif
    物品名称: 隧者手办
    物品含意: 友情的证明
    密钥: 2
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/item3.avif
    物品名称: 纸飞机
    物品含意: 穿越时间的思念
    密钥: 3
  - 物品图像: /image/PageInternal/Wuthering Waves/Special/ams/food.avif
    物品名称: 超级豹风雪
    物品含意: 飞行雪绒的特调
    密钥: 4
类型: 爱弥斯
物品彩蛋: ["《太空战士卡佳VI》", "隧者手办", "纸飞机", "超级豹风雪"]
物品简介: ["《太空战士卡佳VI》", "隧者手办", "纸飞机", "超级豹风雪"]
---
#desc1
《太空战士卡佳VI》，在索拉里斯的游戏爱好者中为人津津乐道的经典系列最新作。沉浸式的角色扮演剧情，丰富有趣的战斗系统，体验成为英雄的孤独之旅，结识十数位可招募的个性伙伴，与宇宙中的邪恶势力进行激烈对抗……除了这些部分，作为彩蛋的那个小游戏也是让爱弥斯极为喜欢的部分，她在通关后经常和家人一起在小屋中联机游玩。“哼哼，拼方块的积分排行榜，最后果然还是我排第一！”

#desc2
捂在爱弥斯眼上的那双手移开后，面前摆着的就是这样的一个小盒子。身边的四位好友笑眯眯地怂恿爱弥斯赶紧拆开，盒中的小型隧者手办就这么露了出来。适格者们像是叽叽喳喳的小动物那样祝贺她生日快乐，希望她能顺利成为那个成功驾驶隧者的人，希望她们能一起去真正的星空……爱弥斯的嘴唇动了动，最终也并未把自己藏在心底深处的那个愿望说出来。她珍惜地摩挲了一下这份礼物，站起身来，笑着扑进朋友们的怀里。

#desc3
爱弥斯坐在学院楼栋顶层，悠然地享受微风吹拂。她折过无数纸飞机，但一直记得最初在小屋的那只。午后的光透过窗户照射进来，寒冷的雪和风都被挡在了窗外，只有火炉被烧得劈啪作响的声音。为晚饭炖着的汤散发着甜美醇厚的香气，身边的家人正手指灵巧地为她折出能飞得更远的纸飞机。爱弥斯抬起脸，看到【TA】正微笑着将手中的纸飞机递来。那景象在恍惚的回忆中消逝，眼前仍旧是学院的风景。爱弥斯微微一笑，把手中新折的纸飞机投入风中。

#desc4
轻软甜蜜的雪白冰淇淋浮在深色的咖啡上，雪绒豹豹冰雕正安然地泡在其中。在图书馆熬夜苦读时轻轻饮上一口，苦味已被清甜调和，爽口又提神。爱弥斯参加星炬学院社团饮品创新大赛的获奖之作，据本人称是表达了作者的思乡之情。玩笑话里也有三分真心。在那片冰冷寂静的雪原上，与家人和海豹们玩耍的童年记忆已然相隔遥远，却仍时常停留在她的心头。

#caidan1
※ 官方彩蛋：小屋里面右侧书柜有本《太空战士卡佳VI-星际导航图谱:全星系探索路线与任务图文攻略》

#caidan2
※ 那年之后，朋友们再也看不见她，但每年的歌友会依然在举办

#caidan3
※ 纸飞机是贯穿时间线的意象，象征着思念与告别

#caidan4
※ 小时候，小爱因为把海豹带入家中导致地板湿透，阿漂教训她之后觉得过头买了育儿书籍也在小屋书柜
::
```
::

### 人物故事
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue lang="vue" [heroStories.vue]
<script setup lang="ts">
import Title from '../card/title.vue';

const props = defineProps<{
	/** story 下标从 1 开始 */
	故事?: string[]
	居中?: boolean
	密钥?: string | number
  标题?: string
}>()

// 使用 v-bind:active 以传递 Number 值
const activeStory = ref(Number(props.密钥) || 1)
</script>

<template>
<div :class="{ 居中 }" class="heroStoryMain">
  <Title :title="props.标题" style="margin-bottom: 10px;"/>
	<div class="storys">
		<button
			v-for="(story, storyIndex) in 故事"
			:key="storyIndex"
			:class="{ active: activeStory === storyIndex + 1 }"
			@click="activeStory = storyIndex + 1"
		>
			{{ story }}
		</button>
	</div>
	<div v-for="storyIndex in 故事.length" v-show="activeStory === storyIndex" :key="storyIndex" class="story-content">
		<slot :name="`story${storyIndex}`" />
	</div>
</div>
</template>

<style lang="scss" scoped>
.float-in-leave-active {
	/* stylelint-disable-next-line declaration-no-important */
	position: revert !important;
}

.heroStoryMain {
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  /* display: flex; */
  padding: 1rem;
}

.center {
	width: fit-content;
	max-width: 100%;
	margin-inline: auto;
}

.storys {
	display: flex;
	flex-wrap: wrap;
	justify-content: center;
	gap: 0.5em;
	position: relative;
	width: fit-content;
	margin: 0 auto;
	font-size: 0.9em;
	line-height: 1.4;
}

button {
	position: relative;
	margin-bottom: 0.5em;
	padding: 0.3em 0.5em;
	border-radius: 0.4em;
	color: var(--c-text-2);
	transition: all 0.2s;

	&:hover {
		background-color: var(--c-bg-soft);
		color: var(--c-text);
	}

	&::before, &::after {
		display: block;
		position: absolute;
		bottom: -0.5em;
		inset-inline: 0.8em;
		height: 2px;
		border-radius: 1em;
		pointer-events: none;
	}

	&::after {
		content: "";
		inset-inline: -0.8em;
		background-color: var(--c-border);
	}

	&.active {
		box-shadow: 0 1px 0.5em var(--ld-shadow);
		background-color: var(--ld-bg-card);
		color: var(--c-text);

		&::before {
			content: "";
			background-color: var(--c-primary);
			z-index: 1;
		}
	}
}

.story-content {
	margin: 1em 0;
}
</style>
```

#tab2
::heroStory
---
故事: ["在雪原上", "年轻人们", "唯不可见者可见", "问我何所惧，问我何所忧", "一切未曾说出的"]
标题: 爱弥斯纪事 · 远航星
---
#story1
雪落在爱弥斯的鼻尖上，湿润的凉意让她感觉有些痒痒的，她盯着湖面看了一会儿，最终还是决定放弃玩水的打算。

前段时间，她耗费心思努力从湖里面捞出来了几根硕大的狐尾蒲藻当做武器，和冰原上的雪绒海豹们玩耍。在这场大战中她扮演英雄，海豹们扮演坏蛋——考虑到这群慵懒温和的生物爬行速度很慢，基本都是爱弥斯大获全胜。可惜那次玩过了头，狐尾蒲藻的碎块使小屋狼藉满地，那个人回家之后，在门口沉默了很久。

自然，爱弥斯挨了一顿训。

事后那个人似乎对此有些愧疚，觉得自己对孩子凶过了头，又买了一堆卡带作为补偿和应对措施。这招相当有效，电子游戏的魅力迅速俘虏了爱弥斯，她就暂时把在现实里大战的事儿抛之脑后了。而在所有的卡带里，她最喜欢的是《太空战士卡佳》系列。在宇宙中一边旅行一边拯救世界？太棒了！谁不想扮演一个忧郁、帅气又意志坚定的英雄呢？

爱弥斯推开门，那个人正坐在沙发上看书，她高高兴兴地挤过去，举起手柄。和我玩！女孩的动作传达着这一讯号，于是对方笑着刮了刮女孩的鼻尖，欣然应允。
冬日漫长，但此刻炉火燃烧，一切都温暖平静。

游戏进行了一段时间，爱弥斯说，今天的任务就做到这里吧，我和你说，我在地图右侧找到了一个隐藏房间呢！密码是9072，开门之后可以玩拉海洛方块，可好玩儿了。那个人问，爱弥斯，你不是昨天还着急继续推任务拯救世界吗？对，她摇晃着脑袋笑着说，但今天我又不想了……而且，要是任务做完了，游戏也就结束了……我还想和你一起玩更久呢。就算是拯救世界，也是需要休息的，对吧？你要学会劳逸结合啦！

那只温暖的手揉了揉她的发顶，带着一丝奇妙的感慨低声道：你说得对，爱弥斯。我会试着这么做的。

那……要从现在做起噢？

好，从现在做起。那个人笑了笑。其实……现在我在这里，已经算是在休息。来吧，我们玩拉海洛方块，你先。

#story2
虚质逆向工程学的成绩出分的下午，爱弥斯和她的朋友们例常的午饭时间一片愁云惨淡。

埃拉拉一头鲜艳的红发都有些黯淡，虚弱地哀鸣着，啊，连食堂的饭都不香了……！在她身边认真咀嚼一碗不明物质的诺娃则说，朋友，虽然这分数的确让人难受，但我们不能本末倒置——这食堂的饭它本来也不香啊。琳正因为分数大受打击，塞莱斯特在温声安慰她，爱弥斯则以神游天外的表情吸了一口她特调过口味的嘻嘻果冻，和身边几位关系融洽的适格者们进行着漫谈。

埃拉拉突然扭头看她：爱弥斯！你、你一点都不着急吗？

她眨巴眼睛：着急什么？……啊，分数？但这次大家成绩不都差不多嘛，萨迦教授判分太严格啦，又不是大家真的不行，没事没事。说到一半，爱弥斯拿出纸巾递给她们中性格最柔软的那位。啊，小琳，擦擦泪——！

塞莱斯特接了过去，和其他几个人对视一眼，轻声道：你好像不太在意作为适格者的未来。

她平常会怎么说呢？大约会找几个话题打打闹闹地糊弄过去，但今天是那个人的生日，爱弥斯正在思念对方，因此有些忘记在朋友们前掩饰情绪。适格者……也只是一种可能性嘛，她语调平淡地说，比起这个，有人曾说更希望我能轻松快乐地生活，我也觉得这样比较好。我的理想没有大家那么厉害啦，懒散的人松弛点也很正常吧？

真的吗？朋友们望着她的眼睛问。

爱弥斯只是回以微笑：真的。

但并非如此，只是因为那个理想太过沉重、太过傲慢、太过荒谬，因此不能在平稳的词句中被宣之于口。它每一日都比前一日成长得更加膨大，在爱弥斯的心灵中扎入根须，但她视之不见，因为她已经接受了那句嘱托。如果日复一日的快乐就是好的，那就让她这么一直快乐下去吧！她会信守承诺，除非……
思绪被打断，埃拉拉在她的脸颊上狠狠捏了一把。

怎么啦？爱弥斯皱着脸含混不清地说道。

心口不一的坏人，她的朋友抱怨道，好了好了不问你了，下午图书馆复习一起去吗？

她点头道：当然~

爱弥斯笑着和朋友们打闹作一团，慢悠悠走向电梯。她们都还很年轻，并不急于一时去寻找答案，在这所满载着天才的学院中，拥有无限可能的未来。

#story3
爱弥斯走到镜子前，镜面并未映照出她的影子。

在她死后，整个世界就与之错开了。适格者们曾讨论过人的本质是什么，埃拉拉说是爱，诺娃说是记忆，塞莱斯特说是自我，琳说是信仰……不对，爱弥斯想，人的本质是频率。以她现在的情况而言，她只能这么去理解。是因为和隧者共鸣，因此她的存在性质也被改变了？她的躯体已经在模拟驾驶舱中被撕碎，她应该死了，却仍旧存在……不过，她现在已经不再去想存在的本质是什么这种问题了。尽管对一个电子幽灵而言，漫长的时间足够去思考任何问题。

但爱弥斯现在知道了更重要的事。

在她进入高悬天际的隧者炉芯后，她看到了藏在其中的那条讯息。

原来是这样，她想，原来是这样。所以这条讯息从未被读到，因为在最初它就已经被放置在了无法被查阅的地方，只有此时身为隧者共鸣者的她才能看见。整个地下空洞都仰赖着这“太阳”生存，拉海洛人自然不会有机会知晓。她该高兴吗？以这条讯息的内容而言，她将有机会实现自己的愿景——但这的确又像个阴差阳错的玩笑，因为那并不是她想象中的实现方式。可这是只有她能做到的事。

如果有我能做的事，我就会去做。

……对，是该这样。爱弥斯想起那个人，在心里为自己加油。她觉得自己可以再勇敢些，再坚定些。当然，现在还不够，但没关系，还有时间去做准备。从这方面而言，她已经受到了命运的优待。想着想着，她不禁轻轻哼起歌来。可惜，飞行雪绒的曲子没法再更新了，如果能预料到明天，她会写完那首歌的。

镜面没有映出她的面孔，因此爱弥斯并未看到，她脸上的微笑像是被一划被蜡笔涂歪的痕迹，在末端戛然而止。

#story4
寂静。

她转过身，看到了那只“眼睛”。啊，是的，形似眼睛，但爱弥斯知道那不是。黑洞？也许人类可以用自己所知的东西去这么称呼，但在她的眼中，在已经与隧者共鸣的她眼中，那是某种在不断漫溢发生的“现象”。被其吞噬和笼罩的东西失去存在，深空联合称其为虚质——那就这么叫吧，对于处在比之更低维度的生物而言，总要有个称呼。这就和人类叫它“阿列夫一”是同样的道理。

爱弥斯已经不止一次和它“对视”了。对于在虚质空间和外部不断往返的她而言，这是必然会遭遇的事，只能习惯。

直到前不久为止，她都还是会受到一定的影响。虚无，对死亡的渴望，无意义，寂静的宇宙……凝视阿列夫一带来的负面影响，就连身为死者的她都难以避免。但现在，在爱弥斯于那被吞噬的文明的残骸中探索后，她看着那只巨大的，超越了时间与空间的眼睛，只听到了自己趋近疯狂的大笑声。
这就是那个人一直追寻的东西吗？笑声从她的喉咙中沉闷地响起。这就是真相？

真荒谬。

一切自年幼时萌发的愿景和理想，意义都因此消解。爱弥斯忽然觉得很累，但在疲惫之后，又有一丝萦绕不去的伤心和担忧钻进她的心魂。那个人该怎么办呢？那个人知道这些事吗？如果知道，爱弥斯不敢想象对方一直以来是抱持着何种感情在世间行走。如果不知道……那她就应该把这一切都藏起来，都砸碎，都销毁……她的心中一半是冰冷的担忧，一半是燃烧的怒火。生平第一次，她知晓了何为仇恨。

那只被爱弥斯造出的纸飞机幻影，在她的掌心被揉皱成一团纸屑，落向无尽的虚空。

#story5
爱弥斯慢慢踏着楼梯向上，回到了桌边。

因为刚才那个梦醒来后，她也睡不着了。事实上，她本就无需睡眠，梦也更像是记忆以另一种形式进行重播。明天她和【TA】就会抵达隧者脚下，她不太确定会发生什么，因此想要做好准备。

话语是意义的准备，因此她想把一些想和【TA】说，却在此刻还无法宣之于口的话记录来下。

该说些什么好呢？也许应该把这么多年发生的事情，都告诉对方。大事小事，欢乐和忧伤，无关紧要的一切，关系世界命运的一切……或者，也可以小小的责备对方一下，因为时间已经过去了很久，对方缺席了太久，她要分享的东西也堆积得太多。如果这些都不太对，那么就把这次公路片之旅画下来，就像以前那样。她说了又删，删了又说，最后只留下了一小段内容。

“我知道，只要抬头，那颗星总能找到我。”

爱弥斯在房间中的电子设备里留下了这段话，等待它在更久一些之后的时间被发现，或者永远不被发现。

此刻，她也的确没有更多想要的东西了。

【TA】现在看起来还挺快乐的，这比任何事都要好。如果可以，那就永远隐瞒下去吧，只要那个人能得到幸福，其他事情她都可以付之一笑。她可以做个自私的人，也可以做个无私的人，可面对家人，人难免都会护短，爱弥斯也不能免俗。真相又有什么重要的呢？

只要【TA】能自由而快乐地活着就好。

爱弥斯想着想着，忽然意识到这和过去束缚过她的那句嘱托并无区别。她忍不住笑了一下。此刻万籁俱寂，雪无声地落在天地间，于消融前等待着春日的降临。

::

::
#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
hero-stories属性

| 配置项 | 类型               | 说明            |
| --- | ---------------- | ------------- |
| 故事  | string[]         | 故事内容（切换后自动更新） |
| 居中  | boolean          | 组件全局信息        |
| 密钥  | string \| number | 作为切换时的重要凭证    |
| 标题  | string           | 是组件头部标题       |

#tab2
``` md lang="md"
::heroStory
---
故事: ["在雪原上", "年轻人们", "唯不可见者可见", "问我何所惧，问我何所忧", "一切未曾说出的"]
标题: 爱弥斯纪事 · 远航星
---
#story1
雪落在爱弥斯的鼻尖上，湿润的凉意让她感觉有些痒痒的，她盯着湖面看了一会儿，最终还是决定放弃玩水的打算。

前段时间，她耗费心思努力从湖里面捞出来了几根硕大的狐尾蒲藻当做武器，和冰原上的雪绒海豹们玩耍。在这场大战中她扮演英雄，海豹们扮演坏蛋——考虑到这群慵懒温和的生物爬行速度很慢，基本都是爱弥斯大获全胜。可惜那次玩过了头，狐尾蒲藻的碎块使小屋狼藉满地，那个人回家之后，在门口沉默了很久。

自然，爱弥斯挨了一顿训。

事后那个人似乎对此有些愧疚，觉得自己对孩子凶过了头，又买了一堆卡带作为补偿和应对措施。这招相当有效，电子游戏的魅力迅速俘虏了爱弥斯，她就暂时把在现实里大战的事儿抛之脑后了。而在所有的卡带里，她最喜欢的是《太空战士卡佳》系列。在宇宙中一边旅行一边拯救世界？太棒了！谁不想扮演一个忧郁、帅气又意志坚定的英雄呢？

爱弥斯推开门，那个人正坐在沙发上看书，她高高兴兴地挤过去，举起手柄。和我玩！女孩的动作传达着这一讯号，于是对方笑着刮了刮女孩的鼻尖，欣然应允。
冬日漫长，但此刻炉火燃烧，一切都温暖平静。

游戏进行了一段时间，爱弥斯说，今天的任务就做到这里吧，我和你说，我在地图右侧找到了一个隐藏房间呢！密码是9072，开门之后可以玩拉海洛方块，可好玩儿了。那个人问，爱弥斯，你不是昨天还着急继续推任务拯救世界吗？对，她摇晃着脑袋笑着说，但今天我又不想了……而且，要是任务做完了，游戏也就结束了……我还想和你一起玩更久呢。就算是拯救世界，也是需要休息的，对吧？你要学会劳逸结合啦！

那只温暖的手揉了揉她的发顶，带着一丝奇妙的感慨低声道：你说得对，爱弥斯。我会试着这么做的。

那……要从现在做起噢？

好，从现在做起。那个人笑了笑。其实……现在我在这里，已经算是在休息。来吧，我们玩拉海洛方块，你先。

#story2
虚质逆向工程学的成绩出分的下午，爱弥斯和她的朋友们例常的午饭时间一片愁云惨淡。

埃拉拉一头鲜艳的红发都有些黯淡，虚弱地哀鸣着，啊，连食堂的饭都不香了……！在她身边认真咀嚼一碗不明物质的诺娃则说，朋友，虽然这分数的确让人难受，但我们不能本末倒置——这食堂的饭它本来也不香啊。琳正因为分数大受打击，塞莱斯特在温声安慰她，爱弥斯则以神游天外的表情吸了一口她特调过口味的嘻嘻果冻，和身边几位关系融洽的适格者们进行着漫谈。

埃拉拉突然扭头看她：爱弥斯！你、你一点都不着急吗？

她眨巴眼睛：着急什么？……啊，分数？但这次大家成绩不都差不多嘛，萨迦教授判分太严格啦，又不是大家真的不行，没事没事。说到一半，爱弥斯拿出纸巾递给她们中性格最柔软的那位。啊，小琳，擦擦泪——！

塞莱斯特接了过去，和其他几个人对视一眼，轻声道：你好像不太在意作为适格者的未来。

她平常会怎么说呢？大约会找几个话题打打闹闹地糊弄过去，但今天是那个人的生日，爱弥斯正在思念对方，因此有些忘记在朋友们前掩饰情绪。适格者……也只是一种可能性嘛，她语调平淡地说，比起这个，有人曾说更希望我能轻松快乐地生活，我也觉得这样比较好。我的理想没有大家那么厉害啦，懒散的人松弛点也很正常吧？

真的吗？朋友们望着她的眼睛问。

爱弥斯只是回以微笑：真的。

但并非如此，只是因为那个理想太过沉重、太过傲慢、太过荒谬，因此不能在平稳的词句中被宣之于口。它每一日都比前一日成长得更加膨大，在爱弥斯的心灵中扎入根须，但她视之不见，因为她已经接受了那句嘱托。如果日复一日的快乐就是好的，那就让她这么一直快乐下去吧！她会信守承诺，除非……
思绪被打断，埃拉拉在她的脸颊上狠狠捏了一把。

怎么啦？爱弥斯皱着脸含混不清地说道。

心口不一的坏人，她的朋友抱怨道，好了好了不问你了，下午图书馆复习一起去吗？

她点头道：当然~

爱弥斯笑着和朋友们打闹作一团，慢悠悠走向电梯。她们都还很年轻，并不急于一时去寻找答案，在这所满载着天才的学院中，拥有无限可能的未来。

#story3
爱弥斯走到镜子前，镜面并未映照出她的影子。

在她死后，整个世界就与之错开了。适格者们曾讨论过人的本质是什么，埃拉拉说是爱，诺娃说是记忆，塞莱斯特说是自我，琳说是信仰……不对，爱弥斯想，人的本质是频率。以她现在的情况而言，她只能这么去理解。是因为和隧者共鸣，因此她的存在性质也被改变了？她的躯体已经在模拟驾驶舱中被撕碎，她应该死了，却仍旧存在……不过，她现在已经不再去想存在的本质是什么这种问题了。尽管对一个电子幽灵而言，漫长的时间足够去思考任何问题。

但爱弥斯现在知道了更重要的事。

在她进入高悬天际的隧者炉芯后，她看到了藏在其中的那条讯息。

原来是这样，她想，原来是这样。所以这条讯息从未被读到，因为在最初它就已经被放置在了无法被查阅的地方，只有此时身为隧者共鸣者的她才能看见。整个地下空洞都仰赖着这“太阳”生存，拉海洛人自然不会有机会知晓。她该高兴吗？以这条讯息的内容而言，她将有机会实现自己的愿景——但这的确又像个阴差阳错的玩笑，因为那并不是她想象中的实现方式。可这是只有她能做到的事。

如果有我能做的事，我就会去做。

……对，是该这样。爱弥斯想起那个人，在心里为自己加油。她觉得自己可以再勇敢些，再坚定些。当然，现在还不够，但没关系，还有时间去做准备。从这方面而言，她已经受到了命运的优待。想着想着，她不禁轻轻哼起歌来。可惜，飞行雪绒的曲子没法再更新了，如果能预料到明天，她会写完那首歌的。

镜面没有映出她的面孔，因此爱弥斯并未看到，她脸上的微笑像是被一划被蜡笔涂歪的痕迹，在末端戛然而止。

#story4
寂静。

她转过身，看到了那只“眼睛”。啊，是的，形似眼睛，但爱弥斯知道那不是。黑洞？也许人类可以用自己所知的东西去这么称呼，但在她的眼中，在已经与隧者共鸣的她眼中，那是某种在不断漫溢发生的“现象”。被其吞噬和笼罩的东西失去存在，深空联合称其为虚质——那就这么叫吧，对于处在比之更低维度的生物而言，总要有个称呼。这就和人类叫它“阿列夫一”是同样的道理。

爱弥斯已经不止一次和它“对视”了。对于在虚质空间和外部不断往返的她而言，这是必然会遭遇的事，只能习惯。

直到前不久为止，她都还是会受到一定的影响。虚无，对死亡的渴望，无意义，寂静的宇宙……凝视阿列夫一带来的负面影响，就连身为死者的她都难以避免。但现在，在爱弥斯于那被吞噬的文明的残骸中探索后，她看着那只巨大的，超越了时间与空间的眼睛，只听到了自己趋近疯狂的大笑声。
这就是那个人一直追寻的东西吗？笑声从她的喉咙中沉闷地响起。这就是真相？

真荒谬。

一切自年幼时萌发的愿景和理想，意义都因此消解。爱弥斯忽然觉得很累，但在疲惫之后，又有一丝萦绕不去的伤心和担忧钻进她的心魂。那个人该怎么办呢？那个人知道这些事吗？如果知道，爱弥斯不敢想象对方一直以来是抱持着何种感情在世间行走。如果不知道……那她就应该把这一切都藏起来，都砸碎，都销毁……她的心中一半是冰冷的担忧，一半是燃烧的怒火。生平第一次，她知晓了何为仇恨。

那只被爱弥斯造出的纸飞机幻影，在她的掌心被揉皱成一团纸屑，落向无尽的虚空。

#story5
爱弥斯慢慢踏着楼梯向上，回到了桌边。

因为刚才那个梦醒来后，她也睡不着了。事实上，她本就无需睡眠，梦也更像是记忆以另一种形式进行重播。明天她和【TA】就会抵达隧者脚下，她不太确定会发生什么，因此想要做好准备。

话语是意义的准备，因此她想把一些想和【TA】说，却在此刻还无法宣之于口的话记录来下。

该说些什么好呢？也许应该把这么多年发生的事情，都告诉对方。大事小事，欢乐和忧伤，无关紧要的一切，关系世界命运的一切……或者，也可以小小的责备对方一下，因为时间已经过去了很久，对方缺席了太久，她要分享的东西也堆积得太多。如果这些都不太对，那么就把这次公路片之旅画下来，就像以前那样。她说了又删，删了又说，最后只留下了一小段内容。

“我知道，只要抬头，那颗星总能找到我。”

爱弥斯在房间中的电子设备里留下了这段话，等待它在更久一些之后的时间被发现，或者永远不被发现。

此刻，她也的确没有更多想要的东西了。

【TA】现在看起来还挺快乐的，这比任何事都要好。如果可以，那就永远隐瞒下去吧，只要那个人能得到幸福，其他事情她都可以付之一笑。她可以做个自私的人，也可以做个无私的人，可面对家人，人难免都会护短，爱弥斯也不能免俗。真相又有什么重要的呢？

只要【TA】能自由而快乐地活着就好。

爱弥斯想着想着，忽然意识到这和过去束缚过她的那句嘱托并无区别。她忍不住笑了一下。此刻万籁俱寂，雪无声地落在天地间，于消融前等待着春日的降临。

::
```
::

### 时间线&彩蛋
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroTimelineEaster.vue] lang="vue"
<script setup lang="ts">
import type { __String } from 'typescript';
import Title from '../card/title.vue';
import Badge from './Badge.vue';
import Timeline from './Timeline.vue';

const props = defineProps<{
  类型?: '爱弥斯' | '莫宁' | '尤诺'
  顶部?: {
    标题?: string
    副标题?: string
  }
  时间线?: Array<{
    徽章: string[]
    标签: string[]
    密钥: number
  }>
  彩蛋?: Array<{
    图标?: string
    徽章?: string
    密钥?: number | string
    信息列表?: Record<string, string>
  }>
  时间线内容?:string[]
  彩蛋内容?: string[]
}>()
</script>

<template>
  <div class="heroTimelineEasterMain">
    <div class="heroTimelineEasterCard">
      <div class="timelineEasterHeader">
        <Title :title="`${顶部?.标题}`" />
        <Badge :text="顶部?.副标题" />
      </div>
      
      <!-- 时间线部分 - 修复为两列布局 -->
      <div class="heroTimelineList" :id="类型" v-show="类型 !== '莫宁'">
        <div class="heroTimelineCard" v-for="main in 时间线" :key="main.密钥">
          <div class="heroTimelineLabel" v-for="([key, value], index) in Object.entries(时间线内容 ?? {})" v-show="main.密钥 === index + 1">
            {{ value }}<Badge :text="`${value}`" v-for="([key, value]) in Object.entries(main.徽章 ?? {})" :key="key"/>
          </div>     
          <div class="heroTimelineValue" v-for="index in 时间线内容?.length" v-show="main.密钥 === index">
            <slot :name="`Timeline${index}`"/>
          </div>
          <!-- 特定标签位置||未写完 -->
          <div class="heroTimelineTag" v-show="类型 === '尤诺'">
            <span class="heroTimelineTagList" v-for="([key, value]) in Object.entries(main.标签 ?? {})" :key="key">
              <slot class="text">
                {{ value }}
              </slot>
            </span>
          </div>
        </div>
      </div>

      <div class="heroEasterMain" :id="类型">
        <div class="heroEaster WuWuGameColor" v-for="main in 彩蛋" :id="类型">
          <div class="easterNumber" v-show="类型 === '莫宁'">
            {{ main.密钥 }}
          </div>
          <div class="easterHeader">
            <span class="esterTitle" v-for="([key, value], index) in Object.entries(props.彩蛋内容 ?? {})" v-show="main.密钥 === index + 1">{{ value }}</span>
            <Badge :text="`${main.徽章}`" v-show="类型 !== '爱弥斯'"/>
          </div>
          <div class="easterContent">
            <div class="easterDetailMain" :id="类型">
              <div :class="`easterDetailCard item-${main.密钥}`" :id="`content-${index + 1}`" v-for="([key, value], index) in Object.entries(main.信息列表 ?? {})" :key="key"v-show="类型 === '尤诺'">
                <span class="detailKey">{{ key }}</span>
                <span class="detailValue">{{ value }}</span>
              </div>
            </div>
            <div class="easterP" :id="类型" v-for="Index in 彩蛋内容?.length" v-show="main.密钥 === Index">
              <slot :name="`easter${Index}`"></slot>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.article p {
  margin: 0!important;
}
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
      gap: 0.5em;
      @media (max-width: 560px) {
        grid-template-columns: repeat(1, 1fr);
      }
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

          .heroTimelineTag {
            display: flex;
            flex-wrap: wrap;
            gap: 0.3rem;
            margin-top: 0.25em;
            .heroTimelineTagList {
              padding: 0.25em 0.9em;
              background: rgba(46, 136, 201, 0.2);
              border: 1px solid rgba(127, 211, 255, 0.1);
              border-radius: 0.25rem;
              font-size: 0.65rem;
            }
          }
        }
      }
    .heroEasterMain {
      display: grid;
      gap: 0.5rem;
      .heroEaster {
        border-radius: 0.4em;
        font-size: 1em;
        padding: 0.5em 0.6em;
        transition: all 0.2s;
        .easterHeader {
          display: flex;
          align-items: center;
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
          .easterDetailMain {
            display: grid;
            .easterDetailCard {
              justify-content: space-between;
              display: flex;
            }
          }
        }
      }
    }
  }
}
/* 外置样式 */
/* 时间线样式 */
.heroTimelineList#尤诺 {
  gap: 0.2rem
}
/* 彩蛋样式 */
.heroEasterMain#爱弥斯 {
  .heroEaster {
    border: 1px dashed var(--pink-core);
  }
}
.heroEasterMain#莫宁 {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
  .heroEaster {
    background: #0003;
    border: 1px solid rgba(74, 165, 255, .1);
    .easterNumber {
      width: 30px;
      height: 30px;
      background: #4aa5ff33;
      border: 1px solid #4aa5ff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      transition: all .3s;
    }
  }
}
.heroEasterMain#尤诺 {
  grid-template-columns: 2fr 2fr;
  gap: .5rem;
  .heroEaster {
    border: 1px dashed var(--color-tide-light);
    border-radius: 12px;
    padding: 1rem;
    flex-direction: column;
    display: flex;
    gap: 0.5rem;
    .easterHeader {
      justify-content: space-between;
    }
    .easterContent {
      flex-direction: column;
      display: flex;
      gap: 0.5rem;
    }
    .easterDetailCard.item-1#content-1,
    .easterDetailCard.item-2#content-1,
    .easterDetailCard.item-2#content-2 {
      margin-bottom: 0.25rem;
      padding-bottom: 0.25rem;
      border-bottom: 1px solid rgba(127, 211, 255, .1);
    }
    .easterP {
      border: 1px dashed var(--color-tide-light);
      padding: 0.5rem;
      border-radius: 0.5rem;
    }
  }
}
</style>
```

#tab2
**预览显示1**
::hero-timeline-easter
---
类型: '爱弥斯'
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: EMS-DATA
时间线:
  - 密钥: 1
    徽章: ["2.8版本"]
  - 密钥: 2
    徽章: ["3.0版本"]
  - 密钥: 3
    徽章: ["3.1版本"]
  - 密钥: 4
    徽章: ["时间闭环"]
彩蛋:
  - 密钥: 1
  - 密钥: 2
时间线内容: ["伏笔埋下", "初次登场", "真相揭晓", "因果循环"]
彩蛋内容: ["官方彩蛋 · 摩斯密码", "飞行雪绒 · 爱弥斯个人账号"]
---
#Timeline1
“那一晚上的失忆以及手的虚化”埋下爱弥斯相关伏笔

#Timeline2
第一次相遇即是告别

#Timeline3
“我不后悔，但还是...好舍不得你”

#Timeline4
“...别...难过...”

#easter1
<div>
官方OST《以虚无紧系因果》中隐藏摩斯密码，截取后翻译为`BCAKHOME`—— “回家”
</div>
#easter2
<div>
爱弥斯生前以“飞行雪绒”为网名分享原创歌曲，歌友会每年都会筹办
</div>
::

**预览显示2**
::hero-timeline-easter
---
类型: 尤诺
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: YOUNUO-DATA
时间线:
  - 密钥: 1
    徽章: ["幼年时期", "七丘 · 黎那汐塔"]
    标签: ["诞生", "预言", "天赋"]
  - 密钥: 2
    徽章: [青少年时期, 七丘四方殿]
    标签: ["成长", "反叛", "谕女"]
  - 密钥: 3
    徽章: [2.6版本前半, 桑古伊斯狩原]
    标签: ["牺牲", "黑潮", "记忆抹除"]
  - 密钥: 4
    徽章: [2.6版本中段, 混沌之间]
    标签: ["拯救", "循环", "记忆"]
  - 密钥: 5
    徽章: [2.6版本后半, 战场遗迹]
    标签: ["回归", "锚定", "自我"]

彩蛋:
  - 标题: 常驻点位1
    密钥: 1
    徽章: 牵手副本
    信息列表:
      触发地点: 往事花平野和赤林猎场中间的小岛
      地图坐标: 11497,13780,88
  - 标题: 常驻点位2
    密钥: 2
    徽章: 月下幽会
    信息列表:
      触发地点: 三王峰和往事花平野中间的小岛
      触发时间: 晚上8点到凌晨4点
      地图坐标: 11273,13744,304
时间线内容: ["月食之夜 · 谕女诞生", "四方殿 · 谕女之路", "黑潮狩猎 · 初次牺牲", "空白未来 · 唯一记忆者", "月相重圆 · 自我锚定"]
彩蛋内容: ["常驻点位1", "常驻点位2"]
---
#Timeline1
尤诺诞生于月亮沉没之夜，被预言为能看见绝对正确未来的天才谕女。母亲是前竞技冠军，父亲是著名锻造师。

#Timeline2
正式成为七丘第127位谕女，但拒绝穿传统礼袍，保持纱缎与黄金装饰，以命运对视者的姿态面对众人。

#Timeline3
为帮助漂泊者与奥古斯塔狩猎黑潮，使用锚定能力从世人记忆中被抹除，成为"不存在之人"。

#Timeline4
漂泊者成为唯一记得尤诺的人，踏上拯救之旅。尤诺在存在与消失的夹缝中循环经历自己的过去。

#Timeline5
尤诺以"先锚定自己，再锚定所有想逃的东西"的决心，重新将自己钉回世界，完成月相的回环与更迭。

#easter1
🌟 尤诺不同于主线会从灵体变成实体
<BR>
✨ 专属情侣空间的含金量
#easter2
🌟 隐藏成就「当天空是你眼睛的颜色」
<BR>
✨ 对话中有一句今晚月色真美（深情告白了属于是）
::
::

#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1

hero-timeline-easter属性

| 配置项   | 类型            | 说明                                         |
| ----- | ------------- | ------------------------------------------ |
| 类型    | '爱弥斯'<br>'尤诺' | 作为模块的显隐逻辑，并且还在一些`class`中作为`id`样式显示         |
| 顶部    | Array<顶部[]>   | 具有标题、副标题两类数据                               |
| 时间线   | Array<时间线[]>  | 作为显示时间线的模块                                 |
| 彩蛋    | Array<彩蛋[]>   | 作为显示彩蛋的模块                                  |
| 时间线内容 | string[]      | 作为驱动`solt :name`正常运转的核心数据，锚定了时间线的密钥来进行特定显示 |
| 彩蛋内容  | string[]      | 作为驱动`solt :name`正常运转的核心数据，锚定了彩蛋的密钥来进行特定显示  |


时间线属性

| 配置项 | 类型       | 说明                   |
| --- | -------- | -------------------- |
| 徽章  | string[] | 作为Badge的显示字段         |
| 标签  | string[] | 自定义字段                |
| 密钥  | number   | 锚定`时间线内容`的分页数据所需要的密钥 |

彩蛋属性

| 配置项  | 类型                     | 说明                  |
| ---- | ---------------------- | ------------------- |
| 图标   | string                 | 作为彩蛋开头，是用来显示        |
| 徽章   | string                 | 作为Badge的显示字段        |
| 密钥   | number<BR>string       | 锚定`彩蛋内容`的分页数据所需要的密钥 |
| 信息列表 | Record<string, string> |                     |

#tab2
::tab{:tabs='["写法1", "写法2"]'}
#tab1
``` md lang="md"
::hero-timeline-easter
---
类型: '爱弥斯'
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: EMS-DATA
时间线:
  - 密钥: 1
    徽章: ["2.8版本"]
  - 密钥: 2
    徽章: ["3.0版本"]
  - 密钥: 3
    徽章: ["3.1版本"]
  - 密钥: 4
    徽章: ["时间闭环"]
彩蛋:
  - 密钥: 1
  - 密钥: 2
时间线内容: ["伏笔埋下", "初次登场", "真相揭晓", "因果循环"]
彩蛋内容: ["官方彩蛋 · 摩斯密码", "飞行雪绒 · 爱弥斯个人账号"]
---
#Timeline1
“那一晚上的失忆以及手的虚化”埋下爱弥斯相关伏笔

#Timeline2
第一次相遇即是告别

#Timeline3
“我不后悔，但还是...好舍不得你”

#Timeline4
“...别...难过...”

#easter1
<div>
官方OST《以虚无紧系因果》中隐藏摩斯密码，截取后翻译为`BCAKHOME`—— “回家”
</div>
#easter2
<div>
爱弥斯生前以“飞行雪绒”为网名分享原创歌曲，歌友会每年都会筹办
</div>
::
```

#tab2
``` md lang="md"
::hero-timeline-easter
---
类型: 尤诺
顶部:
  标题: 官方剧情时间线 & 彩蛋
  副标题: YOUNUO-DATA
时间线:
  - 密钥: 1
    徽章: ["幼年时期", "七丘 · 黎那汐塔"]
    标签: ["诞生", "预言", "天赋"]
  - 密钥: 2
    徽章: [青少年时期, 七丘四方殿]
    标签: ["成长", "反叛", "谕女"]
  - 密钥: 3
    徽章: [2.6版本前半, 桑古伊斯狩原]
    标签: ["牺牲", "黑潮", "记忆抹除"]
  - 密钥: 4
    徽章: [2.6版本中段, 混沌之间]
    标签: ["拯救", "循环", "记忆"]
  - 密钥: 5
    徽章: [2.6版本后半, 战场遗迹]
    标签: ["回归", "锚定", "自我"]

彩蛋:
  - 标题: 常驻点位1
    密钥: 1
    徽章: 牵手副本
    信息列表:
      触发地点: 往事花平野和赤林猎场中间的小岛
      地图坐标: 11497,13780,88
  - 标题: 常驻点位2
    密钥: 2
    徽章: 月下幽会
    信息列表:
      触发地点: 三王峰和往事花平野中间的小岛
      触发时间: 晚上8点到凌晨4点
      地图坐标: 11273,13744,304
时间线内容: ["月食之夜 · 谕女诞生", "四方殿 · 谕女之路", "黑潮狩猎 · 初次牺牲", "空白未来 · 唯一记忆者", "月相重圆 · 自我锚定"]
彩蛋内容: ["常驻点位1", "常驻点位2"]
---
#Timeline1
尤诺诞生于月亮沉没之夜，被预言为能看见绝对正确未来的天才谕女。母亲是前竞技冠军，父亲是著名锻造师。

#Timeline2
正式成为七丘第127位谕女，但拒绝穿传统礼袍，保持纱缎与黄金装饰，以命运对视者的姿态面对众人。

#Timeline3
为帮助漂泊者与奥古斯塔狩猎黑潮，使用锚定能力从世人记忆中被抹除，成为"不存在之人"。

#Timeline4
漂泊者成为唯一记得尤诺的人，踏上拯救之旅。尤诺在存在与消失的夹缝中循环经历自己的过去。

#Timeline5
尤诺以"先锚定自己，再锚定所有想逃的东西"的决心，重新将自己钉回世界，完成月相的回环与更迭。

#easter1
🌟 尤诺不同于主线会从灵体变成实体
<BR>
✨ 专属情侣空间的含金量
#easter2
🌟 隐藏成就「当天空是你眼睛的颜色」
<BR>
✨ 对话中有一句今晚月色真美（深情告白了属于是）
::
```
::
::

### 共鸣链&&机制
::tab{:tabs='["组件代码", "组件预览"]'}
#tab1
``` vue [heroResonMecha] lang="vue"
<script setup lang="ts">
import Title from '../card/title.vue';

const props = defineProps<{
  元信息?: Array<{
    链度: number
    标题: string
  }>
  主体?: Array<{
    内容: string[]
    密钥: number
    类型: 'Reson' | 'Mecha'
    标题: string
  }>
}>()
const activeIndex = ref(0)
</script>

<template>
  <div class="heroResonMechaMain">
    <div class="heroResonMechaNav">
      <div 
        class="heroResonMechaNavItem" 
        v-for="(item, index) in 主体" 
        :key="index"
        @click="activeIndex = index"
        :class="{ active: activeIndex === index }"
      >
        <span>{{ item.标题 }}</span>
      </div>
    </div>
    <div class="heroResonMechaList" v-if="主体?.[activeIndex]">
      <div class="heroResonMechaCard" :id="主体?.[activeIndex]?.类型" v-for="card in 元信息" v-show="主体?.[activeIndex]?.类型 === 'Reson'">
        <div class="heroResonTitle">
          第{{card.链度}}链 · {{ card.标题 }}
        </div>
        <div class="heroResonContent" v-for="index in 主体?.[activeIndex]?.内容.length" v-show="card.链度 === index">
          <slot :name="`Reson${index}`" />
        </div>
      </div>
      <div class="heroResonMechaCard" :id="主体?.[activeIndex]?.类型" v-show="主体?.[activeIndex]?.类型 === 'Mecha'">
        <div class="heroMechaContent">
          <slot :name="`Mecha`" />
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.heroResonMechaMain {
  width: 100%;
  height: 320px;
  background: var(--ld-bg-card);
  border: 1px solid var(--c-border);
  border-radius: 0.75rem;
  margin: 1.5rem 0;
  overflow: hidden;
  transition: border-color 0.2s ease;
  display: flex;
  .heroResonMechaNav {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-start;
    padding: 1rem;
    width: 80px; 
    gap: 8px;    
    .heroResonMechaNavItem {
      cursor: pointer;
      width: 70px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      transition: all 0.2s ease;

      &:hover {
        background-color: var(--c-bg-hover); 
      }

      &.active {
        background-color: var(--c-bg-active); 
      }
    }
  }
  .heroResonMechaList {
    overflow: hidden;
    overflow-y: scroll; 
    margin-bottom: 1rem;
    margin-top: 1rem;
    padding-right: 1rem;
    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;
    .heroResonMechaCard#Reson {
      background: rgba(122, 92, 61, 0.08);
      border-radius: 6px;
      padding: 10px;
      margin-bottom: 10px;
      .heroResonContent {
        font-size: 0.9rem;
        margin: 0px;
        white-space: pre-wrap;
      }
    }
    .heroResonMechaCard#Mecha {
      padding: 10px;
      .heroMechaContent {
        font-size: 0.9rem;
        margin: 0px;
        white-space: pre-wrap;
        p {
          padding: 12px 0;
          border-bottom: 1px dashed rgba(255, 140, 176, .2);
          font-size: 0.78rem;
        }
      }
    }
  }
}

/* 移动端适配：屏幕宽度 ≤ 768px 时生效 */
@media (max-width: 768px) {
  .heroResonMechaMain {
    height: auto; /* 高度自适应内容 */
    flex-direction: column; /* 导航与列表垂直堆叠 */
  }

  .heroResonMechaNav {
    width: 100%; /* 导航占满宽度 */
    flex-direction: column;
    padding: 0.5rem; /* 减少内边距 */
    gap: 8px; 

    .heroResonMechaNavItem {
      width: 100%; /* 导航项宽度自适应 */
      height: 44px; /* 增大点击区域 */
      font-size: 0.875rem; /* 字体放大 */
      border-radius: 6px; /* 圆角微调 */
    }
  }

  .heroResonMechaList {
    width: 100%; /* 列表占满宽度 */
    margin: 0; /* 移除上下冗余边距 */
    padding: 0.5rem; /* 内边距缩小 */
    overflow-y: auto; /* 内容少时不显示滚动条 */

    &::-webkit-scrollbar {
      width: 0;
      background: transparent;
    }
    scrollbar-width: none;
    -ms-overflow-style: none;

    .heroResonMechaCard#Reson,
    .heroResonMechaCard#Mecha {
      margin-bottom: 0.75rem; /* 卡片间距缩小 */
      padding: 8px; /* 卡片内边距缩小 */
    }

    .heroResonContent,
    .heroMechaContent {
      font-size: 0.875rem; /* 整体字体缩小 */
      p {
        padding: 8px 0; /* 行间距缩小 */
        border-bottom: 1px dashed rgba(255, 140, 176, .2);
        font-size: 0.75rem; /* 行内字体再缩小 */
      }
    }
  }
}
</style>
```

#tab2
::hero-reson-mecha
---
主体:
  - 内容: ["如金粉般洒落的初煦", "如雪绒般漂浮的音符", "炽烈在静默间延展如初", "于无垠电子海间轻舞", "远航至那星海尽处", "春风祝颂你的旅途"]
    类型: Reson
    标题: 共鸣链
  - 内容: ["机制"]
    类型: Mecha
    标题: 机制
元信息:
  - 标题: 如金粉般洒落的初煦
    链度: 1
  - 标题: 如雪绒般漂浮的音符
    链度: 2
  - 标题: 炽烈在静默间延展如初
    链度: 3
  - 标题: 于无垠电子海间轻舞
    链度: 4
  - 标题: 远航至那星海尽处
    链度: 5
  - 标题: 春风祝颂你的旅途
    链度: 6
---
#Reson1

即刻响应状态下，重击·爱弥斯、重击·机兵暴击伤害提升300%，且蓄力期间可牵引周围的目标。

爱弥斯满足以下条件超过4秒时，获得即刻响应·辉芒状态。
·处于非战斗状态。
·未处于重击·爱弥斯、重击·机兵、共鸣解放星辉破界而来·终结施放状态。
即刻响应·辉芒拥有即刻响应的所有效果，且即刻响应·辉芒不会因星辉破界而来·于此释放状态结束而移除。
处于即刻响应·辉芒状态且不处于星辉破界而来·于此释放状态，施放重击·爱弥斯·二段蓄力或重击·机兵·二段蓄力时，可获得100点【同步率】。

处于共鸣模态·震谐/共鸣模态·聚爆时，爱弥斯自身施放的技能直接造成的伤害击败被附加震谐轨迹/聚爆轨迹状态的敌人时，获得轨迹封存·震谐/轨迹封存·聚爆状态，持续10秒。
轨迹封存·震谐/轨迹封存·聚爆状态下保留击败目标被附加震谐轨迹/聚爆轨迹的最高层数。
爱弥斯下一次自身施放的技能直接造成的伤害立即为命中目标附加对应层数的震谐轨迹/聚爆轨迹，最高可叠加至当前目标的震谐轨迹/聚爆轨迹层数上限，同时清除轨迹封存·震谐/轨迹封存·聚爆状态，1秒内无法再次获得轨迹封存·震谐/轨迹封存·聚爆。

#Reson2

共鸣技能光翼共奏·降临的伤害倍率提升100%。
共鸣技能光翼共奏·登台的伤害倍率提升100%。

处于共鸣模态·震谐，共鸣技能光翼共奏额外造成的震谐伤害命中目标时，使目标受到共鸣技能光翼共奏额外造成的震谐伤害倍率提升20%，持续1秒，最多叠加5层。

处于共鸣模态·聚爆获得以下强化：
·星屑共振状态对共鸣技能光翼共奏引爆的【聚爆效应】伤害倍率提升效果增强，对【聚爆效应】主目标的伤害倍率提升效果提升至400%。
·聚爆轨迹对共鸣技能光翼共奏引爆的【聚爆效应】伤害倍率提升效果增强，每层对【聚爆效应】主目标的伤害倍率提升效果提升至15%。
·处于战斗状态，队伍中登场角色附近的敌人被击败时，立即根据【聚爆效应】层数上限引爆【聚爆效应】。

#Reson3

共鸣解放星辉破界而来·终结的伤害倍率提升100%。
共鸣解放星辉破界而来·过载的伤害倍率提升40%。

处于即刻响应状态，施放重击·爱弥斯、重击·机兵时，根据自身处于共鸣模态·震谐/共鸣模态·聚爆，为附近目标附加【震谐·偏移】/【聚爆效应】。

固有技能星与星之间替换为以下效果：

·处于共鸣模态·震谐时，队伍中的角色附加【震谐·偏移】或造成震谐伤害时，爱弥斯暴击伤害提升60%，共鸣解放星辉破界而来·终结伤害加深25%。
角色编入队伍或切换模态时，重置该效果。

·处于共鸣模态·聚爆时，队伍中的角色附加【聚爆效应】时，爱弥斯暴击伤害提升60%，共鸣解放星辉破界而来·终结伤害加深25%。
角色编入队伍或切换模态时，重置该效果。

#Reson4

施放变奏技能以旋律穿越长空、变奏技能携星辉降临于此、共鸣技能合击·突刺、共鸣技能光翼共奏时，队伍中的角色全属性伤害加成提升20%，持续30秒。

#Reson5

爱弥斯自身技能直接造成的伤害击败目标时，【流溢辉光】重置为100%。

爱弥斯受到致命伤害时，将失去意识并进入二维电子幽灵状态，持续5秒。
进入二维电子幽灵状态时，为队伍中的角色提供爱弥斯360%攻击的护盾，持续5秒。退出二维电子幽灵状态时，爱弥斯将恢复意识并回复100%生命值与30点共鸣能量。该效果每10分钟可触发1次。
爱弥斯恢复意识时，退出二维电子幽灵状态并移除该效果提供的护盾。

#Reson6

目标受到爱弥斯的共鸣解放伤害提升40%。

处于共鸣模态·震谐时，爱弥斯的震谐伤害可暴击，暴击固定为80%，暴击伤害固定为275%。

处于共鸣模态·聚爆，并处于战斗状态，队伍中登场角色附近的敌人受到聚爆效应触发的伤害可暴击，暴击固定为80%，暴击伤害固定为275%。

共鸣回路为寂静赋形为目标附加震谐轨迹、聚爆轨迹层数翻倍。

处于共鸣模态·震谐/共鸣模态·聚爆，并处于战斗状态，队伍中登场角色附近的敌人震谐轨迹/聚爆轨迹层数上限提升至60层。爱弥斯施放共鸣技能光翼共奏期间，对范围内目标附加10层震谐轨迹/聚爆轨迹，持续30秒。

#Mecha
<p>
  共鸣模态·震谐下，可额外造成震谐伤害，拥有强力对单伤害能力。队伍中可响应震谐·干涉的角色越多，伤害越高。
</p>
<p>
  共鸣模态·聚爆下，可附加【聚爆效应】，拥有强力对群伤害能力。附加【聚爆效应】的频率越高，伤害越高。攻击可获得【同步率】。 
</p>
<p>
  【同步率】达50%时，在施放普攻第4段后，可消耗【同步率】施放强化合击，获得【共鸣率】。 
</p>
<p>
  【共鸣率】满时，可施放强化重击充满【同步率】。【同步率】、【共鸣率】都充满时，可施放终结共鸣解放。 
</p>
<p style="font-weight:bold;">
  输出流程：
</p>
<p> 
  基础流程：R-AAA-E【光翼共奏】-F-AA-E【光翼共奏】-Z-R-AAAA（后撤步切人） 
</p>
<p> 
  技能缩写：普攻 = A，重击 = Z，共鸣技能 = E，共鸣解放 = R，声骸 = Q 
</p>
::
::

#### 整体说明
::tab{:tabs='["配置项", "写法"]'}
#tab1
hero-reson-mecha属性

| 配置项 | 类型 | 说明 |
| ------ | ---- | ---- |
| 主体   | Array<类型[]> | 通过`Array`来分开各个模块内容 |

类型属性

| 配置项 | 类型                        | 说明              |
| --- | ------------------------- | --------------- |
| 类型  | <'爱弥斯' \| '尤诺' \| '奥古斯塔'> | 控制组件显隐逻辑        |
| 列表  | Array<列表>                 | 通过Array来分开并显示内容 |
| 导航  | 导航[]                      | 具有图标与名称两种配置     |

列表属性

| 配置项   | 类型                     | 说明                                                               |
| -------- | ------------------------ | ------------------------------------------------------------------ |
| 标题     | string                   | 无                                                                 |
| 密钥     | number                   | 通过`number`类型来显示出当前处于多少，并在共鸣链中会显示第几链     |
| 内容     | Record<string, string>   | 配置项处于无序类型，可自定义内容，可以用`-`与`随机:`两类配置项写法 |
| 额外内容 | Record<string, string>   | 该配置项采用`key`和`value`两种显示，只能使用`随机:`配置项写法      |

#tab2
``` md lang="md"
::hero-reson-mecha
---
主体:
  - 内容: ["如金粉般洒落的初煦", "如雪绒般漂浮的音符", "炽烈在静默间延展如初", "于无垠电子海间轻舞", "远航至那星海尽处", "春风祝颂你的旅途"]
    类型: Reson
    标题: 共鸣链
  - 内容: ["机制"]
    类型: Mecha
    标题: 机制
元信息:
  - 标题: 如金粉般洒落的初煦
    链度: 1
  - 标题: 如雪绒般漂浮的音符
    链度: 2
  - 标题: 炽烈在静默间延展如初
    链度: 3
  - 标题: 于无垠电子海间轻舞
    链度: 4
  - 标题: 远航至那星海尽处
    链度: 5
  - 标题: 春风祝颂你的旅途
    链度: 6
---
#Reson1

即刻响应状态下，重击·爱弥斯、重击·机兵暴击伤害提升300%，且蓄力期间可牵引周围的目标。

爱弥斯满足以下条件超过4秒时，获得即刻响应·辉芒状态。
·处于非战斗状态。
·未处于重击·爱弥斯、重击·机兵、共鸣解放星辉破界而来·终结施放状态。
即刻响应·辉芒拥有即刻响应的所有效果，且即刻响应·辉芒不会因星辉破界而来·于此释放状态结束而移除。
处于即刻响应·辉芒状态且不处于星辉破界而来·于此释放状态，施放重击·爱弥斯·二段蓄力或重击·机兵·二段蓄力时，可获得100点【同步率】。

处于共鸣模态·震谐/共鸣模态·聚爆时，爱弥斯自身施放的技能直接造成的伤害击败被附加震谐轨迹/聚爆轨迹状态的敌人时，获得轨迹封存·震谐/轨迹封存·聚爆状态，持续10秒。
轨迹封存·震谐/轨迹封存·聚爆状态下保留击败目标被附加震谐轨迹/聚爆轨迹的最高层数。
爱弥斯下一次自身施放的技能直接造成的伤害立即为命中目标附加对应层数的震谐轨迹/聚爆轨迹，最高可叠加至当前目标的震谐轨迹/聚爆轨迹层数上限，同时清除轨迹封存·震谐/轨迹封存·聚爆状态，1秒内无法再次获得轨迹封存·震谐/轨迹封存·聚爆。

#Reson2

共鸣技能光翼共奏·降临的伤害倍率提升100%。
共鸣技能光翼共奏·登台的伤害倍率提升100%。

处于共鸣模态·震谐，共鸣技能光翼共奏额外造成的震谐伤害命中目标时，使目标受到共鸣技能光翼共奏额外造成的震谐伤害倍率提升20%，持续1秒，最多叠加5层。

处于共鸣模态·聚爆获得以下强化：
·星屑共振状态对共鸣技能光翼共奏引爆的【聚爆效应】伤害倍率提升效果增强，对【聚爆效应】主目标的伤害倍率提升效果提升至400%。
·聚爆轨迹对共鸣技能光翼共奏引爆的【聚爆效应】伤害倍率提升效果增强，每层对【聚爆效应】主目标的伤害倍率提升效果提升至15%。
·处于战斗状态，队伍中登场角色附近的敌人被击败时，立即根据【聚爆效应】层数上限引爆【聚爆效应】。

#Reson3

共鸣解放星辉破界而来·终结的伤害倍率提升100%。
共鸣解放星辉破界而来·过载的伤害倍率提升40%。

处于即刻响应状态，施放重击·爱弥斯、重击·机兵时，根据自身处于共鸣模态·震谐/共鸣模态·聚爆，为附近目标附加【震谐·偏移】/【聚爆效应】。

固有技能星与星之间替换为以下效果：

·处于共鸣模态·震谐时，队伍中的角色附加【震谐·偏移】或造成震谐伤害时，爱弥斯暴击伤害提升60%，共鸣解放星辉破界而来·终结伤害加深25%。
角色编入队伍或切换模态时，重置该效果。

·处于共鸣模态·聚爆时，队伍中的角色附加【聚爆效应】时，爱弥斯暴击伤害提升60%，共鸣解放星辉破界而来·终结伤害加深25%。
角色编入队伍或切换模态时，重置该效果。

#Reson4

施放变奏技能以旋律穿越长空、变奏技能携星辉降临于此、共鸣技能合击·突刺、共鸣技能光翼共奏时，队伍中的角色全属性伤害加成提升20%，持续30秒。

#Reson5

爱弥斯自身技能直接造成的伤害击败目标时，【流溢辉光】重置为100%。

爱弥斯受到致命伤害时，将失去意识并进入二维电子幽灵状态，持续5秒。
进入二维电子幽灵状态时，为队伍中的角色提供爱弥斯360%攻击的护盾，持续5秒。退出二维电子幽灵状态时，爱弥斯将恢复意识并回复100%生命值与30点共鸣能量。该效果每10分钟可触发1次。
爱弥斯恢复意识时，退出二维电子幽灵状态并移除该效果提供的护盾。

#Reson6

目标受到爱弥斯的共鸣解放伤害提升40%。

处于共鸣模态·震谐时，爱弥斯的震谐伤害可暴击，暴击固定为80%，暴击伤害固定为275%。

处于共鸣模态·聚爆，并处于战斗状态，队伍中登场角色附近的敌人受到聚爆效应触发的伤害可暴击，暴击固定为80%，暴击伤害固定为275%。

共鸣回路为寂静赋形为目标附加震谐轨迹、聚爆轨迹层数翻倍。

处于共鸣模态·震谐/共鸣模态·聚爆，并处于战斗状态，队伍中登场角色附近的敌人震谐轨迹/聚爆轨迹层数上限提升至60层。爱弥斯施放共鸣技能光翼共奏期间，对范围内目标附加10层震谐轨迹/聚爆轨迹，持续30秒。

#Mecha
<div class="MechaInfo">
  <p>
    共鸣模态·震谐下，可额外造成震谐伤害，拥有强力对单伤害能力。队伍中可响应震谐·干涉的角色越多，伤害越高。
  </p>
  <p>
    共鸣模态·聚爆下，可附加【聚爆效应】，拥有强力对群伤害能力。附加【聚爆效应】的频率越高，伤害越高。攻击可获得【同步率】。 
  </p>
  <p>
    【同步率】达50%时，在施放普攻第4段后，可消耗【同步率】施放强化合击，获得【共鸣率】。 
  </p>
  <p>
    【共鸣率】满时，可施放强化重击充满【同步率】。【同步率】、【共鸣率】都充满时，可施放终结共鸣解放。 
  </p>
  <p style="font-weight:bold;">
    输出流程：
  </p>
  <p> 
    基础流程：R-AAA-E【光翼共奏】-F-AA-E【光翼共奏】-Z-R-AAAA（后撤步切人） 
  </p>
  <p> 
    技能缩写：普攻 = A，重击 = Z，共鸣技能 = E，共鸣解放 = R，声骸 = Q 
  </p>
</p>
<style lang="scss">
.MechaInfo {
  font-size: 0.9rem;
  margin: 0px;
  white-space: pre-wrap;
}
</style>
::
```
::

## 补充样式
因为需要精简scss样式，同时为部分需要用到样式的组件来说比较适配一些
::tab{:tabs='["动画样式", "颜色样式"]'}
#tab1
``` scss lang="scss"
/* KeyFrames动画封装样式 */

/* 鸣潮档案组件 */
/* 来源于霜落映界(http://36.150.237.25/) */

/* 角色信息模块动画 */
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
```

#tab2
``` scss lang="scss"
/* 颜色样式 */
.WuWuGameColor#尤诺 {
  --color-cosmic-deep: #050a14;
  --color-starry-night: #0d1b2a;
  --color-lunar-silver: #c2d6e6;
  --color-moonlight: #e6f2ff;
  --color-tide-blue: #2e88c9;
  --color-tide-light: #7fd3ff;
  --color-nebula-purple: #4a235a;
  --color-constellation: rgba(127, 211, 255, .8);
  --card-bg: rgba(15, 25, 45, .7);
  --card-border: rgba(127, 211, 255, .4);
  --card-shadow: 0 20px 60px rgba(5, 10, 30, .5);
  --section-spacing: clamp(3rem, 6vw, 5rem);
  --card-radius: 1.5rem;
  --transition-smooth: all .4s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  // background: var(--color-cosmic-deep);
  // color: var(--color-moonlight);
  padding-top: 60px;
}
.WuWuGameColor#爱弥斯 {
  --pink-core: #ff8cb0;
  --pink-light: #ffb3cc;
  --pink-glow: #ffb6d9;
  --blue-glitch: #6ed4ff;
  --blue-glow: #9ae2ff;
  --purple-mid: #e0a0ff;
  --white-glow: #fbefff;
  --bg-deep: linear-gradient(145deg, #1a1028 0%, #281e30 100%);
  --grid-color: rgba(255, 140, 176, .15);
  --glitch-shadow: rgba(110, 212, 255, .5);
  --heart-glow: rgba(255, 140, 176, .7);  
}
```
::

## 更新日志
**V20260313-PRE**
- 1.优化`人物组件`，对混乱无序的模板、数据与样式重新优化

**V20260313-PRE**
- 1.全线优化`时间线&彩蛋组件`，对描述进行`solt`化使可以通过调用`#Timeline[1-无上限]`，即可被计入到文章字数内
- 2.`时间线&彩蛋组件`的数据框架进行优化，实现了无需写入过于麻烦的配置项（即`-`或`标签1`写法）
- 3.对部分组件需要用到的颜色样式写入到scss统一管理样式中

**V20260311-PRE**
- 1.在`共鸣链&机制组件`中新增`尤诺`角色类型`共鸣链`与`机制`的适配，对`机制`切分为4项核心机制与角色手法信息相结合，并且使用`string[]`来进行显示首发对应框显示内容。
- 2.锁死`共鸣链&机制组件`中的`机制`一栏中具体键位对应表内容

**V20260310-PRE**
- 1.在`时间线&彩蛋组件`中新增`尤诺`角色类型`时间线`与`菜单`适配，对时间线的显示列表进行适配，并添加小标签。同样，本站在彩蛋的基础上进行适配，除了展示出简介以外还有具体的信息列表，而且对标题上的标签进行分开，以此来呈现出具体效果。
::pic
---
src: /image/PostInternal/2026/WutheringWavesPostWidget/heroTimelineEaster/younuo.png
# mirror: # 是否借助第三方图片加载服务，见源代码
caption: 说明文字，还支持通过 width 或 height 属性指定尺寸
# zoom: false # 是否开启灯箱缩放，默认开启
---
::
- 2.优化`时间线&彩蛋组件`中的样式混乱，更新迭代全新数据表，为后续的适配准备
- 3.优化`时间线&彩蛋组件`、`共鸣链&机制组件`中的标题显示变量，采用类TAB分栏显示，更加轻量化。
- 4.优化`时间线&彩蛋组件`、`共鸣链&机制组件`中的部分变量，清除过久的代码，以防出现后续无法解读作用的代码（样式保留）。

**V20260309-PRE**
- 1.优化`时间线&彩蛋组件`，对彩蛋中的内容进行`solt`化（即在配置项外中的标签中的MD写法转译渲染成class）
- 2.优化`时间线&彩蛋组件`配置项混乱无序的写法，去除不必要的配置项
- 3.调整`时间线&彩蛋组件`、`共鸣链&机制组件`、`物品组件`、`信息组件`、`故事组件`对各个角色的适配，由于已经`solt`文本化所以废弃了大量依靠对文本适配的配置项，部分组件保留角色类型。对特定类型角色进行单独css适配，极大简洁化浏览。
- 4.新增`莫宁`、`琳奈`、`尤诺`、`奥古斯塔`角色类型，`爱弥斯`类型完全完善无需更改
- 5.优化文章配置项具体内容
- 6.对文章中的部分组件预览进行修改

**V20260308-PRE**
- 1.修复`共鸣链&机制组件`中的简介未能计入字数的问题
- 2.优化`共鸣链&机制组件`配置项，并且采用`mdc config` + `mdc content`的写法

**V20260307-PRE**
- 1.修复`物品组件`中的简介未能计入字数的问题
- 2.优化`物品组件`配置项，并且采用`mdc config` + `mdc content`的写法

**V20260307-PRE**
- 1.修复`信息组件`中的简介未能计入字数的问题
- 2.修复`故事组件`中的每个章节未能计入字数的问题
- 3.取消`信息组件`、`故事组件`中对于部分繁琐的配置项信息，并且采用`mdc config` + `mdc content`的写法
- 4.对全部组件进行配置项删除

**V20260306-PRE**
- 1.针对`爱弥斯`的人物模块中的`档案`部分的`副标题`样式进行调整
- 2.对`物品组件`进行优化并加入多个角色类型，并使用复合型组件来兼容多个数据类型

**V20260304-PRE**
- 1.优化部分组件样式

**V20260227-PRE**
- 1.添加新模块，并更新具体配置项与组件写法
- 2.优化新组件中的移动端
- 3.优化切换方式

**V20260225-PRE**
- 1.添加全新模块，并且更新了新模块的配置
- 2.更新全部模块的样式，并且使用复合型TS配置项`部分`
- 3.更新文章中旧配置项，并且出现写入配置项
- 4.更新部分模块中的显隐逻辑
- 5.浓缩部分新模块配置项

**V20260224-PRE**
- 1.更新了相关配置项的使用方式
- 2.更新了模块在文章中的写法

**V20260223-PRE**
- 1.更新基础模块，并且优化部分逻辑
- 2.更新一些配置项，取消部分未使用的样式
