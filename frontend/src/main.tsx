import './index.css'
import App from './App.tsx'
import 'antd/dist/reset.css'
import { AuthProvider } from './context/AuthContext';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    
    {/* 2. 用 BrowserRouter 包裹所有内容 */}
    {/* 它必须在 AuthProvider 的外面 */}
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>

  </React.StrictMode>,
)