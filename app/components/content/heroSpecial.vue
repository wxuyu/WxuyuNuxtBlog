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