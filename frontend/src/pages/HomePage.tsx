import React, { useState, useEffect } from 'react';
import { Row, Col, Empty, App, Tabs, Pagination, Input, Select, Space } from 'antd';
import { ShoppingOutlined, ShopOutlined, GiftOutlined, AppstoreOutlined, SearchOutlined } from '@ant-design/icons';
import PostCard, { PostCardSkeleton } from '../components/PostCard';
import postService from '../api/postService';
import type { Post, PostType, Category } from '../types/post.types';
import './HomePage.css';

const { Search } = Input;

const HomePage: React.FC = () => {
  const app = App.useApp();
  
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(12); // 每页显示 12 条
  const [total, setTotal] = useState<number>(0); // 总数据量
  
  // 搜索相关状态
  const [keyword, setKeyword] = useState<string>('');
  const [categoryId, setCategoryId] = useState<number | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'latest' | 'price_asc' | 'price_desc'>('latest');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isInitialLoad, setIsInitialLoad] = useState<boolean>(true); // 标记首次加载

  // 获取帖子列表
  const fetchPosts = async (postType?: PostType, page: number = 1) => {
    setLoading(true);
    try {
      const skip = (page - 1) * pageSize; // 计算跳过的数据量
      const response = await postService.getPosts({
        post_type: postType,
        skip: skip,
        limit: pageSize,
        keyword: keyword || undefined,
        category_id: categoryId,
        sort_by: sortBy,
      });
      
      // 使用后端返回的真实数据
      setPosts(response.posts);
      setTotal(response.total);
    } catch (error: any) {
      console.error('获取帖子列表失败:', error);
      app.message.error('获取帖子列表失败，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 组件挂载时并行获取分类列表和帖子列表（性能优化）
  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      try {
        // 🚀 并行请求，节省时间
        const skip = (currentPage - 1) * pageSize;
        const [categoriesData, postsData] = await Promise.all([
          postService.getCategories(),
          postService.getPosts({
            post_type: undefined,
            skip: skip,
            limit: pageSize,
            keyword: keyword || undefined,
            category_id: categoryId,
            sort_by: sortBy,
          })
        ]);
        
        setCategories(categoriesData);
        setPosts(postsData.posts);
        setTotal(postsData.total);
        setIsInitialLoad(false); // 标记首次加载完成
      } catch (error) {
        console.error('初始化数据失败:', error);
        app.message.error('加载失败，请稍后再试');
      } finally {
        setLoading(false);
      }
    };
    
    initData();
  }, []); // 只在组件挂载时执行一次

  // 当筛选条件变化时重新获取数据（跳过首次加载）
  useEffect(() => {
    if (isInitialLoad) return; // 跳过首次加载
    
    const postType = activeTab === 'all' ? undefined : (activeTab as PostType);
    fetchPosts(postType, currentPage);
  }, [activeTab, currentPage, keyword, categoryId, sortBy]);  // ✅ 添加所有依赖

  // 处理搜索
  const handleSearch = (value: string) => {
    setKeyword(value);
    setCurrentPage(1);
  };

  // 处理分类筛选
  const handleCategoryChange = (value: number | undefined) => {
    setCategoryId(value);
    setCurrentPage(1);
  };

  // 处理排序变化
  const handleSortChange = (value: 'latest' | 'price_asc' | 'price_desc') => {
    setSortBy(value);
    setCurrentPage(1);
  };

  // 清空所有筛选
  const handleClearFilters = () => {
    setKeyword('');
    setCategoryId(undefined);
    setSortBy('latest');
    setCurrentPage(1);
  };

  // 处理标签页切换
  const handleTabChange = (key: string) => {
    setActiveTab(key);
    setCurrentPage(1); // 重置到第一页
    // useEffect 会自动触发数据获取
  };

  // 处理分页切换
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // 滚动到页面顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
    // useEffect 会自动触发数据获取
  };

  // 定义标签页项
  const tabItems = [
    {
      key: 'all',
      label: (
        <span>
          <AppstoreOutlined />
          全部
        </span>
      ),
    },
    {
      key: 'sell',
      label: (
        <span>
          <ShoppingOutlined />
          出售
        </span>
      ),
    },
    {
      key: 'buy',
      label: (
        <span>
          <ShopOutlined />
          求购
        </span>
      ),
    },
    {
      key: 'free',
      label: (
        <span>
          <GiftOutlined />
          免费
        </span>
      ),
    },
  ];

  // 渲染帖子列表
  const renderPostList = () => {
    if (loading) {
      return (
        <Row gutter={[16, 16]}>
          {Array.from({ length: pageSize }).map((_, index) => (
            <Col 
              key={`skeleton-${index}`}
              xs={24}
              sm={12}
              md={8}
              lg={6}
              xl={6}
            >
              <PostCardSkeleton />
            </Col>
          ))}
        </Row>
      );
    }

    if (posts.length === 0) {
      const hasFilters = keyword || categoryId || sortBy !== 'latest';
      return (
        <div className="empty-container">
          <Empty 
            description={
              hasFilters 
                ? "未找到符合条件的商品，试试调整筛选条件吧" 
                : "暂无帖子"
            }
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        </div>
      );
    }

    return (
      <Row gutter={[16, 16]}>
        {posts.map((post) => (
          <Col 
            key={post.id}
            xs={24}  // 手机：1列
            sm={12}  // 平板：2列
            md={8}   // 小屏电脑：3列
            lg={6}   // 大屏电脑：4列
            xl={6}   // 超大屏：4列
          >
            <PostCard post={post} />
          </Col>
        ))}
      </Row>
    );
  };

  // 展示帖子列表
  return (
    <div className="home-page">
      {/* 搜索栏 */}
      <div className="search-bar">
        <Space.Compact style={{ width: '100%' }} size="large">
          <Search
            placeholder="搜索商品标题或描述"
            allowClear
            enterButton={<SearchOutlined />}
            size="large"
            onSearch={handleSearch}
            style={{ maxWidth: 500 }}
          />
        </Space.Compact>
        
        <div className="filter-bar">
          <Space wrap>
            <Select
              placeholder="选择分类"
              allowClear
              style={{ width: 150 }}
              value={categoryId}
              onChange={handleCategoryChange}
            >
              {categories.map((cat) => (
                <Select.Option key={cat.id} value={cat.id}>
                  {cat.name}
                </Select.Option>
              ))}
            </Select>
            
            <Select
              style={{ width: 150 }}
              value={sortBy}
              onChange={handleSortChange}
            >
              <Select.Option value="latest">最新发布</Select.Option>
              <Select.Option value="price_asc">价格从低到高</Select.Option>
              <Select.Option value="price_desc">价格从高到低</Select.Option>
            </Select>

            {(keyword || categoryId || sortBy !== 'latest') && (
              <a onClick={handleClearFilters} style={{ marginLeft: 8 }}>
                清空筛选
              </a>
            )}
          </Space>
        </div>
      </div>

      {/* 筛选标签页 */}
      <Tabs
        activeKey={activeTab}
        items={tabItems}
        onChange={handleTabChange}
        className="post-type-tabs"
      />

      {/* 帖子列表 */}
      {renderPostList()}

      {/* 分页器 */}
      {!loading && posts.length > 0 && (
        <div className="pagination-container">
          <Pagination
            current={currentPage}
            pageSize={pageSize}
            total={total}
            onChange={handlePageChange}
            showSizeChanger={false}
            showTotal={(total) => `共 ${total} 条`}
          />
        </div>
      )}
    </div>
  );
};

export default HomePage;