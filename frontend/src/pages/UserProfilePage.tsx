import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Tabs, Button, App, Row, Col, Skeleton } from 'antd';
import { UserOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import postService from '../api/postService';
import type { Post } from '../types/post.types';
import type { User } from '../types/user.types';
import PostCard, { PostCardSkeleton } from '../components/PostCard';
import { API_BASE_URL } from '../api/apiService';
import './UserProfilePage.css';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const app = App.useApp();

  const [user, setUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('sell');

  // 获取用户信息和帖子
  useEffect(() => {
    const fetchUserData = async () => {
      if (!userId) return;

      setLoading(true);
      try {
        // 获取用户的帖子列表
        const { posts: allPosts } = await postService.getPosts({ 
          skip: 0, 
          limit: 100 
        });
        
        // 筛选出该用户的帖子
        const userPosts = allPosts.filter(post => post.owner.id === Number(userId));
        
        if (userPosts.length > 0) {
          setUser(userPosts[0].owner);
        } else {
          app.message.error('用户不存在');
          navigate('/');
          return;
        }

        setPosts(userPosts);
      } catch (error: any) {
        console.error('获取用户信息失败:', error);
        app.message.error('获取用户信息失败');
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // 返回上一页
  const handleBack = () => {
    navigate(-1);
  };

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
  };

  // 获取头像 URL
  const getAvatarUrl = () => {
    if (user?.avatar_url) {
      return user.avatar_url.startsWith('http') ? user.avatar_url : `${API_BASE_URL}${user.avatar_url}`;
    }
    return undefined;
  };

  // 根据类型筛选帖子
  const getFilteredPosts = () => {
    return posts.filter(post => post.post_type === activeTab);
  };

  // 标签页配置
  const tabItems = [
    {
      key: 'sell',
      label: '在售',
    },
    {
      key: 'buy',
      label: '求购',
    },
    {
      key: 'free',
      label: '免费',
    },
  ];

  if (loading) {
    return (
      <div className="user-profile-page">
        <Button 
          icon={<ArrowLeftOutlined />} 
          onClick={handleBack}
          style={{ marginBottom: '16px' }}
        >
          返回
        </Button>

        {/* 用户信息卡片骨架屏 */}
        <Card className="user-info-card">
          <div className="user-info-header">
            <Skeleton.Avatar active size={100} />
            <div className="user-info-details" style={{ flex: 1, marginLeft: '24px' }}>
              <Skeleton active paragraph={{ rows: 3 }} />
            </div>
          </div>
        </Card>

        {/* 帖子列表骨架屏 */}
        <Card style={{ marginTop: '24px' }}>
          <Tabs items={tabItems} />
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {Array.from({ length: 6 }).map((_, index) => (
              <Col key={`skeleton-${index}`} xs={24} sm={12} md={8} lg={6}>
                <PostCardSkeleton />
              </Col>
            ))}
          </Row>
        </Card>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const filteredPosts = getFilteredPosts();

  return (
    <div className="user-profile-page">
      {/* 返回按钮 */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      {/* 用户信息卡片 */}
      <Card className="user-info-card">
        <div className="user-info-header">
          <Avatar 
            size={100} 
            src={getAvatarUrl()} 
            icon={<UserOutlined />}
          />
          <div className="user-info-details">
            <h2>{user.username}</h2>
            <p className="user-email">{user.email}</p>
            <p className="user-stats">
              成功交易 <strong>{user.success_trades}</strong> 次
            </p>
          </div>
        </div>
      </Card>

      {/* 用户发布的帖子 */}
      <Card className="user-posts-card">
        <Tabs 
          activeKey={activeTab} 
          onChange={handleTabChange}
          items={tabItems}
        />
        
        <div className="posts-grid">
          {filteredPosts.length > 0 ? (
            <Row gutter={[16, 16]}>
              {filteredPosts.map(post => (
                <Col key={post.id} xs={24} sm={12} md={8} lg={6}>
                  <PostCard post={post} />
                </Col>
              ))}
            </Row>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#999' }}>
              暂无{activeTab === 'sell' ? '在售' : activeTab === 'buy' ? '求购' : '免费'}商品
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default UserProfilePage;
