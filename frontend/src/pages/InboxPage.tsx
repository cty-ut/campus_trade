import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { List, Avatar, Card, Empty, Spin, App, Button, Tag, Badge } from 'antd';
import { UserOutlined, MessageOutlined, ReloadOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import messageService from '../api/messageService';
import type { InboxConversation } from '../types/message.types';
import './InboxPage.css';

const API_BASE_URL = 'http://localhost:8000';

const InboxPage: React.FC = () => {
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, isLoading } = useAuth();  // 添加 isLoading

  const [conversations, setConversations] = useState<InboxConversation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);

  // 获取收件箱
  const fetchInbox = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const data = await messageService.getInbox();
      setConversations(data);
    } catch (error: any) {
      console.error('获取收件箱失败:', error);
      if (!isRefresh) {
        app.message.error('获取消息列表失败');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (isLoading) return;  // 等待加载完成
    
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }

    // 初次加载
    fetchInbox();

    // 优化：每 60 秒自动刷新（从 30 秒改为 60 秒）
    const interval = setInterval(() => {
      fetchInbox(true);
    }, 60000);

    // 组件卸载时清理定时器
    return () => clearInterval(interval);
  }, [user, isLoading]);

  // 判断会话是否有未读消息（只依赖后端的 is_read 字段）
  const hasUnreadMessage = (conv: InboxConversation): boolean => {
    if (!user) return false;
    
    // 最后一条消息必须是对方发送的且未读
    return conv.last_message.sender_id !== user.id && !conv.last_message.is_read;
  };

  // 点击会话，跳转到聊天页面
  const handleConversationClick = (conv: InboxConversation) => {
    navigate(`/chat/${conv.post.id}/${conv.other_user.id}`);
  };

  // 手动刷新
  const handleRefresh = () => {
    fetchInbox(true);
  };

  // 格式化时间显示
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days === 1) return '昨天';
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN');
  };

  // 获取用户头像
  const getAvatarUrl = (avatarUrl: string | null) => {
    if (avatarUrl) {
      return `${API_BASE_URL}${avatarUrl}`;
    }
    return undefined;
  };

  // 加载中
  if (loading) {
    return (
      <div className="inbox-page">
        <div className="inbox-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="inbox-page">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>
              <MessageOutlined /> 我的消息
            </span>
            <Button
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
              size="small"
            >
              刷新
            </Button>
          </div>
        }
        className="inbox-card"
      >
        {conversations.length === 0 ? (
          <Empty
            description="还没有消息"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/')}>
              去逛逛
            </Button>
          </Empty>
        ) : (
          <List
            itemLayout="horizontal"
            dataSource={conversations}
            renderItem={(conv) => (
              <List.Item
                className="conversation-item"
                onClick={() => handleConversationClick(conv)}
                style={{ cursor: 'pointer' }}
              >
                <List.Item.Meta
                  avatar={
                    <Badge dot={hasUnreadMessage(conv)} offset={[-5, 5]}>
                      <Avatar
                        size={56}
                        src={getAvatarUrl(conv.other_user.avatar_url)}
                        icon={<UserOutlined />}
                      />
                    </Badge>
                  }
                  title={
                    <div className="conversation-title">
                      <span className="username">{conv.other_user.username}</span>
                      <span className="time">{formatTime(conv.last_message.created_at)}</span>
                    </div>
                  }
                  description={
                    <div className="conversation-description">
                      <div className="post-title">
                        <Tag color="blue" style={{ marginRight: '8px' }}>
                          {conv.post.title}
                        </Tag>
                      </div>
                      <div className="last-message">
                        {conv.last_message.sender_id === user?.id ? '我: ' : ''}
                        {conv.last_message.content}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
};

export default InboxPage;
