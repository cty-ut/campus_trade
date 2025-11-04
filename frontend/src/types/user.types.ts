export interface User {
  id: number;
  email: string;
  username: string;
  avatar_url: string | null;
  success_trades: number; 
  created_at: string;      
}

/**
 * 更新用户信息的请求数据
 */
export interface UpdateUserData {
  username?: string;
}
