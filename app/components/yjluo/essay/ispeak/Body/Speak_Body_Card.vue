<script setup lang="ts">
import { NuxtImg } from '#components';
import { type SpeakType } from '@/data/essay/ispeak/speak'
import appConfig from '~/app.config';
import { markedRender } from '@/utils/markRender'

const props = defineProps({
  speak: {
    type: Object as PropType<SpeakType>,
    required: true
  },
  showBackBtn: {
    type: Boolean as PropType<boolean>,
    default: false
  },
  showComment: {
    type: Boolean as PropType<boolean>,
    default: true
  }
})

function goComment(content: string) {
  const textarea = document.querySelector('.atk-textarea') as HTMLTextAreaElement
  if (textarea) {
    textarea.value = `> ${content.replace(/<[^>]+>/g, '')}\n\n`
    textarea.focus()
    textarea.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}
</script>

<template>
  <div class="Speak_Card" :id="appConfig.essay.CONFIG.ISPEAK_CONFIG.author">
    <div class="Speak_Card_Header">
      <div class="Header_Left">
        <NuxtImg class="Header_Left_Avatar" :src="props.speak.author.avatar"/>
        <div class="Header_Left_Meta">
          <div class="Left_Meta_Name"> {{ props.speak.author.nickName }} </div>
          <!-- <Icon name="i-material-symbols:verified verified" /> -->
          <div class="Left_Meta_Time">
            {{ props.speak.createdAt }}
          </div>
        </div>
      </div>
      <div class="Header_Right">
        <div class="Header_Right_Tag">
          <span :style="`background-color: ${props.speak.tag.bgColor}`">{{ props.speak.tag.name }}</span>
        </div>
      </div>
    </div>
    <div class="Speak_Card_Content" v-html="markedRender(props.speak.content)" />
    <div class="Speak_Card_Footer">
      <button class="comment-btn" type="button" @click="goComment(props.speak.content)" aria-label="快速评论">
        <icon name="ph:chats-bold icon" />
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
    user-select: none;
    flex-wrap: wrap;
    .Header_Left {
      align-items: center;
      display: flex;
      gap: 10px;
      .Header_Left_Avatar {
        border-radius: 2em;
        box-shadow: 2px 4px 1rem var(--ld-shadow);
        width: 3em;
      }
      .Header_Left_Meta {
        .Left_Meta_Name {
          align-items: center;
          display: flex;
          gap: 5px;
        }
        .Left_Meta_Time {
          color: var(--c-text-3);
          font-family: var(--font-monospace);
          font-size: .8rem;
        }
      }
    }
    .Header_Right {

    }
  }
  .Speak_Card_Content {
    color: var(--c-text-2);
    display: flex;
    flex-direction: column;
    gap: .5rem;
    line-height: 1.6;
    & :deep(.NuxtImage) {
      display: grid;
      gap: 8px;
      grid-template-columns: repeat(3, 1fr);
    }
    & :deep(img) {
      width: 100%;
      border-radius: 12px;
    }
  }
  .Speak_Card_Footer {

  }
}
</style>