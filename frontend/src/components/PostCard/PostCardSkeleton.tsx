import React from 'react';
import { Card, Skeleton } from 'antd';
import './PostCard.css';

/**
 * 帖子卡片骨架屏组件
 * 用于加载时显示，提升用户体验
 */
const PostCardSkeleton: React.FC = () => {
  return (
    <Card
      className="post-card"
      cover={
        <Skeleton.Image 
          active 
          style={{ 
            width: '100%', 
            height: '200px',
            borderRadius: '8px 8px 0 0'
          }} 
        />
      }
    >
      {/* 标签区域 */}
      <div className="post-card-tags" style={{ marginBottom: '12px' }}>
        <Skeleton.Button active size="small" style={{ width: '50px', height: '22px' }} />
      </div>

      {/* 标题 */}
      <Skeleton 
        active 
        paragraph={{ rows: 1, width: '80%' }} 
        title={false}
        style={{ marginBottom: '8px' }}
      />

      {/* 价格 */}
      <Skeleton 
        active 
        paragraph={{ rows: 1, width: '40%' }} 
        title={false}
        style={{ marginBottom: '8px' }}
      />

      {/* 分类 */}
      <Skeleton 
        active 
        paragraph={{ rows: 1, width: '30%' }} 
        title={false}
        style={{ marginBottom: '16px' }}
      />

      {/* 底部用户信息 */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Skeleton.Avatar active size={40} />
        <div style={{ flex: 1 }}>
          <Skeleton active paragraph={{ rows: 2, width: ['60%', '80%'] }} title={false} />
        </div>
      </div>
    </Card>
  );
};

export default PostCardSkeleton;
