import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, App } from 'antd'; 
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import './LoginPage.css';

import { useAuth } from '../hooks/useAuth'; 
import apiService from '../api/apiService';

import type { TokenData } from '../types/token.types';
import type { User } from '../types/user.types';

const { Title } = Typography;

const LoginPage: React.FC = () => {

  const app = App.useApp(); 

  const { user, saveAuth } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  // 如果已登录，跳转到首页
  if (user) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: any) => {
    console.log('表单提交，准备登录:', values);
    setIsLoading(true);

    try {
      // 先清除旧的认证信息，防止缓存污染
      localStorage.removeItem('authToken');
      
      const tokenParams = new URLSearchParams();
      tokenParams.append('username', values.email);
      tokenParams.append('password', values.password);

      const tokenResponse = await apiService.post<TokenData>(
        '/api/token', 
        tokenParams,
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      
      const token = tokenResponse.data.access_token;
      
      const userResponse = await apiService.get<User>('/api/users/me', {
        headers: { Authorization: `Bearer ${token}` }
      });

      const user = userResponse.data;
      
      // 保存新的认证信息
      saveAuth(user, token);

      app.message.success(`欢迎回来，${user.username}！`);
      
      // 使用 setTimeout 确保状态更新完成
      setTimeout(() => {
        navigate('/', { replace: true }); 
      }, 100);

    } catch (error: any) {
      console.error('登录失败:', error);
      
      const errorMessage = error.response?.data?.detail || '登录失败！请检查你的邮箱或密码。';

      app.message.error(errorMessage);
      
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout className="login-page-layout">
      <Card className="login-card" title={<Title level={3}>校内二手平台登录</Title>}>
        <Form
          name="login"
          onFinish={onFinish}
          initialValues={{ remember: true }}
          autoComplete="off"
        >
          {/* 邮箱 */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入你的邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' }
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="邮箱" 
              size="large"
            />
          </Form.Item>

          {/* 密码 */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入你的密码!' }]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large"
            />
          </Form.Item>

          {/* 登录按钮 (绑定了 loading) */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ width: '100%' }}
              loading={isLoading} 
            >
              登 录
            </Button>
          </Form.Item>

          {/* 注册链接 */}
          <Form.Item style={{ textAlign: 'center' }}>
            还没有账户? <Link to="/register">立即注册</Link>
          </Form.Item>
        </Form>
      </Card>
    </Layout>
  );
};

export default LoginPage;