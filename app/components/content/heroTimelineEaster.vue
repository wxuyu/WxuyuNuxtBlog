<script setup lang="ts">
import Title from '../card/title.vue';
import Badge from './Badge.vue';

defineProps<{
  类型?: '爱弥斯' | '莫宁'
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
    密钥?: number | string
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
      <div class="heroTimelineList" v-show="类型 === '爱弥斯'">
        <div class="heroTimelineMain" v-for="(main, index) in 时间线" :key="index">
          <div class="heroTimelineCard" v-for="([key, value]) in Object.entries(main.信息 ?? {})" :key="key">
            <div class="heroTimelineLabel">
              {{ key }}<Badge :text="`${main.标签}`" />
            </div>
            <div class="heroTimelineValue">{{ value }}</div>
          </div>
        </div>
      </div>

      <div class="heroEasterMain" :id="类型">
        <div class="heroEaster" v-show="类型 === '爱弥斯' || 类型 === '莫宁'" v-for="main in 彩蛋" :id="类型">
          <div class="easterNumber" v-show="类型 === '莫宁'">
            {{ main.密钥 }}
          </div>
          <div class="easterHeader">
            <!-- <span v-show="类型 === '爱弥斯'" class="easterIcon" id="ams">{{ main.图标 }}</span> -->
            <span class="esterTitle">{{ main.标题 }}</span>
          </div>
          <div class="easterContent">
            <div class="easterP" :id="类型" v-for="Index in 彩蛋内容?.length" v-show="main.密钥 === Index">
              <slot :name="`easter${Index}`"/>
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
      border-radius: 0.4em;
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
</style>