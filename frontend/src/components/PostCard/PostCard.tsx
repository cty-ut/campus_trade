import React, { useState, useEffect } from 'react';
import { Card, Tag, Avatar, Typography, Skeleton } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { Post } from '../../types/post.types';
import { API_BASE_URL } from '../../api/apiService';
import './PostCard.css';

const { Meta } = Card;
const { Text } = Typography;

interface PostCardProps {
  post: Post;
}

/**
 * 帖子卡片组件
 * 用于在列表中展示单个帖子的缩略信息
 */
const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const navigate = useNavigate();
  const [imageLoaded, setImageLoaded] = useState(false);

  // 检查是否有图片
  const hasImage = post.images && post.images.length > 0;

  // 如果没有图片，直接设置为已加载（不显示骨架屏）
  useEffect(() => {
    if (!hasImage) {
      setImageLoaded(true);
    }
  }, [hasImage]);

  // 处理卡片点击，跳转到详情页
  const handleCardClick = () => {
    navigate(`/posts/${post.id}`);
  };

  // 处理头像点击，跳转到用户主页
  const handleAvatarClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // 阻止事件冒泡，避免触发卡片点击
    navigate(`/users/${post.owner.id}`);
  };

  // 获取帖子类型标签配置
  const getPostTypeTag = () => {
    switch (post.post_type) {
      case 'sell':
        return <Tag color="blue">出售</Tag>;
      case 'buy':
        return <Tag color="green">求购</Tag>;
      case 'free':
        return <Tag color="red">免费</Tag>;
      default:
        return null;
    }
  };

  // 获取商品状态标签
  const getStatusTag = () => {
    if (post.status === 'sold') {
      return <Tag color="default">已售出</Tag>;
    }
    return null;
  };

  // 获取新旧程度文本
  const getConditionText = () => {
    if (!post.condition) return '';
    const conditionMap = {
      new: '全新',
      like_new: '几乎全新',
      good: '良好',
      fair: '一般',
    };
    return conditionMap[post.condition] || '';
  };

  // 获取封面图片 URL
  const getCoverImage = () => {
    if (post.images && post.images.length > 0) {
      const imageUrl = post.images[0].image_url;
      // 如果已经是完整 URL，直接返回；否则拼接
      return imageUrl.startsWith('http') ? imageUrl : `${API_BASE_URL}${imageUrl}`;
    }
    // 如果没有图片，返回默认占位图
    return 'https://via.placeholder.com/300x200?text=暂无图片';
  };

  // 获取用户头像 URL
  const getAvatarUrl = () => {
    if (post.owner.avatar_url) {
      return post.owner.avatar_url.startsWith('http') ? post.owner.avatar_url : `${API_BASE_URL}${post.owner.avatar_url}`;
    }
    return undefined;
  };

  // 格式化价格显示
  const getPriceDisplay = () => {
    if (post.post_type === 'free') {
      return <Text strong style={{ fontSize: '18px', color: '#ff4d4f' }}>免费</Text>;
    }
    if (post.post_type === 'buy') {
      if (post.price_min !== null && post.price_min !== post.price) {
        return (
          <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>
            ¥{post.price_min} - ¥{post.price}
          </Text>
        );
      }
      return <Text strong style={{ fontSize: '18px', color: '#52c41a' }}>¥{post.price}</Text>;
    }
    // 出售类型
    return <Text strong style={{ fontSize: '18px', color: '#1890ff' }}>¥{post.price}</Text>;
  };

  return (
    <Card
      hoverable
      className="post-card"
      cover={
        <div style={{ position: 'relative', height: '200px', overflow: 'hidden' }}>
          {/* 骨架屏占位符 */}
          {!imageLoaded && (
            <Skeleton.Image 
              active 
              style={{ 
                width: '100%', 
                height: '200px',
                position: 'absolute',
                top: 0,
                left: 0
              }} 
            />
          )}
          {/* 实际图片 */}
          <img
            alt={post.title}
            src={getCoverImage()}
            className="post-card-cover"
            onClick={handleCardClick}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageLoaded(true)} // 加载失败也隐藏骨架屏
            style={{
              opacity: imageLoaded ? 1 : 0,
              transition: 'opacity 0.3s ease-in',
              width: '100%',
              height: '200px',
              objectFit: 'cover'
            }}
            loading="lazy"
          />
        </div>
      }
      onClick={handleCardClick}
    >
      {/* 标签区域 */}
      <div className="post-card-tags">
        {getPostTypeTag()}
        {getStatusTag()}
        {post.condition && <Tag>{getConditionText()}</Tag>}
      </div>

      {/* 标题 */}
      <div className="post-card-title">{post.title}</div>

      {/* 价格 */}
      <div className="post-card-price">{getPriceDisplay()}</div>

      {/* 分类 */}
      <div className="post-card-category">
        <Text type="secondary">{post.category.name}</Text>
      </div>

      {/* 底部：用户信息 */}
      <Meta
        avatar={
          <div onClick={handleAvatarClick} style={{ cursor: 'pointer' }}>
            <Avatar src={getAvatarUrl()} icon={<UserOutlined />} />
          </div>
        }
        title={post.owner.username}
        description={`成功交易 ${post.owner.success_trades} 次`}
      />
    </Card>
  );
};

export default PostCard;
