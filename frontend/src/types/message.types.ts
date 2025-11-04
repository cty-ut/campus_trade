import type { User } from './user.types';
import type { Post } from './post.types';

/**
 * 消息类型
 */
export interface Message {
  id: number;
  content: string;
  post_id: number;
  sender_id: number;
  receiver_id: number;
  is_read: boolean;
  created_at: string;
  sender: User;
  receiver: User;
}

/**
 * 创建消息的请求数据
 */
export interface CreateMessageData {
  content: string;
  post_id: number;
  receiver_id: number;
}

/**
 * 收件箱会话类型
 */
export interface InboxConversation {
  post: Post;
  other_user: User;
  last_message: Message;
}
