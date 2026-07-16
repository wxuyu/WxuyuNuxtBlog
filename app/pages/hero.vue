<template>
  <div class="container">
    <!-- 品质筛选栏 -->
    <div class="quality-filter">
      <div class="quality-btn">金</div>
      <div class="quality-btn">橙金</div>
      <div class="quality-btn">紫</div>
      <div class="quality-btn">蓝</div>
      <div class="quality-btn">绿</div>
      <div class="quality-btn">粉</div>
      <div class="quality-btn">红</div>
      <div class="quality-btn">金</div>
      <div class="quality-btn">红</div>
      <div class="quality-btn">橙</div>
    </div>

    <!-- 排序提示 -->
    <div class="sort-hint">品质由高到低排列</div>
  </div>
</template>

<script setup lang="ts">

// 可选：动态加载图片（如需）
// const images = import.meta.glob('~/assets/images/*.png', { eager: true })
</script>

<style lang="scss" scoped>
/* 全局样式 */
body {
  margin: 0;
  font-family: 'Microsoft YaHei', sans-serif;
  background: #2a1a10;
  color: #fff;
}

.container {
  max-width: 1200px;
  margin: 20px auto;
  padding: 20px;
}

/* 品质筛选栏 */
.quality-filter {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.quality-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: #d4a060;
  border: 2px solid #8b5a2b;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  color: #fff;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0,0,0,0.3);
}

.quality-btn:hover {
  transform: scale(1.1);
}

/* 排序提示 */
.sort-hint {
  text-align: center;
  font-size: 14px;
  color: #ccc;
  margin-bottom: 20px;
  position: relative;
}

.sort-hint::before,
.sort-hint::after {
  content: "◀";
  margin: 0 5px;
  font-size: 12px;
}

/* 武将卡片网格 */
.hero-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
  justify-items: center;
}

.hero-card {
  width: 180px;
  height: 280px;
  position: relative;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  background: linear-gradient(135deg, #3a2a18, #2a1a10);
  border: 2px solid #8b5a2b;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
}

.hero-card img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  border-radius: 6px;
  margin-bottom: 8px;
}

.hero-name {
  font-size: 16px;
  font-weight: bold;
  color: #fff;
  text-shadow: 0 1px 3px rgba(0,0,0,0.7);
  margin: 0;
}

.status-tag {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
  color: white;
}

.status-owned {
  background: #4CAF50;
}

.status-not-owned {
  background: #F44336;
}

/* 响应式 */
@media (max-width: 768px) {
  .hero-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .hero-card {
    width: 140px;
    height: 240px;
  }
  .hero-card img {
    height: 150px;
  }
}
</style>