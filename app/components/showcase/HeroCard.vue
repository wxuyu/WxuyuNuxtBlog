<template>
  <div class="hero-card">
    <!-- 挂绳装饰 -->
    <div class="card-top-decoration"></div>

    <!-- 卡牌主体 -->
    <div class="card-frame">
      <!-- 已拥有标签 -->

      <!-- 角色图像 -->
      <div class="hero-image-container">
        <img :src="hero.image" :alt="hero.name" class="hero-image" />
        <!-- 可选：添加光晕效果 -->
        <div class="image-glow"></div>
      </div>

      <!-- 角色名称 -->
      <div class="hero-name">{{ hero.name }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  hero: {
    id: number
    name: string
    image: string
    owned: boolean
  }
}>()
</script>

<style scoped>
.hero-card {
  width: 140px;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 顶部挂绳装饰 */
.card-top-decoration {
  width: 60px;
  height: 16px;
  background: linear-gradient(to bottom, #d4af37, #b8860b);
  border-radius: 50% 50% 0 0;
  position: absolute;
  top: -8px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

/* 卡牌外框 */
.card-frame {
  width: 100%;
  aspect-ratio: 3/4;
  background: linear-gradient(135deg, #5c0a1e 0%, #8b1538 50%, #c73e6d 100%);
  border: 3px solid #f0c674;
  border-radius: 12px;
  padding: 8px;
  box-shadow: 
    0 6px 18px rgba(0,0,0,0.5),
    inset 0 0 20px rgba(255,255,255,0.1);
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: white;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
}

/* 已拥有标签 */
.owned-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  background: #4a9c5d;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  z-index: 5;
}

/* 角色图像容器 */
.hero-image-container {
  width: 100%;
  height: 70%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #fff;
  border-radius: 8px;
  overflow: hidden;
  background: rgba(0,0,0,0.2);
  box-shadow: inset 0 0 15px rgba(255,255,255,0.2);
}

.hero-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center top;
  filter: brightness(1.05) contrast(1.1);
}

/* 图像光晕效果（可选） */
.image-glow {
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.3) 0%, transparent 70%);
  pointer-events: none;
  z-index: 1;
}

/* 角色名称 */
.hero-name {
  margin-top: 8px;
  font-size: 16px;
  font-weight: bold;
  color: #ffd700;
  text-shadow: 0 2px 4px rgba(0,0,0,0.8);
  letter-spacing: 1px;
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .hero-card {
    width: 120px;
  }
  .hero-name {
    font-size: 14px;
  }
}
</style>