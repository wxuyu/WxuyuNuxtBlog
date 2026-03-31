import { defineStore } from 'pinia';
import type { Song, Playlist, PlayerStatus, FloatStatus } from '~/types/music';
import { PlayerStatus as PS, FloatStatus as FS } from '~/types/music';
export const useMusicStore = defineStore('music', {
  state: () => ({
    // 播放器状态
    currentSong: null as Song | null,
    currentPlaylist: null as Playlist | null,
    playerStatus: PS.STOPPED as PlayerStatus,
    floatStatus: FS.MINIMIZED as FloatStatus,
    
    // 播放进度
    currentTime: 0,
    duration: 0,
    volume: 0.8,
    
    // 歌单列表
    playlists: [] as Playlist[],
    
    // 播放队列
    playQueue: [] as Song[],
    currentIndex: 0,
    
    // UI 状态
    showPlaylistDetail: false,
    selectedPlaylistId: null as string | null,
  }),
  
  getters: {
    isPlaying: (state) => state.playerStatus === PS.PLAYING,
    progress: (state) => state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,
    formattedCurrentTime: (state) => formatTime(state.currentTime),
    formattedDuration: (state) => formatTime(state.duration),
    hasNextSong: (state) => state.currentIndex < state.playQueue.length - 1,
    hasPrevSong: (state) => state.currentIndex > 0,
    selectedPlaylist: (state) => state.playlists.find(p => p.id === state.selectedPlaylistId),
  },
  
  actions: {
    // 初始化本地歌单
    initPlaylists() {
      this.playlists = [
        {
          id: '1',
          name: '我的收藏',
          cover: '/images/playlist-cover-1.jpg',
          createdAt: new Date().toISOString(),
          songs: [
            {
              id: 's1',
              title: '夜の向日葵',
              artist: '松本文紀',
              cover: '/images/song-cover-1.jpg',
              duration: 164,
              url: '/music/song1.mp3'
            },
            {
              id: 's2',
              title: '星空',
              artist: '松本文紀',
              cover: '/images/song-cover-2.jpg',
              duration: 180,
              url: '/music/song2.mp3'
            }
          ]
        },
        {
          id: '2',
          name: '日系音乐',
          cover: '/images/playlist-cover-2.jpg',
          createdAt: new Date().toISOString(),
          songs: []
        }
      ];
    },
    
    // 播放歌曲
    playSong(song: Song, playlist?: Playlist) {
      this.currentSong = song;
      if (playlist) {
        this.currentPlaylist = playlist;
        this.playQueue = playlist.songs;
        this.currentIndex = playlist.songs.findIndex(s => s.id === song.id);
      }
      this.playerStatus = PS.PLAYING;
      this.floatStatus = FS.COLLAPSED;
    },
    
    // 播放/暂停切换
    togglePlay() {
      if (this.playerStatus === PS.PLAYING) {
        this.playerStatus = PS.PAUSED;
      } else if (this.currentSong) {
        this.playerStatus = PS.PLAYING;
      }
    },
    
    // 下一曲
    playNext() {
      if (this.hasNextSong) {
        this.currentIndex++;
        this.currentSong = this.playQueue[this.currentIndex];
        this.playerStatus = PS.PLAYING;
      }
    },
    
    // 上一曲
    playPrev() {
      if (this.hasPrevSong) {
        this.currentIndex--;
        this.currentSong = this.playQueue[this.currentIndex];
        this.playerStatus = PS.PLAYING;
      }
    },
    
    // 更新播放进度
    updateProgress(time: number) {
      this.currentTime = time;
    },
    
    // 设置播放位置
    seekTo(time: number) {
      this.currentTime = time;
    },
    
    // 设置音量
    setVolume(volume: number) {
      this.volume = Math.max(0, Math.min(1, volume));
    },
    
    // 切换悬浮状态
    toggleFloatStatus() {
      if (this.floatStatus === FS.MINIMIZED) {
        this.floatStatus = FS.COLLAPSED;
      } else if (this.floatStatus === FS.COLLAPSED) {
        this.floatStatus = FS.EXPANDED;
      } else {
        this.floatStatus = FS.COLLAPSED;
      }
    },
    
    // 最小化
    minimize() {
      this.floatStatus = FS.MINIMIZED;
    },
    
    // 展开
    expand() {
      this.floatStatus = FS.EXPANDED;
    },
    
    // 显示歌单详情
    showPlaylistDetailModal(playlistId: string) {
      this.selectedPlaylistId = playlistId;
      this.showPlaylistDetail = true;
    },
    
    // 隐藏歌单详情
    hidePlaylistDetail() {
      this.showPlaylistDetail = false;
      this.selectedPlaylistId = null;
    },
    
    // 选择歌单播放
    playPlaylist(playlist: Playlist) {
      if (playlist.songs.length > 0) {
        this.playSong(playlist.songs[0], playlist);
      }
    }
  }
});

// 时间格式化辅助函数
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}
