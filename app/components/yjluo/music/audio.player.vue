<template>
  <Teleport to="body">
    <Transition name="modal">
      <div 
        v-if="musicStore.showPlaylistDetail"
        class="playlist-modal-overlay"
        @click="musicStore.hidePlaylistDetail"
      >
        <div class="playlist-modal" @click.stop>
          <!-- 头部 -->
          <div class="modal-header">
            <h3>选择歌单</h3>
            <button class="close-btn" @click="musicStore.hidePlaylistDetail">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>

          <!-- 歌单列表 -->
          <div class="playlists-container">
            <div 
              v-for="playlist in musicStore.playlists"
              :key="playlist.id"
              class="playlist-card"
              :class="{ active: playlist.id === musicStore.currentPlaylist?.id }"
              @click="selectPlaylist(playlist)"
            >
              <img 
                :src="playlist.cover" 
                :alt="playlist.name"
                class="playlist-cover"
              >
              <div class="playlist-info">
                <div class="playlist-name">{{ playlist.name }}</div>
                <div class="playlist-count">{{ playlist.songs.length }} 首歌曲</div>
              </div>
              <button 
                class="play-playlist-btn"
                @click.stop="playPlaylist(playlist)"
                v-if="playlist.songs.length > 0"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- 当前选中歌单的详情 -->
          <div 
            v-if="musicStore.selectedPlaylist"
            class="playlist-detail"
          >
            <div class="detail-header">
              <h4>{{ musicStore.selectedPlaylist.name }}</h4>
              <span class="song-count">共 {{ musicStore.selectedPlaylist.songs.length }} 首</span>
            </div>
            
            <div class="songs-list">
              <div 
                v-for="(song, index) in musicStore.selectedPlaylist.songs"
                :key="song.id"
                class="song-item"
                :class="{ playing: song.id === musicStore.currentSong?.id && musicStore.isPlaying }"
                @click="playSongFromPlaylist(song, musicStore.selectedPlaylist!)"
              >
                <div class="song-index">
                  <span v-if="song.id !== musicStore.currentSong?.id || !musicStore.isPlaying">
                    {{ index + 1 }}
                  </span>
                  <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="currentColor" class="playing-icon">
                    <path d="M8 5v14l11-7z"/>
                  </svg>
                </div>
                <img 
                  :src="song.cover" 
                  :alt="song.title"
                  class="song-cover"
                >
                <div class="song-info">
                  <div class="song-title">{{ song.title }}</div>
                  <div class="song-artist">{{ song.artist }}</div>
                </div>
                <div class="song-duration">{{ formatDuration(song.duration) }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useMusicStore } from './player.pinia';
import type { Playlist, Song } from '~/types/music';

const musicStore = useMusicStore();

const selectPlaylist = (playlist: Playlist) => {
  musicStore.selectedPlaylistId = playlist.id;
};

const playPlaylist = (playlist: Playlist) => {
  musicStore.playPlaylist(playlist);
  musicStore.hidePlaylistDetail();
};

const playSongFromPlaylist = (song: Song, playlist: Playlist) => {
  musicStore.playSong(song, playlist);
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
</script>

<style scoped lang="scss">
.playlist-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  padding: 20px;
}

.playlist-modal {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 800px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.2);
  
  .modal-header {
    padding: 20px 24px;
    border-bottom: 1px solid #f0f0f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    
    h3 {
      margin: 0;
      font-size: 20px;
      font-weight: 600;
      color: #333;
    }
    
    .close-btn {
      background: none;
      border: none;
      color: #999;
      cursor: pointer;
      padding: 4px;
      border-radius: 4px;
      transition: all 0.2s;
      
      &:hover {
        color: #333;
        background: #f5f5f5;
      }
    }
  }
  
  .playlists-container {
    padding: 24px;
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
    max-height: 300px;
    overflow-y: auto;
    border-bottom: 1px solid #f0f0f0;
    
    .playlist-card {
      background: #f9f9f9;
      border-radius: 12px;
      padding: 16px;
      cursor: pointer;
      transition: all 0.2s;
      position: relative;
      
      &:hover {
        background: #f0f0f0;
        transform: translateY(-2px);
      }
      
      &.active {
        background: #E3F2FD;
        border: 2px solid #2979FF;
        
        .playlist-name {
          color: #2979FF;
        }
      }
      
      .playlist-cover {
        width: 100%;
        aspect-ratio: 1;
        border-radius: 8px;
        object-fit: cover;
        margin-bottom: 12px;
      }
      
      .playlist-info {
        .playlist-name {
          font-size: 15px;
          font-weight: 600;
          color: #333;
          margin-bottom: 4px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .playlist-count {
          font-size: 13px;
          color: #999;
        }
      }
      
      .play-playlist-btn {
        position: absolute;
        top: 16px;
        right: 16px;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        background: #2979FF;
        border: none;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        opacity: 0;
        transition: all 0.2s;
        box-shadow: 0 4px 12px rgba(41, 121, 255, 0.4);
        
        &:hover {
          transform: scale(1.1);
        }
      }
      
      &:hover .play-playlist-btn {
        opacity: 1;
      }
    }
  }
  
  .playlist-detail {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    
    .detail-header {
      padding: 20px 24px;
      border-bottom: 1px solid #f0f0f0;
      
      h4 {
        margin: 0 0 4px 0;
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      
      .song-count {
        font-size: 13px;
        color: #999;
      }
    }
    
    .songs-list {
      flex: 1;
      overflow-y: auto;
      padding: 12px 24px 24px;
      
      .song-item {
        display: flex;
        align-items: center;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: background 0.2s;
        gap: 12px;
        
        &:hover {
          background: #f5f5f5;
        }
        
        &.playing {
          background: #E3F2FD;
          
          .song-title {
            color: #2979FF;
          }
          
          .playing-icon {
            color: #2979FF;
            animation: pulse 1s ease-in-out infinite;
          }
        }
        
        .song-index {
          width: 24px;
          text-align: center;
          font-size: 14px;
          color: #999;
          flex-shrink: 0;
        }
        
        .song-cover {
          width: 48px;
          height: 48px;
          border-radius: 6px;
          object-fit: cover;
          flex-shrink: 0;
        }
        
        .song-info {
          flex: 1;
          min-width: 0;
          
          .song-title {
            font-size: 14px;
            font-weight: 500;
            color: #333;
            margin-bottom: 4px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
          
          .song-artist {
            font-size: 13px;
            color: #999;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
        
        .song-duration {
          font-size: 13px;
          color: #999;
          flex-shrink: 0;
        }
      }
    }
  }
}

// 滚动条样式
.playlists-container,
.songs-list {
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: transparent;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ddd;
    border-radius: 3px;
    
    &:hover {
      background: #ccc;
    }
  }
}

// 过渡动画
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s;
  
  .playlist-modal {
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  }
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
  
  .playlist-modal {
    transform: scale(0.9) translateY(20px);
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
</style>
