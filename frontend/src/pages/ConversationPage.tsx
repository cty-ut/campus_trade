import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Avatar, Input, Button, Spin, App, Tag, Empty } from 'antd';
import { UserOutlined, ArrowLeftOutlined, SendOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import messageService from '../api/messageService';
import postService from '../api/postService';
import type { Message } from '../types/message.types';
import type { Post } from '../types/post.types';
import { API_BASE_URL } from '../api/apiService';
import './ConversationPage.css';

const ConversationPage: React.FC = () => {
  const { postId, otherUserId } = useParams<{ postId: string; otherUserId: string }>();
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, isLoading } = useAuth();  // 添加 isLoading

  const [messages, setMessages] = useState<Message[]>([]);
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [sending, setSending] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<any>(null);
  const lastMessageIdRef = useRef<number | null>(null);

  // 自动滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 获取消息列表
  const fetchMessages = async () => {
    if (!postId || !otherUserId) return;

    try {
      const data = await messageService.getConversation(Number(postId), Number(otherUserId));
      
      // 检查是否有新消息
      if (data.length > 0) {
        const latestMessageId = data[data.length - 1].id;
        if (latestMessageId !== lastMessageIdRef.current) {
          setMessages(data);
          lastMessageIdRef.current = latestMessageId;
          // 有新消息时滚动到底部
          setTimeout(scrollToBottom, 100);
        }
      } else {
        setMessages(data);
      }
    } catch (error: any) {
      console.error('获取消息失败:', error);
    }
  };

  // 获取帖子信息
  const fetchPost = async () => {
    if (!postId) return;

    try {
      const data = await postService.getPostById(Number(postId));
      setPost(data);
    } catch (error: any) {
      console.error('获取帖子信息失败:', error);
      app.message.error('获取帖子信息失败');
    }
  };

  // 初始化加载
  useEffect(() => {
    if (isLoading) return;  // 等待加载完成
    
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }

    const initLoad = async () => {
      setLoading(true);
      await Promise.all([fetchMessages(), fetchPost()]);
      setLoading(false);
      
      // 加载完成后标记会话为已读
      if (postId && otherUserId) {
        await messageService.markAsRead(Number(postId), Number(otherUserId));
      }
    };

    initLoad();

    // 优化：每 5 秒轮询新消息（从 3 秒改为 5 秒，减少服务器压力）
    const interval = setInterval(() => {
      fetchMessages();
    }, 5000);

    // 组件卸载时清理定时器
    return () => clearInterval(interval);
  }, [postId, otherUserId, user, isLoading]);

  // 发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || !postId || !otherUserId) {
      return;
    }

    const tempMessageId = Date.now(); // 临时 ID
    setSending(true);
    try {
      // 乐观更新：立即在 UI 显示
      const tempMessage: Message = {
        id: tempMessageId,
        content: inputValue,
        post_id: Number(postId),
        sender_id: user!.id,
        receiver_id: Number(otherUserId),
        is_read: false,
        created_at: new Date().toISOString(),
        sender: user!,
        receiver: messages[0]?.receiver || messages[0]?.sender, // 获取对方信息
      };
      
      setMessages([...messages, tempMessage]);
      const sentContent = inputValue;
      setInputValue('');
      scrollToBottom();

      // 发送到后端
      await messageService.sendMessage({
        content: sentContent,
        post_id: Number(postId),
        receiver_id: Number(otherUserId),
      });

      // 发送成功后立即刷新
      await fetchMessages();
      
      // 发送成功后自动聚焦到输入框
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    } catch (error: any) {
      console.error('发送消息失败:', error);
      app.message.error('发送失败，请重试');
      // 发送失败，移除临时消息
      setMessages(prevMessages => prevMessages.filter(m => m.id !== tempMessageId));
    } finally {
      setSending(false);
    }
  };

  // 处理回车发送
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 获取对方用户信息
  const getOtherUser = () => {
    if (messages.length === 0) return null;
    const firstMessage = messages[0];
    return firstMessage.sender_id === user?.id ? firstMessage.receiver : firstMessage.sender;
  };

  // 获取头像 URL
  const getAvatarUrl = (avatarUrl: string | null) => {
    if (avatarUrl) {
      return avatarUrl.startsWith('http') ? avatarUrl : `${API_BASE_URL}${avatarUrl}`;
    }
    return undefined;
  };

  // 格式化时间（UTC+9 日本时间）
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    // 直接加 9 小时转换为日本时间
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    
    const now = new Date();
    const nowJST = new Date(now.getTime() + 9 * 60 * 60 * 1000);
    const today = new Date(nowJST.getFullYear(), nowJST.getMonth(), nowJST.getDate());
    const messageDate = new Date(jstDate.getFullYear(), jstDate.getMonth(), jstDate.getDate());

    const hours = String(jstDate.getHours()).padStart(2, '0');
    const minutes = String(jstDate.getMinutes()).padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;

    if (messageDate.getTime() === today.getTime()) {
      return timeStr;
    } else if (messageDate.getTime() === today.getTime() - 86400000) {
      return `昨天 ${timeStr}`;
    } else {
      const year = jstDate.getFullYear();
      const month = jstDate.getMonth() + 1;
      const day = jstDate.getDate();
      return `${year}/${month}/${day} ${timeStr}`;
    }
  };
  const otherUser = getOtherUser();

  if (loading) {
    return (
      <div className="conversation-page">
        <div className="conversation-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="conversation-page">
      {/* 顶部信息栏 */}
      <Card className="conversation-header">
        <div className="header-content">
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => navigate('/inbox')}
            style={{ marginRight: '16px' }}
          >
            返回
          </Button>
          {otherUser && (
            <div className="user-info">
              <Avatar
                size={40}
                src={getAvatarUrl(otherUser.avatar_url)}
                icon={<UserOutlined />}
              />
              <div className="user-details">
                <span className="username">{otherUser.username}</span>
                {post && (
                  <Tag
                    color="blue"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/posts/${post.id}`)}
                  >
                    关于：{post.title}
                  </Tag>
                )}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* 消息列表区域 */}
      <Card className="messages-container">
        {messages.length === 0 ? (
          <Empty description="还没有消息，开始聊天吧" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        ) : (
          <div className="messages-list">
            {messages.map((message) => {
              const isMine = message.sender_id === user?.id;
              return (
                <div
                  key={message.id}
                  className={`message-item ${isMine ? 'mine' : 'other'}`}
                >
                  {!isMine && (
                    <Avatar
                      size={36}
                      src={getAvatarUrl(message.sender.avatar_url)}
                      icon={<UserOutlined />}
                      className="message-avatar"
                    />
                  )}
                  <div className="message-content-wrapper">
                    <div className={`message-bubble ${isMine ? 'mine' : 'other'}`}>
                      {message.content}
                    </div>
                    <div className="message-time">{formatTime(message.created_at)}</div>
                  </div>
                  {isMine && (
                    <Avatar
                      size={36}
                      src={getAvatarUrl(message.sender.avatar_url)}
                      icon={<UserOutlined />}
                      className="message-avatar"
                    />
                  )}
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </Card>

      {/* 输入区域 */}
      <Card className="input-container">
        <div className="input-wrapper">
          <Input.TextArea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="输入消息... (Enter 发送，Shift+Enter 换行)"
            autoSize={{ minRows: 2, maxRows: 4 }}
            maxLength={500}
            showCount
            disabled={sending}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!inputValue.trim()}
            size="large"
          >
            发送
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ConversationPage;
