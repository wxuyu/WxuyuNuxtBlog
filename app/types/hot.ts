// types/api.d.ts
// 1.定义 API 的统一响应外壳（通用壳）
export interface ApiResponse {
  total: number;
  updateTime: string;
  data: HotItem[]; // 这里指定具体的数组类型
}

// 2.定义热搜单条数据的结构
export interface HotItem {
  id: string;
  title: string;
  desc: string;
  cover: string;
  author: string;
  timestamp: null | number;
  hot: number;
  url: string;
  mobileUrl: string;
}