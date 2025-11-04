import React, { useState } from 'react';
import { Layout, Card, Form, Input, Button, Typography, App } from 'antd'; 
import { MailOutlined, UserOutlined, LockOutlined } from '@ant-design/icons';
import { Link, useNavigate, Navigate } from 'react-router-dom';
import './LoginPage.css'; 

import { useAuth } from '../hooks/useAuth'; 
import apiService from '../api/apiService'; 
import type { User } from '../types/user.types';


const { Title } = Typography;

const RegisterPage: React.FC = () => {
  const app = App.useApp(); 

  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  if (user) {
    return <Navigate to="/" replace />;
  }

  const onFinish = async (values: any) => {
    
    console.log('注册表单提交:', values);
    setIsLoading(true); // 1. (显示“加载中”...)

    try {
      const response = await apiService.post<User>('/api/users/register', {
        email: values.email,
        username: values.username,
        password: values.password,
      });

      console.log('注册成功:', response.data);

      // 3. (注册成功)
      app.message.success(
        '注册成功！即将跳转到登录页，请使用新账户登录。', 
        3 // (提示显示 3 秒)
      );
      
      navigate('/login'); 

    } catch (error: any) {
      // 5. (注册失败)
      console.error('注册失败:', error);
      
      // (和登录页一样) 尝试从后端获取详细错误
      const errorMessage = error.response?.data?.detail 
        || '注册失败！请稍后再试。';

      app.message.error(errorMessage);
      
    } finally {
      // 6. (无论成功还是失败，都停止加载)
      setIsLoading(false);
    }
  };


  // (下面的 JSX 表单代码, 只需要在 <Button> 上加一个 loading)
  return (
    <Layout className="login-page-layout">
      
      <Card className="login-card" title={<Title level={3}>创建新账户</Title>}>
        
        <Form
          name="register"
          onFinish={onFinish}
          autoComplete="off"
        >
          {/* 字段 1: 邮箱 (Email) */}
          <Form.Item
            name="email"
            rules={[
              { required: true, message: '请输入你的邮箱!' },
              { type: 'email', message: '请输入有效的邮箱地址!' },
            ]}
          >
            <Input 
              prefix={<MailOutlined />} 
              placeholder="学校邮箱" 
              size="large"
            />
          </Form.Item>

          {/* 字段 2: 用户名 (Username) */}
          <Form.Item
            name="username"
            rules={[{ required: true, message: '请输入你的用户名!' }]}
          >
            <Input 
              prefix={<UserOutlined />} 
              placeholder="用户名" 
              size="large"
            />
          </Form.Item>

          {/* 字段 3: 密码 (Password) */}
          <Form.Item
            name="password"
            rules={[{ required: true, message: '请输入密码!' }]}
            hasFeedback 
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="密码" 
              size="large"
            />
          </Form.Item>

          {/* 字段 4: 确认密码 (Confirm Password) */}
          <Form.Item
            name="confirm"
            dependencies={['password']} 
            hasFeedback
            rules={[
              { required: true, message: '请确认你的密码!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致!'));
                },
              }),
            ]}
          >
            <Input.Password 
              prefix={<LockOutlined />} 
              placeholder="确认密码" 
              size="large"
            />
          </Form.Item>

          {/* 字段 5: 注册按钮 */}
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              size="large"
              style={{ width: '100%' }}
              loading={isLoading} // 👈 新增：绑定 "加载中" 状态
            >
              注 册
            </Button>
          </Form.Item>

          {/* 字段 6: 登录链接 */}
          <Form.Item style={{ textAlign: 'center' }}>
            已经有账户了? <Link to="/login">返回登录</Link>
          </Form.Item>

        </Form>
      </Card>
    </Layout>
  );
};

export default RegisterPage;