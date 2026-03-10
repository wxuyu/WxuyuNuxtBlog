<script setup lang="ts">
import type { __String } from 'typescript';
import Title from '../card/title.vue';
import Badge from './Badge.vue';

const props = defineProps<{
  类型?: '爱弥斯' | '莫宁' | '尤诺'
  顶部?: {
    标题?: string
    副标题?: string
  }
  时间线?: Array<{
    小标签: string
    内容: Record<string, string>
    大标签: string
  }>
  彩蛋?: Array<{
    图标?: string
    徽章?: string
    密钥?: number | string
    信息列表?: Record<string, string>
  }>
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
        <div class="heroTimelineMain" v-for="(main, index) in 时间线" :key="index">
          <div class="heroTimelineCard" v-for="([key, value]) in Object.entries(main.内容 ?? {})" :key="key">
            <div class="heroTimelineLabel">
              {{ key }}<Badge :text="`${main.大标签}`" />
            </div>
            <div class="heroTimelineValue">{{ value }}</div>
            <!-- 特定标签位置||未写完 -->
            <div class="heroTimelineTag" v-show="类型 === '尤诺'">
              <span class="heroTimelineTagList" v-for="([key, value]) in Object.entries(main.小标签 ?? {})" :key="key">
                <slot class="text">
                  {{ value }}
                </slot>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div class="heroEasterMain" :id="类型">
        <div class="heroEaster heroColor" v-for="main in 彩蛋" :id="类型">
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
      gap: 0.5em;
      @media (max-width: 560px) {
        grid-template-columns: repeat(1, 1fr);
      }
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
.heroEaster#爱弥斯 {
  background: #ff8cb00d;
  border: 1px dashed var(--pink-core);
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
    background: var(--card-bg);
    border: 1px solid var(--card-border);
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
      background: #14233c80;
      border-left: 3px solid var(--color-tide-light);
      padding: 1rem;
      border-radius: .5rem;
    }
  }
}

/* 颜色样式 */
.heroColor#尤诺 {
  --color-cosmic-deep: #050a14;
  --color-starry-night: #0d1b2a;
  --color-lunar-silver: #c2d6e6;
  --color-moonlight: #e6f2ff;
  --color-tide-blue: #2e88c9;
  --color-tide-light: #7fd3ff;
  --color-nebula-purple: #4a235a;
  --color-constellation: rgba(127, 211, 255, .8);
  --card-bg: rgba(15, 25, 45, .7);
  --card-border: rgba(127, 211, 255, .1);
  --card-shadow: 0 20px 60px rgba(5, 10, 30, .5);
  --section-spacing: clamp(3rem, 6vw, 5rem);
  --card-radius: 1.5rem;
  --transition-smooth: all .4s cubic-bezier(.4, 0, .2, 1);
  position: relative;
  background: var(--color-cosmic-deep);
  color: var(--color-moonlight);
  padding-top: 60px;
}
</style>