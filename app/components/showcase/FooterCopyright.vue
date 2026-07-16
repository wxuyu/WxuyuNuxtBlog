<script setup lang="ts">
const appConfig = useAppConfig()
const footerGroup = [{
  label: "萌ICP备20251949号",
  tip: "前往萌国ICP备案进行查询",
  url: "https://icp.gov.moe/"
},{
  label: "业务状态",
  tip: "前往查看状态",
  url: "https://kuma.wxuyu.top"
}]
</script>

<template>
  <div class="copyrightCard">
    <div class="copyrightNav">
      <div class="timeLoad">
        <div class="Powerby">
          ©{{ appConfig.timeStart }} — 2026 Powerby
        </div>
        <a class="copyrightName" :href="appConfig.url" :title="appConfig.title" target="_blank">
          <NuxtImg class="logo" :alt="appConfig.title" src="/image/SiteCover/avatar.avif" :class="{circle: appConfig.header.showTitle}" width="25" height="25" loading="lazy" />
          <div class="title">
            {{ appConfig.title }}
          </div>
        </a>
      </div>
      <div class="themes">
        <div class="Themesinfo">
          <p> 采用 </p>
          <a href="https://github.com/L33Z22L11/blog-v3"> Clarity </a>
          <p> 主题 </p>
        </div>
      </div>
      <div class="footerGroup">
        <a :href="group.url" v-for="group in footerGroup">
          <span v-tip="group.tip">{{ group.label }}</span>
        </a>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.copyrightCard {
  .copyrightNav {
    display: flex;
    flex-direction: column;
    gap: 0.56rem;
    
    .timeLoad {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.2rem;
      font-size: 0.9em;
      
      .Powerby, .copyrightName {
        display: flex;
        align-items: center;
        gap: 0.2rem;
      }
      
      .copyrightName {
        padding: 0.5rem;
        text-decoration: none;
        color: inherit;
        transition: opacity 0.2s;
        
        &:hover {
          opacity: 0.8;
        }
        
        .logo {
          width: 25px;
          height: 25px;
          min-width: 25px;
          min-height: 25px;
          border-radius: 50%;
          object-fit: cover;
          
          &.circle {
            border-radius: 50%;
          }
        }
        
        .title {
          font-size: 1em;
          font-weight: 500;
        }
      }
    }
    
    .themes {
      font-size: 0.85em;
      color: var(--c-text-secondary);

      .Themesinfo {
        display: flex;
        gap: 0.5rem;
      }
    }
    .footerGroup {
      font-size: 0.85em;
      color: var(--c-text-secondary);
      display: flex;
      gap: 0.6em;
    }
  }
}
</style>