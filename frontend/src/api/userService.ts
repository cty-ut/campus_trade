import apiService from './apiService';
import type { User, UpdateUserData } from '../types/user.types';

/**
 * 用户相关的 API 服务
 */
const userService = {
  /**
   * 更新用户信息
   * @param data - 要更新的用户数据
   * @returns Promise<User> - 更新后的用户信息
   */
  updateUserProfile: async (data: UpdateUserData): Promise<User> => {
    const response = await apiService.patch<User>('/api/users/me', data);
    return response.data;
  },
};

export default userService;
