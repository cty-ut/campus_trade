import apiService from './apiService';
import type { Message, CreateMessageData, InboxConversation } from '../types/message.types';

/**
 * 消息相关的 API 服务
 */
const messageService = {
  /**
   * 发送一条新消息
   * @param data - 消息数据（内容、帖子ID、接收者ID）
   * @returns Promise<Message>
   */
  sendMessage: async (data: CreateMessageData): Promise<Message> => {
    const response = await apiService.post<Message>('/api/messages', data);
    return response.data;
  },

  /**
   * 获取特定会话的聊天记录
   * @param postId - 帖子 ID
   * @param otherUserId - 对方用户 ID
   * @returns Promise<Message[]> - 消息数组（按时间升序）
   */
  getConversation: async (postId: number, otherUserId: number): Promise<Message[]> => {
    const response = await apiService.get<Message[]>('/api/conversations', {
      params: {
        post_id: postId,
        other_user_id: otherUserId,
      },
    });
    return response.data;
  },

  /**
   * 获取我的收件箱（所有会话列表）
   * @returns Promise<InboxConversation[]> - 会话数组
   */
  getInbox: async (): Promise<InboxConversation[]> => {
    const response = await apiService.get<InboxConversation[]>('/api/users/me/inbox');
    return response.data;
  },

  /**
   * 标记会话为已读（调用后端 API）
   * @param postId - 帖子 ID
   * @param otherUserId - 对方用户 ID
   * @returns Promise<number> - 被更新的消息数量
   */
  markAsRead: async (postId: number, otherUserId: number): Promise<number> => {
    try {
      const response = await apiService.patch<{ updated_count: number }>(
        '/api/conversations/mark-read',
        null,
        {
          params: {
            post_id: postId,
            other_user_id: otherUserId,
          },
        }
      );
      return response.data.updated_count;
    } catch (error) {
      console.error('标记已读失败:', error);
      return 0;
    }
  },

  /**
   * 获取未读消息数（从收件箱中统计）
   * 统计规则：收件箱中每个会话，如果最后一条消息是对方发送的且未读，视为有未读消息
   * @returns Promise<number> - 未读消息数
   */
  getUnreadCount: async (currentUserId: number): Promise<number> => {
    try {
      const inbox = await messageService.getInbox();
      // 统计未读会话数量（只依赖后端的 is_read 字段）
      const unreadCount = inbox.filter(conv => {
        // 最后一条消息必须是对方发送的且未读
        return conv.last_message.sender_id !== currentUserId && !conv.last_message.is_read;
      }).length;
      return unreadCount;
    } catch (error) {
      console.error('获取未读消息数失败:', error);
      return 0;
    }
  },
};

export default messageService;
