<template>
  <Teleport to="body">
    <div 
      v-if="musicStore.currentSong"
      class="music-player-float"
      :class="floatStatusClass"
    >
      <!-- 最小化状态（图一）：圆形封面 -->
      <div 
        v-if="musicStore.floatStatus === FloatStatus.MINIMIZED"
        class="minimized-player"
        @click="musicStore.toggleFloatStatus"
      >
        <div class="cover-wrapper">
          <img 
            :src="musicStore.currentSong.cover" 
            :alt="musicStore.currentSong.title"
            class="cover-image"
            :class="{ rotating: musicStore.isPlaying }"
          >
          <div class="play-indicator" v-if="musicStore.isPlaying">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
              <path d="M4 3v10l8-5z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 收起状态（图二）：横条显示 -->
      <div 
        v-else-if="musicStore.floatStatus === FloatStatus.COLLAPSED"
        class="collapsed-player"
      >
        <div class="collapsed-content" @click="musicStore.expand">
          <img 
            :src="musicStore.currentSong.cover" 
            :alt="musicStore.currentSong.title"
            class="collapsed-cover"
            :class="{ rotating: musicStore.isPlaying }"
          >
          <div class="collapsed-info">
            <div class="song-title">{{ musicStore.currentSong.title }}</div>
            <div class="artist-name">{{ musicStore.currentSong.artist }}</div>
          </div>
          <button 
            class="play-btn-collapsed"
            @click.stop="musicStore.togglePlay"
          >
            <svg v-if="!musicStore.isPlaying" width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- 展开状态（图三）：完整播放器 -->
      <div 
        v-else
        class="expanded-player"
      >
        <!-- 头部 -->
        <div class="expanded-header">
          <div class="header-left">
            <img 
              :src="musicStore.currentSong.cover" 
              :alt="musicStore.currentSong.title"
              class="header-cover"
            >
            <div class="header-info">
              <div class="playlist-label">{{ musicStore.currentPlaylist?.name || '播放列表' }}</div>
              <button 
                class="collapse-btn"
                @click="musicStore.floatStatus = FloatStatus.COLLAPSED"
              >
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 10L4 6h8z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- 歌曲信息 -->
        <div class="song-info-section">
          <div class="song-title-large">{{ musicStore.currentSong.title }}</div>
          <div class="artist-name-large">{{ musicStore.currentSong.artist }}</div>
        </div>

        <!-- 进度条 -->
        <div class="progress-section">
          <div class="time-display">{{ musicStore.formattedCurrentTime }}</div>
          <div class="progress-bar-wrapper" @click="handleProgressClick">
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: `${musicStore.progress}%` }"></div>
              <div class="progress-thumb" :style="{ left: `${musicStore.progress}%` }"></div>
            </div>
          </div>
          <div class="time-display">{{ musicStore.formattedDuration }}</div>
        </div>

        <!-- 附加信息 -->
        <div class="meta-info">
          <div class="meta-row">
            <span class="meta-label">作曲：</span>
            <span class="meta-value">{{ musicStore.currentSong.artist }}</span>
          </div>
          <div class="meta-row">
            <span class="meta-label">编曲：</span>
            <span class="meta-value">{{ musicStore.currentSong.artist }}</span>
          </div>
        </div>

        <!-- 控制按钮 -->
        <div class="controls">
          <button class="control-btn" @click="musicStore.playPrev" :disabled="!musicStore.hasPrevSong">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 6h2v12H6V6zm3.5 6l8.5 6V6l-8.5 6z"/>
            </svg>
          </button>
          
          <button class="control-btn play-btn-main" @click="musicStore.togglePlay">
            <svg v-if="!musicStore.isPlaying" width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else width="32" height="32" viewBox="0 0 24 24" fill="white">
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z"/>
            </svg>
          </button>
          
          <button class="control-btn" @click="musicStore.playNext" :disabled="!musicStore.hasNextSong">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          
          <button class="control-btn volume-btn">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
            </svg>
          </button>
        </div>

        <!-- 播放列表按钮 -->
        <div class="playlist-section">
          <button class="playlist-btn" @click="showPlaylistSelector">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M15 6H3v2h12V6zm0 4H3v2h12v-2zM3 16h8v-2H3v2zM17 6v8.18c-.31-.11-.65-.18-1-.18-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3V8h3V6h-5z"/>
            </svg>
            <span>播放列表 ({{ musicStore.playQueue.length }})</span>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <path d="M12 6L8 10 4 6z"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useMusicStore } from './player.pinia';
import { FloatStatus } from '~/types/music';

const musicStore = useMusicStore();

const floatStatusClass = computed(() => {
  return `float-status-${musicStore.floatStatus}`;
});

const handleProgressClick = (e: MouseEvent) => {
  const target = e.currentTarget as HTMLElement;
  const rect = target.getBoundingClientRect();
  const percent = (e.clientX - rect.left) / rect.width;
  const newTime = percent * musicStore.duration;
  musicStore.seekTo(newTime);
};

const showPlaylistSelector = () => {
  // 触发显示歌单选择器
  if (musicStore.currentPlaylist) {
    musicStore.showPlaylistDetailModal(musicStore.currentPlaylist.id);
  }
};
</script>

<style scoped lang="scss">
.music-player-float {
  position: fixed;
  z-index: 9999;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

// 最小化状态（图一）
.float-status-minimized {
  bottom: 20px;
  right: 20px;
  
  .minimized-player {
    width: 60px;
    height: 60px;
    cursor: pointer;
    
    .cover-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
      border-radius: 50%;
      overflow: hidden;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      
      .cover-image {
        width: 100%;
        height: 100%;
        object-fit: cover;
        
        &.rotating {
          animation: rotate 10s linear infinite;
        }
      }
      
      .play-indicator {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 24px;
        height: 24px;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }
  }
}

// 收起状态（图二）
.float-status-collapsed {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  
  .collapsed-player {
    background: white;
    border-radius: 24px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    
    .collapsed-content {
      display: flex;
      align-items: center;
      padding: 8px 16px 8px 8px;
      gap: 12px;
      cursor: pointer;
      
      .collapsed-cover {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        object-fit: cover;
        flex-shrink: 0;
        
        &.rotating {
          animation: rotate 10s linear infinite;
        }
      }
      
      .collapsed-info {
        flex: 1;
        min-width: 0;
        
        .song-title {
          font-size: 14px;
          font-weight: 500;
          color: #333;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .artist-name {
          font-size: 12px;
          color: #999;
          margin-top: 2px;
        }
      }
      
      .play-btn-collapsed {
        width: 48px;
        height: 48px;
        border-radius: 50%;
        background: #2979FF;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        flex-shrink: 0;
        transition: background 0.2s;
        
        &:hover {
          background: #1E6FE6;
        }
        
        &:active {
          transform: scale(0.95);
        }
      }
    }
  }
}

// 展开状态（图三）
.float-status-expanded {
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  
  .expanded-player {
    background: white;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
    width: 400px;
    max-width: 90vw;
    overflow: hidden;
    
    .expanded-header {
      padding: 16px;
      border-bottom: 1px solid #f0f0f0;
      
      .header-left {
        display: flex;
        align-items: center;
        gap: 12px;
        
        .header-cover {
          width: 40px;
          height: 40px;
          border-radius: 8px;
          object-fit: cover;
        }
        
        .header-info {
          flex: 1;
          display: flex;
          justify-content: space-between;
          align-items: center;
          
          .playlist-label {
            font-size: 13px;
            color: #666;
          }
          
          .collapse-btn {
            background: none;
            border: none;
            color: #999;
            cursor: pointer;
            padding: 4px;
            
            &:hover {
              color: #333;
            }
          }
        }
      }
    }
    
    .song-info-section {
      padding: 20px 16px 12px;
      text-align: center;
      
      .song-title-large {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 6px;
      }
      
      .artist-name-large {
        font-size: 14px;
        color: #999;
      }
    }
    
    .progress-section {
      padding: 0 16px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
      
      .time-display {
        font-size: 12px;
        color: #999;
        min-width: 40px;
        text-align: center;
      }
      
      .progress-bar-wrapper {
        flex: 1;
        cursor: pointer;
        padding: 8px 0;
        
        .progress-bar {
          position: relative;
          height: 4px;
          background: #e0e0e0;
          border-radius: 2px;
          
          .progress-fill {
            position: absolute;
            height: 100%;
            background: #2979FF;
            border-radius: 2px;
            transition: width 0.1s;
          }
          
          .progress-thumb {
            position: absolute;
            top: 50%;
            transform: translate(-50%, -50%);
            width: 12px;
            height: 12px;
            background: #2979FF;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
            transition: left 0.1s;
          }
        }
      }
    }
    
    .meta-info {
      padding: 12px 16px;
      border-top: 1px solid #f0f0f0;
      border-bottom: 1px solid #f0f0f0;
      
      .meta-row {
        display: flex;
        font-size: 13px;
        color: #666;
        margin-bottom: 6px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .meta-label {
          color: #999;
          min-width: 50px;
        }
        
        .meta-value {
          color: #666;
        }
      }
    }
    
    .controls {
      padding: 20px 16px;
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 16px;
      
      .control-btn {
        background: none;
        border: none;
        color: #666;
        cursor: pointer;
        padding: 8px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
        
        &:hover:not(:disabled) {
          color: #333;
          background: #f5f5f5;
        }
        
        &:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        
        &.play-btn-main {
          width: 56px;
          height: 56px;
          background: #2979FF;
          color: white;
          
          &:hover {
            background: #1E6FE6;
          }
        }
      }
    }
    
    .playlist-section {
      padding: 0 16px 16px;
      
      .playlist-btn {
        width: 100%;
        padding: 12px;
        background: #f5f5f5;
        border: none;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        cursor: pointer;
        font-size: 14px;
        color: #666;
        transition: background 0.2s;
        
        &:hover {
          background: #e8e8e8;
        }
      }
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
