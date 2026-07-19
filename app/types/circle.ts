export interface CircleAllApiResponse {
   statistical_data: CircleStatisticalData,
   article_data: CircleArticleData[]
}

export interface CircleStatisticalData {
   friends_num: number,
   active_num: number,
   error_num: number,
   article_num: number,
   last_updated_time: string
}

export interface CircleArticleData {
   floor: number,
   title: string,
   created: string,
   updated: string,
   link: string,
   author: string,
   avatar: string,
   summary: string,
   ai_model: string,
   summary_created_at: string,
   summary_updated_at: string
}

export interface CircleFriendApiResponse {
  /** 名称 */
  name: string;
  /** 博客链接 */
  link: string;
  /** 头像地址（支持绝对 URL 或相对路径） */
  avatar: string;
  /** 是否解析异常 */
  error: boolean;
  /** 创建时间（格式：yyyy-MM-dd HH:mm:ss） */
  createdAt: string;
}