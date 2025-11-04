import React, { useEffect, useState } from 'react';
import { message, Empty, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { HeartOutlined } from '@ant-design/icons';
import postService from '../api/postService';
import type { Post } from '../types/post.types';
import PostCard, { PostCardSkeleton } from '../components/PostCard';
import './FavoritesPage.css';

const FavoritesPage: React.FC = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  // 获取收藏列表
  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const data = await postService.getMyFavorites();
      setFavorites(data);
    } catch (error) {
      message.error('获取收藏列表失败');
      console.error('Failed to fetch favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFavorites();
  }, []);

  if (loading) {
    return (
      <div className="favorites-page">
        <div className="favorites-header">
          <h1>
            <HeartOutlined /> 我的收藏
          </h1>
        </div>
        <div className="favorites-grid">
          {Array.from({ length: 8 }).map((_, index) => (
            <PostCardSkeleton key={`skeleton-${index}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <div className="favorites-header">
        <h1>
          <HeartOutlined /> 我的收藏
        </h1>
        <p className="favorites-count">共 {favorites.length} 个收藏</p>
      </div>

      {favorites.length === 0 ? (
        <div className="favorites-empty">
          <Empty
            description={
              <div>
                <p>还没有收藏任何商品</p>
                <p style={{ color: '#999', fontSize: '14px' }}>
                  浏览感兴趣的商品，点击爱心收藏吧～
                </p>
              </div>
            }
          >
            <Button type="primary" onClick={() => navigate('/')}>
              去逛逛
            </Button>
          </Empty>
        </div>
      ) : (
        <div className="favorites-grid">
          {favorites.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
};

export default FavoritesPage;
