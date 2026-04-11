<script setup lang="ts">
import appConfig from '~/app.config';
import Button from '~/components/partial/Button.vue';
import Speak from '~/data/essay/local/speak';

const recentTalks = [...Speak]
  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  .slice(0, appConfig.essay.CONFIG.LOCAL_ESSAY.page_size)

function replyTalk(content: string): void {
  const input = document.querySelector('#twikoo .tk-input textarea')
  if (!(input instanceof HTMLTextAreaElement)) return

  if (content.trim()) {
    const quotes = content.split('\n').map(str => `> ${str}`)
    input.value = `${quotes}\n\n`
  } else {
    input.value = ''
  }
  input.dispatchEvent(new InputEvent('input'))

  const length = input.value.length
  input.setSelectionRange(length, length)
  input.focus()
}
</script>

<template>
  <div class="Speak_Card" v-for="talk in Speak" :key="talk.date">
    <div class="Speak_Card_Header">
      <div class="Card_Header_Left">
        <NuxtImg class="Card_Header_Image" :src="appConfig.author.avatar" />
        <div class="Card_Header_Warp">
          <span>{{ appConfig.author.name }}</span>
          <div class="Header_Warp_Time">{{ talk.date }}</div>
        </div>
      </div>
    </div>
    <div class="Speak_Card_Content">
      <div class="Card_Content_Text" v-if="talk.text" v-html="talk.text" />
      <div v-if="talk.image" class="zone_imgbox">
        <figure v-for="(img, imgIndex) in talk.image" :key="imgIndex" class="img-item">
          <Pic :src="img" zoom class="talk-img" loading="lazy" :fetchpriority="imgIndex === 0 ? 'high' : 'low'" />
        </figure>
      </div>
      <VideoEmbed class="video" v-if="talk.video" v-bind="talk.video" height="" />
    </div>
    <div class="Speak_Card_Footer">
      <div class="tag">
        <Badge class="tagCard" v-for="tag in talk.tags">
          <Icon name="i-tabler:tag" />
          {{ tag }}
        </Badge>        
      </div>
      <button class="comment-btn" @click="replyTalk(talk.text)" v-tip="`评论`">
          <Icon name="ph:chats-bold" class="icon" />
      </button>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.Speak_Card {
  animation: float-in .3s backwards;
  animation-delay: var(--delay);
  border-radius: 8px;
  box-shadow: 0 0 0 1px var(--c-bg-soft);
  display: flex;
  flex-direction: column;
  gap: .5rem;
  margin-bottom: 1rem;
  padding: 1rem;
  .Speak_Card_Header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
    flex-wrap: wrap;
    .Card_Header_Left {
      align-items: center;
      display: flex;
      gap: 10px;
      .Card_Header_Image {
        border-radius: 50%;
        box-shadow: 2px 4px 1rem var(--ld-shadow);
        width: 3em;
        @supports (corner-shape: squircle) {
          corner-shape: superellipse(1.2);
        }
      }
      .Card_Header_Warp {
        .Header_Warp_Name {
          align-items: center;
          display: flex;
          gap: 5px;
        }
        .Header_Warp_Time {
          color: var(--c-text-3);
          font-family: var(--font-monospace);
          font-size: 0.8rem;
        }
      }
    }
  }
  .Speak_Card_Content {
    color: var(--c-text-2);
    display: flex;
    flex-direction: column;
    gap: .5rem;
    line-height: 1.6;

    :deep(a[href]) {
      margin: -.1em -.2em;
      padding: .1em .2em;
      background: linear-gradient(var(--c-primary-soft), var(--c-primary-soft)) no-repeat center bottom / 100% .1em;
      color: var(--c-primary);
      transition: all .2s;

      &:hover {
        border-radius: .3em;
        background-size: 100% 100%;
      }
    }

    :deep(.zone_imgbox) {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;

      .img-item {
        position: relative;
        padding-bottom: 100%;
        border-radius: 8px;
        overflow: hidden;

        img {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          cursor: zoom-in;
          transition: transform .3s;

          &:hover {
            transform: scale(1.05);
          }
        }
      }
    }
  }
  .Speak_Card_Footer {
    align-items: center;
    color: var(--c-text-3);
    display: flex;
    justify-content: space-between;
    .tag {
      display: flex;
      font-size: .7rem;
      gap: 4px;
      :deep(.tagCard) {
        font-size: 12px;
        font-weight: 700;
      }
    }
  }
}
</style>