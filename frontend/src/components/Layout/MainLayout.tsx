import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge } from 'antd'; 
import { Link, Outlet, useLocation } from 'react-router-dom';
import { UserOutlined, LogoutOutlined, PlusOutlined, HeartOutlined, MessageOutlined, TransactionOutlined } from '@ant-design/icons';
import './MainLayout.css'; 
import { useAuth } from '../../hooks/useAuth';
import messageService from '../../api/messageService';

const { Header, Content, Footer } = Layout;

// 定义后端基础 URL (用于拼接图片)
const API_BASE_URL = 'http://localhost:8000';

const MainLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);

  // 根据当前路由计算选中的菜单项
  const getSelectedMenuKey = (): string[] => {
    const path = location.pathname;
    
    if (path === '/') return ['home'];
    if (path.startsWith('/inbox')) return ['inbox'];
    if (path.startsWith('/favorites')) return ['favorites'];
    if (path.startsWith('/transactions')) return ['transactions'];
    if (path.startsWith('/posts/new') || path === '/posts/create') return ['create'];
    if (path.startsWith('/profile')) return ['profile'];
    
    // 默认返回首页
    return ['home'];
  };

  // 获取未读消息数
  const fetchUnreadCount = async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    
    try {
      const count = await messageService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('获取未读消息数失败:', error);
    }
  };

  // 定期轮询未读消息数
  useEffect(() => {
    if (!user) return;

    // 初次加载
    fetchUnreadCount();

    // 优化：每 60 秒刷新一次（从 30 秒改为 60 秒）
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => clearInterval(interval);
  }, [user]);

  // 当路由变化时，刷新未读消息数
  useEffect(() => {
    if (user) {
      // 延迟一小会儿再刷新，确保后端已处理标记已读的请求
      const timer = setTimeout(() => {
        fetchUnreadCount();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [location.pathname, user]);

  const handleLogout = () => {
    logout();
    // 强制刷新页面，清除所有缓存状态
    window.location.href = '/login';
  };

  // 计算头像的完整 URL
  const avatarSrc = (user && user.avatar_url) 
    ? `${API_BASE_URL}${user.avatar_url}` 
    : undefined;

  const menuOverlay = (
    <Menu>
      <Menu.Item key="userinfo" disabled style={{ cursor: 'default' }}>
        你好, {user?.username}
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        退出登录
      </Menu.Item>
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh' }}>
      
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 50px' }}>
        {/* 左侧：Logo + 菜单 */}
        <div style={{ display: 'flex', alignItems: 'center', flex: 1 }}>
          <div className="logo" style={{ marginRight: '40px' }}>
            <span style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold' }}>校园二手</span>
          </div>
          
          <Menu 
            theme="dark" 
            mode="horizontal" 
            selectedKeys={getSelectedMenuKey()}  // 动态计算选中项
            // 禁用响应式折叠，保持所有菜单项始终可见
            overflowedIndicator={null}
            style={{ 
              flex: 1,
              minWidth: 0,
              borderBottom: 'none'
            }}
          >
            <Menu.Item key="home">
              <Link to="/">首页</Link>
            </Menu.Item>
            {/* 只有在非加载状态且已登录时才显示菜单 */}
            {!isLoading && user && (
              <>
                <Menu.Item key="inbox">
                  <Link to="/inbox" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Badge count={unreadCount} size="small">
                      <MessageOutlined style={{ color: '#fff' }} />
                    </Badge>
                    <span>消息</span>
                  </Link>
                </Menu.Item>
                <Menu.Item key="favorites" icon={<HeartOutlined />}>
                  <Link to="/favorites">我的收藏</Link>
                </Menu.Item>
                <Menu.Item key="transactions" icon={<TransactionOutlined />}>
                  <Link to="/transactions">交易</Link>
                </Menu.Item>
                <Menu.Item key="create" icon={<PlusOutlined />}>
                  <Link to="/posts/new">发布</Link>
                </Menu.Item>
              </>
            )}
          </Menu>
        </div>

        {/* 右侧：用户菜单 */}
        <div style={{ marginLeft: '20px' }}>
          {/* 加载中不显示任何内容，避免闪烁 */}
          {!isLoading && (
            user ? (
              // 如果 user 存在 (已登录)
              <Dropdown overlay={menuOverlay} trigger={['hover']}>
                <Link to="/profile">
                  <Avatar 
                    src={avatarSrc} 
                    icon={<UserOutlined />} 
                    style={{ 
                      cursor: 'pointer',
                      // 在个人中心页面时添加边框高亮
                      border: location.pathname === '/profile' ? '2px solid #1890ff' : 'none'
                    }}
                  />
                </Link>
              </Dropdown>
              
            ) : (
              
              // 如果 user 为 null (未登录)
              <Menu theme="dark" mode="horizontal">
                <Menu.Item key="login">
                  <Link to="/login">登录</Link>
                </Menu.Item>
                <Menu.Item key="register">
                  <Link to="/register">注册</Link>
                </Menu.Item>
              </Menu>
            )
          )}
        </div>
      </Header>

      {/* 内容区域 */}
      <Content className="site-layout-background">
        <div className="site-layout-content-wrapper">
          <Outlet />
        </div>
      </Content>

      {/* 底部页脚 */}
      <Footer style={{ textAlign: 'center' }}>
        校内二手交易平台 ©2024 Created by You
      </Footer>
    </Layout>
  );
};

export default MainLayout;