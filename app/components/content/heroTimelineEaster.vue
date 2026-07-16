<script setup lang="ts">
import type { __String } from 'typescript';
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
        <showcase-section-title :title="`${顶部?.标题}`" />
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