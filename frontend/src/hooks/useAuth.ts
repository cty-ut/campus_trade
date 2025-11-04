import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import type { AuthContextType } from '../context/AuthContext';

export const useAuth = (): AuthContextType => {
  
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内部使用');
  }

  return context;
};