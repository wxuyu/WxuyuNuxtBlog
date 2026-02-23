<script setup lang="ts">
defineProps<{
  类型: "爱弥斯" | "尤诺" | "奥古斯塔";
  头像?: string;
  共鸣能力?: string;
  名字?: string;
  称号?: string;
  标签?: Record<string, string>;
  简介?: { 上部分?: string; 下部分?: string };
  详情信息?: Record<string, string>;
}>();
</script>

<template>
  <div class="heroMain">
    <div class="leftInfo">
      <NuxtImg class="avatarImage" :src="头像" />
      <div class="avatarMeta">
        <span class="MetaSpan">共鸣能力：{{ 共鸣能力 }}</span>
      </div>
    </div>
    <div class="rightInfo">
      <div class="panelMain">
        <h1 class="heroName" :data-text="名字">
          {{ 名字 }}
          <span class="heroTitle">（{{ 称号 }}）</span>
        </h1>
        <p class="heroDesc">
          {{ 简介?.上部分 }}<span class="lightDesc">{{ 称号 }}</span
          >{{ 简介?.下部分 }}
        </p>
        <span class="tagItem">
          <span class="tag" v-for="([key, value]) in Object.entries(标签 ?? {})" :key="key">
            #{{ value }}
          </span>
        </span>
        <div class="statusMain">
          <div
            class="statusCard"
            v-for="([key, value]) in Object.entries(详情信息 ?? {})"
            :key="key"
          >
            <div class="statusLabel">{{ key }}</div>
            <div class="statusValue">{{ value }}</div>
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

  // 主题色定义（保持原风格）
  --pink-core: #ff8cb0;
  --pink-light: #ffb3cc;
  --pink-glow: #ffb6d9;
  --blue-glitch: #6ed4ff;
  --blue-glow: #9ae2ff;
  --purple-mid: #e0a0ff;
  --white-glow: #fbefff;
  --bg-deep: linear-gradient(145deg, #1a1028 0%, #281e30 100%);
  --grid-color: rgba(255, 140, 176, 0.15);
  --glitch-shadow: rgba(110, 212, 255, 0.5);
  --heart-glow: rgba(255, 140, 176, 0.7);

  // 左侧信息区（头像+共鸣能力）
  .leftInfo {
    display: grid;
    grid-template-rows: auto auto; // 垂直排列两行
    gap: 8px;
    align-items: center;
    justify-items: center;
    border-radius: 16px;
    padding: 12px;
    border: 2px solid transparent;
    background-clip: padding-box;
    animation: cursorAnimation_link 1s infinite step-start;
    transition: all 0.3s;
    width: 100%;
    position: relative;

    .avatarImage {
      width: 100%;
      height: auto;
      border-radius: 12px;
      display: block;
    }

    .avatarMeta {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;
      flex-wrap: wrap;

      .MetaSpan {
        font-size: 0.9rem;
        background: #ff8cb01a;
        padding: 6px 10px;
        border-radius: 10px;
        border: 1px solid var(--pink-core);
        font-weight: 600;
      }
    }
  }

  // 右侧信息区（名称+描述+状态卡）
  .rightInfo {
    display: flex;
    flex-direction: column;
    gap: 12px;
    z-index: 6;
    overflow-y: scroll; // 桌面端滚动
    scrollbar-width: none; // 隐藏Firefox滚动条

    .panelMain {
      position: relative;
      z-index: 6;
      padding: 24px;
      border-radius: 16px;

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
  .statusMain {
    background: transparent;
    border-radius: 0;
    display: grid;
    font-size: 1rem;
    gap: 0.4rem;
    grid-template-columns: repeat(2, 1fr);
    padding: 0;

    .statusCard {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;

      .statusLabel {
        color: var(--c-text-2);
        font-size: 1rem;
        font-weight: 500;
      }

      .statusValue {
        color: var(--c-text);
        font-size: 1rem;
        word-break: break-word;
      }
    }
  }

}

/* ========== 移动端适配（max-width: 768px） ========== */
@media screen and (max-width: 768px) {
  .heroMain {
    flex-direction: column; // 改为垂直堆叠
    height: auto; // 高度自适应内容
    margin: 1rem 0; // 缩小上下边距
    border-radius: 0.5rem;
    overflow: hidden; // 防止内部滚动溢出
  }

  // 左侧信息区适配
  .leftInfo {
    width: 100%;
    padding: 8px;
    border-radius: 12px;
    gap: 6px; // 缩小子元素间距

    .avatarImage {
      width: 120px; // 缩小头像尺寸
      height: 120px;
      border-radius: 10px;
    }

    .avatarMeta {
      font-size: 0.8rem; // 缩小文字
      gap: 6px;

      .MetaSpan {
        padding: 4px 8px; // 缩小内边距
        font-size: 0.8rem;
        border-radius: 8px;
      }
    }
  }

  // 右侧信息区适配
  .rightInfo {
    flex-direction: column;
    gap: 8px; // 缩小与左侧间距
    padding: 0;

    .panelMain {
      padding: 16px; // 缩小内边距
      border-radius: 12px;

      .heroName {
        font-size: clamp(1.2rem, 2.5vw, 1.8rem); // 缩小字体范围
        letter-spacing: 0.5px;
        line-height: 1.2;

        .heroTitle {
          font-size: 0.8rem; // 缩小副标题
          margin-left: 6px;
        }
      }

      .heroDesc {
        font-size: 0.9rem; // 缩小描述文字
        line-height: 1.4;

        .lightDesc {
          font-size: 0.9rem;
        }
      }
    }
  }

  // 状态卡片适配（单列布局）
  .statusMain {
    grid-template-columns: 1fr; // 单列
    gap: 0.2rem; // 缩小卡片间距
    font-size: 0.8rem; // 缩小文字

    .statusCard {
      gap: 0.1rem; // 缩小卡片内间距

      .statusLabel,
      .statusValue {
        font-size: 0.8rem; // 缩小标签和内容文字
      }
    }
  }

  // 隐藏滚动条（可选，提升移动端体验）
  .rightInfo::-webkit-scrollbar {
    display: none;
  }
  .rightInfo {
    overflow-y: auto; // 改为自动滚动
  }
}
// 动效模块
@keyframes glitch-b7066fb5 {
  0% {
    transform: translate(0);
    text-shadow: -2px 0 var(--blue-glitch), 2px 2px var(--pink-core)
  }

  20% {
    transform: translate(-2px, 2px);
    text-shadow: 2px -2px var(--blue-glitch), -2px 2px var(--pink-core)
  }

  40% {
    transform: translate(2px, -2px);
    text-shadow: -2px 2px var(--blue-glitch), 2px -2px var(--pink-core)
  }

  60% {
    transform: translate(0);
    text-shadow: 2px 0 var(--blue-glitch), -2px -2px var(--pink-core)
  }

  80% {
    transform: translate(2px, 2px);
    text-shadow: -2px -2px var(--blue-glitch), 2px 0 var(--pink-core)
  }

  to {
    transform: translate(0);
    text-shadow: none
  }
}

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