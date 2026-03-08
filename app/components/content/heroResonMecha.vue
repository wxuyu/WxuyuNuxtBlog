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