export interface CircleApiResponse {
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