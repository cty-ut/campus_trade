import type { User } from './user.types';
import type { Post } from './post.types';

/**
 * 交易接口
 */
export interface Transaction {
  id: number;
  post_id: number;
  seller_id: number;
  buyer_id: number;
  seller_confirmed: boolean;
  buyer_confirmed: boolean;
  completed: boolean;
  created_at: string;
  completed_at: string | null;
  seller: User;
  buyer: User;
  post: Post;
}

/**
 * 创建交易的请求数据
 */
export interface CreateTransactionData {
  post_id: number;
  buyer_id: number;
}
