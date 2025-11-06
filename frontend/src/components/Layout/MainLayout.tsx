import React, { useState, useEffect } from 'react';
import { Layout, Menu, Avatar, Dropdown, Badge, Drawer, Button } from 'antd'; 
import { Link, Outlet, useLocation } from 'react-router-dom';
import { 
  UserOutlined, 
  LogoutOutlined, 
  PlusOutlined, 
  HeartOutlined, 
  MessageOutlined, 
  TransactionOutlined,
  MenuOutlined,
  HomeOutlined
} from '@ant-design/icons';
import './MainLayout.css'; 
import { useAuth } from '../../hooks/useAuth';
import messageService from '../../api/messageService';
import { API_BASE_URL } from '../../api/apiService';

const { Header, Content, Footer } = Layout;

const MainLayout: React.FC = () => {
  const { user, logout, isLoading } = useAuth();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [mobileMenuVisible, setMobileMenuVisible] = useState<boolean>(false);

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
    ? (user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`)
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
      
      <Header className="main-header">
        {/* 移动端菜单按钮 */}
        <Button 
          className="mobile-menu-button"
          type="text"
          icon={<MenuOutlined style={{ fontSize: '20px', color: '#fff' }} />}
          onClick={() => setMobileMenuVisible(true)}
        />

        {/* 左侧：Logo + 菜单 */}
        <div className="header-left">
          <div className="logo">
            <Link to="/" style={{ color: '#fff', fontSize: '18px', fontWeight: 'bold', textDecoration: 'none' }}>
              校园二手
            </Link>
          </div>
          
          <Menu 
            theme="dark" 
            mode="horizontal" 
            selectedKeys={getSelectedMenuKey()}
            className="desktop-menu"
            style={{ 
              flex: 1,
              minWidth: 0,
              borderBottom: 'none'
            }}
          >
            <Menu.Item key="home" icon={<HomeOutlined />}>
              <Link to="/">首页</Link>
            </Menu.Item>
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
                  <Link to="/favorites">收藏</Link>
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
        <div className="header-right">
          {!isLoading && (
            user ? (
              <Dropdown overlay={menuOverlay} trigger={['hover', 'click']}>
                <Link to="/profile">
                  <Avatar 
                    src={avatarSrc} 
                    icon={<UserOutlined />} 
                    style={{ 
                      cursor: 'pointer',
                      border: location.pathname === '/profile' ? '2px solid #1890ff' : 'none'
                    }}
                  />
                </Link>
              </Dropdown>
            ) : (
              <Menu theme="dark" mode="horizontal" className="auth-menu">
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

      {/* 移动端抽屉菜单 */}
      <Drawer
        title="菜单"
        placement="left"
        onClose={() => setMobileMenuVisible(false)}
        open={mobileMenuVisible}
        className="mobile-drawer"
      >
        <Menu
          mode="vertical"
          selectedKeys={getSelectedMenuKey()}
          onClick={() => setMobileMenuVisible(false)}
        >
          <Menu.Item key="home" icon={<HomeOutlined />}>
            <Link to="/">首页</Link>
          </Menu.Item>
          {user && (
            <>
              <Menu.Item key="inbox">
                <Link to="/inbox" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Badge count={unreadCount} size="small">
                    <MessageOutlined />
                  </Badge>
                  <span>消息</span>
                </Link>
              </Menu.Item>
              <Menu.Item key="favorites" icon={<HeartOutlined />}>
                <Link to="/favorites">我的收藏</Link>
              </Menu.Item>
              <Menu.Item key="transactions" icon={<TransactionOutlined />}>
                <Link to="/transactions">交易记录</Link>
              </Menu.Item>
              <Menu.Item key="create" icon={<PlusOutlined />}>
                <Link to="/posts/new">发布商品</Link>
              </Menu.Item>
              <Menu.Divider />
              <Menu.Item key="profile" icon={<UserOutlined />}>
                <Link to="/profile">个人中心</Link>
              </Menu.Item>
              <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
                退出登录
              </Menu.Item>
            </>
          )}
          {!user && (
            <>
              <Menu.Item key="login">
                <Link to="/login">登录</Link>
              </Menu.Item>
              <Menu.Item key="register">
                <Link to="/register">注册</Link>
              </Menu.Item>
            </>
          )}
        </Menu>
      </Drawer>

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