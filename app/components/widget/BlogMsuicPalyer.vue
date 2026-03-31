<template>
  <audio
    ref="audioElement"
    @timeupdate="onTimeUpdate"
    @loadedmetadata="onLoadedMetadata"
    @ended="onEnded"
    @play="onPlay"
    @pause="onPause"
  />
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue';
import { useMusicStore } from '~/components/yjluo/music/player.pinia';
import { PlayerStatus } from '~/types/music';

const musicStore = useMusicStore();
const audioElement = ref<HTMLAudioElement | null>(null);

// 监听当前歌曲变化
watch(() => musicStore.currentSong, (newSong) => {
  if (newSong && audioElement.value) {
    audioElement.value.src = newSong.url;
    audioElement.value.load();
    if (musicStore.playerStatus === PlayerStatus.PLAYING) {
      audioElement.value.play();
    }
  }
});

// 监听播放状态变化
watch(() => musicStore.playerStatus, (status) => {
  if (!audioElement.value) return;
  
  if (status === PlayerStatus.PLAYING) {
    audioElement.value.play();
  } else if (status === PlayerStatus.PAUSED) {
    audioElement.value.pause();
  }
});

// 监听音量变化
watch(() => musicStore.volume, (volume) => {
  if (audioElement.value) {
    audioElement.value.volume = volume;
  }
});

// 监听进度跳转
watch(() => musicStore.currentTime, (time) => {
  if (audioElement.value && Math.abs(audioElement.value.currentTime - time) > 1) {
    audioElement.value.currentTime = time;
  }
});

// 时间更新
const onTimeUpdate = () => {
  if (audioElement.value) {
    musicStore.updateProgress(audioElement.value.currentTime);
  }
};

// 加载元数据
const onLoadedMetadata = () => {
  if (audioElement.value) {
    musicStore.duration = audioElement.value.duration;
  }
};

// 播放结束
const onEnded = () => {
  if (musicStore.hasNextSong) {
    musicStore.playNext();
  } else {
    musicStore.playerStatus = PlayerStatus.PAUSED;
  }
};

// 播放开始
const onPlay = () => {
  musicStore.playerStatus = PlayerStatus.PLAYING;
};

// 暂停
const onPause = () => {
  if (musicStore.playerStatus === PlayerStatus.PLAYING) {
    musicStore.playerStatus = PlayerStatus.PAUSED;
  }
};

onMounted(() => {
  if (audioElement.value) {
    audioElement.value.volume = musicStore.volume;
  }
});

onUnmounted(() => {
  if (audioElement.value) {
    audioElement.value.pause();
    audioElement.value.src = '';
  }
});
</script>
