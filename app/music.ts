// 音乐播放器类型定义
export interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  cover: string;
  duration: number;
  url: string;
}

export interface Playlist {
  id: string;
  name: string;
  cover: string;
  songs: Song[];
  createdAt: string;
}

export enum PlayerStatus {
  PLAYING = 'playing',
  PAUSED = 'paused',
  STOPPED = 'stopped'
}

export enum FloatStatus {
  MINIMIZED = 'minimized', // 图一：最小化圆形
  COLLAPSED = 'collapsed',  // 图二：收起状态
  EXPANDED = 'expanded'     // 图三：展开状态
}
