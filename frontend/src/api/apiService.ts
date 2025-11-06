import axios from 'axios';

export const API_BASE_URL = 'http://13.159.19.120';  // 移除 /api 后缀，导出以供其他文件使用

const apiService = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,  // 增加到 15 秒
  headers: {
    'Content-Type': 'application/json',
  },
});

apiService.interceptors.request.use(
  (config) => {
    
    const token = localStorage.getItem('authToken');

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

apiService.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // 自动重试机制（最多重试 2 次）
    if (
      error.code === 'ECONNABORTED' || 
      error.message.includes('timeout') ||
      error.message.includes('Network Error')
    ) {
      if (!originalRequest._retry) {
        originalRequest._retry = 0;
      }
      
      if (originalRequest._retry < 2) {
        originalRequest._retry += 1;
        console.log(`请求失败，正在重试 (${originalRequest._retry}/2)...`);
        // 等待 500ms 后重试
        await new Promise(resolve => setTimeout(resolve, 500));
        return apiService(originalRequest);
      }
    }

    if (error.response && error.response.status === 401) {
      
      console.error('API Error 401: 未授权或 Token 过期');

      const currentPath = window.location.pathname;
      const isAuthPage = currentPath === '/login' || currentPath === '/register';

      if (!isAuthPage) {
        // 清除所有认证信息
        localStorage.removeItem('authToken');
        
        // 强制刷新页面，清除所有状态
        window.location.href = '/login'; 
      } 
    
    }

    return Promise.reject(error);
  }
);

export default apiService;
