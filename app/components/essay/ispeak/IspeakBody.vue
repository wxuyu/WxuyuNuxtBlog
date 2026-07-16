<script setup lang="ts">
import { type SpeakType } from '~/data/essay/ispeak/ispeakTypes'
import { ref, onMounted } from 'vue'
import Speak_Card from './IspeakCard.vue';

const props = defineProps({
  speakList: {
    type: Array as PropType<SpeakType[]>,
    required: true
  },
  message: {
    type: String as PropType<string>
  },
  btnClickFlag: {
    type: Boolean as PropType<boolean>
  },
  loading: {
    type: Boolean as PropType<boolean>
  }
})
</script>

<template>
  <div class="Ispeak_Body">
    <div class="Ispeak_Content">
      <transition-group name="fade">
        <Speak_Card
          v-for="speak in props.speakList"
          :key="speak._id"
          :speak="speak"
        />
      </transition-group>
    </div>
  </div>
</template>