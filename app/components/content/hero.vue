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