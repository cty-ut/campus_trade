import type { User } from './user.types';

/**
 * 帖子类型枚举
 * - sell: 出售
 * - buy: 求购
 * - free: 免费赠送
 */
export type PostType = 'sell' | 'buy' | 'free';

/**
 * 商品新旧程度枚举
 * - new: 全新
 * - like_new: 几乎全新
 * - good: 良好
 * - fair: 一般
 */
export type Condition = 'new' | 'like_new' | 'good' | 'fair';

/**
 * 帖子状态枚举
 * - available: 可用/在售
 * - sold: 已售出
 * - hidden: 已隐藏
 */
export type Status = 'available' | 'sold' | 'hidden';

/**
 * 分类接口
 */
export interface Category {
  id: number;
  name: string;
}

/**
 * 帖子图片接口
 */
export interface PostImage {
  id: number;
  image_url: string;
}

/**
 * 帖子接口（完整信息）
 */
export interface Post {
  id: number;
  title: string;
  description: string;
  price: number;
  price_min: number | null;
  post_type: PostType;
  condition: Condition | null;
  status: Status;
  category_id: number;
  created_at: string;
  updated_at: string;
  owner: User;
  category: Category;
  images: PostImage[];
}

/**
 * 创建帖子的请求数据
 */
export interface CreatePostData {
  title: string;
  description: string;
  price: number;
  category_id: number;
  post_type: PostType;
  condition?: Condition;
  price_min?: number;
}

/**
 * 更新帖子的请求数据（所有字段都是可选的）
 */
export interface UpdatePostData {
  title?: string;
  description?: string;
  price?: number;
  status?: Status;
  condition?: Condition;
}

/**
 * 获取帖子列表的查询参数
 */
export interface GetPostsParams {
  post_type?: PostType;
  skip?: number;
  limit?: number;
  keyword?: string;        // 搜索关键词
  category_id?: number;    // 分类筛选
  sort_by?: 'latest' | 'price_asc' | 'price_desc';  // 排序方式
}

/**
 * 获取帖子列表的响应数据
 */
export interface PostsResponse {
  posts: Post[];
  total: number;
}
