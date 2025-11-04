import React, { createContext, useState, useEffect } from 'react';
import type { User } from '../types/user.types';
import type { PropsWithChildren } from 'react';
import apiService from '../api/apiService';


export interface AuthContextType {
  user: User | null;     
  token: string | null;  
  isLoading: boolean;    // 新增：加载状态
  
  saveAuth: (user: User, token: string) => void; 
  
  logout: () => void;
}

const defaultContextValue: AuthContextType = {
  user: null,
  token: null,
  isLoading: true,  // 初始为 true
  saveAuth: () => {},
  logout: () => {}, 
};

export const AuthContext = createContext<AuthContextType>(defaultContextValue);


export const AuthProvider: React.FC<PropsWithChildren> = ({ children }) => {
  
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // 组件挂载时从 localStorage 恢复登录状态
  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('authToken');
      
      if (savedToken) {
        try {
          // 使用 token 获取当前用户信息
          const response = await apiService.get<User>('/api/users/me', {
            headers: { Authorization: `Bearer ${savedToken}` }
          });
          
          setUser(response.data);
          setToken(savedToken);
        } catch (error) {
          // Token 无效或过期，清除本地存储
          console.error('恢复登录状态失败:', error);
          localStorage.removeItem('authToken');
          setUser(null);
          setToken(null);
        }
      }
      
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const saveAuth = (newUser: User, newToken: string) => {
    setUser(newUser);
    setToken(newToken);
    
    localStorage.setItem('authToken', newToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    
    localStorage.removeItem('authToken');
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    saveAuth,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};