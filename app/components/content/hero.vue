<script setup lang="ts">
import Title from '../card/title.vue';
const props = defineProps<{
  类型: "爱弥斯" | "尤诺" | "奥古斯塔" | "莫宁"
  头像: string
  徽章: Record<string, string>
  名字: string
  标签: Record<string, string>
  简介: string[]
  详情信息: Record<string, string>
  档案: {
    具体信息: Array<{
      序号: number
      徽章: string
      信息: string[]
      栏目标题: string
    }>
    外挂信息: {
      简介: string[]
    }
    顶栏信息: {
      主标题: string
    }
  }
}>();
</script>

<template>
  <div class="heroMain WuWuGameColor">
    <div class="heroCard">
      <div class="leftInfo">
        <NuxtImg class="avatarImage" :src="头像" />
        <h3 class="avatarName">
          {{ 名字 }}
        </h3>
        <div class="avatarMeta">
          <span class="MetaSpan" v-for="([key, value]) in Object.entries(徽章 ?? {})" :key="key">
            {{key}}：{{value }}
          </span>
        </div>
      </div>
      <div class="rightInfo">
        <div class="panelMain">
          <Title title="简介"></Title>
          <div class="heroDesc">
            <slot :name="`desc`" />
          </div>
          <Title title="标签"></Title>
          <span class="tagItem" style="margin-top: 0.5em;margin-bottom: 0.5em;">
            <span class="tag" v-for="([key, value]) in Object.entries(标签 ?? {})" :key="key">
              #{{ value }}
            </span>
          </span>
          <Title title="详情信息"></Title>
          <div class="infoMain" :id="类型">
            <div
              class="infoCard"
              v-for="([key, value]) in Object.entries(详情信息 ?? {})"
              :key="key"
            >
              <div class="infoLabel">{{ key }}</div>
              <div class="infoValue">{{ value }}</div>
            </div>
          </div>
          <Title :title="`${档案?.顶栏信息.主标题}`"></Title>
          <div class="statusMain" style="margin-top: 0.5em;" v-for="data in 档案?.具体信息" :id="类型" :key="data.序号">
            <div class="statusHeader" :id="类型">
              <div class="HeaderTitle" v-for="([key, value], index) in Object.entries(档案.外挂信息.简介 ?? {})" v-show="data.序号 === index + 1">
                {{ value }}
              </div>
              <div class="HeaderSub" style="font-size: 0.5em;" :id="`sub` + data.序号">
                {{ data.徽章 }}
              </div>
            </div>
            <div class="statusContent" v-show="类型 !== '莫宁'">
              <div v-for="statusIndex in 档案?.外挂信息.简介.length" v-show="data.序号 === statusIndex">
                <slot :name="`status${statusIndex}`" />
              </div>
            </div>
            <div class="statusContent" v-show="类型 === '莫宁'" :id="类型">
              <div class="statusContentHeader">
                <div class="contentTitle">
                  {{ data.栏目标题 }}
                </div>
              </div>
              <div class="statusContentCard">
                <div class="contentLabel" v-for="([key, value], index) in Object.entries(data.信息 ?? {})" v-show="data.序号 === index + 1">
                  {{ value }}
                </div>
                <div class="contentValue" v-for="bodyMain in data.信息?.length" v-show="data.序号 === bodyMain">
                  <slot :name="`info${bodyMain}`" />
                </div>
              </div>
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
  .infoMain#爱弥斯 {
    grid-template-columns: repeat(4, 1fr);
  }
  .infoMain#尤诺 {
    grid-template-columns: repeat(3, 1fr);
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
    .statusHeader#爱弥斯 {
      display: flex;
      .HeaderSub#sub1 {
        font-size: 0.5em;
        font-size: .75rem;
        background: #f003;
        color: #ff6b85;
        padding: 2px 6px;
        border-radius: 4px;
      }
    }
    .statusHeader#尤诺 {
      margin-bottom: 12px;
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
</style>