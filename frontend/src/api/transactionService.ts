import apiService from './apiService';
import type { Transaction, CreateTransactionData } from '../types/transaction.types';
import type { User } from '../types/user.types';

/**
 * 交易相关的 API 服务
 */
const transactionService = {
  /**
   * 创建交易（卖家标记已售出时选择买家）
   * @param data - 交易数据（帖子ID、买家ID）
   * @returns Promise<Transaction>
   */
  createTransaction: async (data: CreateTransactionData): Promise<Transaction> => {
    const response = await apiService.post<Transaction>('/api/transactions', data);
    return response.data;
  },

  /**
   * 确认交易（买家或卖家确认）
   * @param transactionId - 交易 ID
   * @returns Promise<Transaction>
   */
  confirmTransaction: async (transactionId: number): Promise<Transaction> => {
    const response = await apiService.patch<Transaction>(
      `/api/transactions/${transactionId}/confirm`
    );
    return response.data;
  },

  /**
   * 获取我的待确认交易列表
   * @returns Promise<Transaction[]>
   */
  getMyPendingTransactions: async (): Promise<Transaction[]> => {
    const response = await apiService.get<Transaction[]>('/api/transactions/my-pending');
    return response.data;
  },

  /**
   * 获取与帖子有过联系的用户列表（用于选择买家）
   * @param postId - 帖子 ID
   * @returns Promise<User[]>
   */
  getContactedUsers: async (postId: number): Promise<User[]> => {
    const response = await apiService.get<User[]>(`/api/posts/${postId}/contacted-users`);
    return response.data;
  },
};

export default transactionService;
