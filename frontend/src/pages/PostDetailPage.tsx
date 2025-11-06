import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, 
  Carousel, 
  Tag, 
  Avatar, 
  Button, 
  Descriptions, 
  App,
  Space,
  Divider,
  Modal,
  Dropdown,
  Select,
  Input,
  Skeleton,
} from 'antd';
import type { MenuProps } from 'antd';
import { 
  UserOutlined, 
  ArrowLeftOutlined, 
  MessageOutlined,
  HeartOutlined,
  HeartFilled,
  EditOutlined,
  DeleteOutlined,
  MoreOutlined,
  CheckCircleOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import postService from '../api/postService';
import reportService from '../api/reportService';
import transactionService from '../api/transactionService';
import type { Post } from '../types/post.types';
import type { User } from '../types/user.types';
import { API_BASE_URL } from '../api/apiService';
import './PostDetailPage.css';

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const app = App.useApp();
  const { user } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isFavorited, setIsFavorited] = useState<boolean>(false);
  const [reportModalVisible, setReportModalVisible] = useState<boolean>(false);
  const [reportReason, setReportReason] = useState<string>('');
  const [reportDescription, setReportDescription] = useState<string>('');
  const [reportSubmitting, setReportSubmitting] = useState<boolean>(false);
  
  // 选择买家对话框相关状态
  const [selectBuyerModalVisible, setSelectBuyerModalVisible] = useState<boolean>(false);
  const [contactedUsers, setContactedUsers] = useState<User[]>([]);
  const [selectedBuyer, setSelectedBuyer] = useState<number | null>(null);
  const [creatingTransaction, setCreatingTransaction] = useState<boolean>(false);

  // 获取帖子详情
  useEffect(() => {
    const fetchPostDetail = async () => {
      if (!id) return;
      
      setLoading(true);
      try {
        const data = await postService.getPostById(Number(id));
        setPost(data);
        
        // 如果用户已登录，检查是否已收藏
        if (user) {
          try {
            const favorited = await postService.checkIfFavorited(Number(id));
            setIsFavorited(favorited);
          } catch (error) {
            // 如果检查失败（比如未登录），默认为未收藏
            console.error('检查收藏状态失败:', error);
            setIsFavorited(false);
          }
        }
      } catch (error: any) {
        console.error('获取帖子详情失败:', error);
        app.message.error('获取帖子详情失败');
        // 3秒后返回首页
        setTimeout(() => navigate('/'), 3000);
      } finally {
        setLoading(false);
      }
    };

    fetchPostDetail();
  }, [id, user]);

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  // 跳转到用户主页
  const handleUserClick = () => {
    if (post?.owner.id) {
      navigate(`/users/${post.owner.id}`);
    }
  };

  // 收藏/取消收藏（乐观更新）
  const handleFavorite = async () => {
    if (!post) return;
    
    // 未登录时跳转到登录页
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }
    
    // 乐观更新：立即改变UI状态
    const previousState = isFavorited;
    setIsFavorited(!isFavorited);
    
    try {
      if (previousState) {
        await postService.unfavoritePost(post.id);
        app.message.success('已取消收藏');
      } else {
        await postService.favoritePost(post.id);
        app.message.success('收藏成功');
      }
    } catch (error: any) {
      // 如果请求失败，回滚UI状态
      setIsFavorited(previousState);
      const errorMsg = error.response?.data?.detail || '操作失败';
      app.message.error(errorMsg);
    }
  };

  // 联系卖家
  const handleContact = () => {
    if (!post) return;
    
    // 未登录时跳转到登录页
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }
    
    // 不能联系自己
    if (user.id === post.owner.id) {
      app.message.warning('不能联系自己');
      return;
    }
    
    // 跳转到聊天页面
    navigate(`/chat/${post.id}/${post.owner.id}`);
  };

  // 编辑帖子
  const handleEdit = () => {
    navigate(`/posts/${id}/edit`);
  };

  // 删除帖子
  const handleDelete = () => {
    app.modal.confirm({
      title: '确认删除',
      content: '删除后将无法恢复，确定要删除这个帖子吗？',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          await postService.deletePost(Number(id));
          app.message.success('删除成功');
          navigate('/');
        } catch (error: any) {
          const errorMsg = error.response?.data?.detail || '删除失败';
          app.message.error(errorMsg);
        }
      },
    });
  };

  // 标记为已售出（打开选择买家对话框）
  const handleMarkAsSold = async () => {
    if (!post) return;
    
    try {
      // 获取联系过的用户列表
      const users = await transactionService.getContactedUsers(post.id);
      
      if (users.length === 0) {
        app.message.warning('还没有用户联系过您，无法创建交易');
        return;
      }
      
      setContactedUsers(users);
      setSelectBuyerModalVisible(true);
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '获取联系人失败';
      app.message.error(errorMsg);
    }
  };

  // 确认选择买家并创建交易
  const handleConfirmBuyer = async () => {
    if (!post || !selectedBuyer) {
      app.message.error('请选择买家');
      return;
    }

    setCreatingTransaction(true);
    try {
      await transactionService.createTransaction({
        post_id: post.id,
        buyer_id: selectedBuyer,
      });
      
      app.message.success('已标记为售出并创建交易，请双方确认交易完成');
      setSelectBuyerModalVisible(false);
      setSelectedBuyer(null);
      
      // 刷新页面
      window.location.reload();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '创建交易失败';
      app.message.error(errorMsg);
    } finally {
      setCreatingTransaction(false);
    }
  };

  // 取消选择买家
  const handleCancelSelectBuyer = () => {
    setSelectBuyerModalVisible(false);
    setSelectedBuyer(null);
  };

  // 打开举报对话框
  const handleOpenReport = () => {
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }
    setReportModalVisible(true);
  };

  // 提交举报
  const handleSubmitReport = async () => {
    if (!post) return;
    
    if (!reportReason) {
      app.message.error('请选择举报理由');
      return;
    }

    setReportSubmitting(true);
    try {
      await reportService.createReport({
        reported_user_id: post.owner.id,
        reason: reportReason,
        description: reportDescription || undefined,
      });
      app.message.success('举报已提交，感谢您的反馈');
      setReportModalVisible(false);
      setReportReason('');
      setReportDescription('');
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '提交失败';
      app.message.error(errorMsg);
    } finally {
      setReportSubmitting(false);
    }
  };

  // 关闭举报对话框
  const handleCancelReport = () => {
    setReportModalVisible(false);
    setReportReason('');
    setReportDescription('');
  };

  // 检查是否是帖主
  const isOwner = user && post && user.id === post.owner.id;

  // 帖主操作菜单项
  const ownerMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: '编辑帖子',
    },
    ...(post?.status === 'available' && post.post_type === 'sell' ? [{
      key: 'sold',
      icon: <CheckCircleOutlined />,
      label: '标记为已售出',
    }] : []),
    {
      type: 'divider' as const,
    },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: '删除帖子',
      danger: true,
    },
  ];

  // 统一处理菜单点击事件
  const handleMenuClick: MenuProps['onClick'] = ({ key }) => {
    switch (key) {
      case 'edit':
        handleEdit();
        break;
      case 'sold':
        handleMarkAsSold();
        break;
      case 'delete':
        handleDelete();
        break;
    }
  };

  // 获取帖子类型标签
  const getPostTypeTag = () => {
    if (!post) return null;
    switch (post.post_type) {
      case 'sell':
        return <Tag color="blue" style={{ fontSize: '14px' }}>出售</Tag>;
      case 'buy':
        return <Tag color="green" style={{ fontSize: '14px' }}>求购</Tag>;
      case 'free':
        return <Tag color="red" style={{ fontSize: '14px' }}>免费</Tag>;
      default:
        return null;
    }
  };

  // 获取状态标签
  const getStatusTag = () => {
    if (!post) return null;
    if (post.status === 'sold') {
      return <Tag color="default" style={{ fontSize: '14px' }}>已售出</Tag>;
    }
    return null;
  };

  // 获取新旧程度文本
  const getConditionText = () => {
    if (!post || !post.condition) return '未说明';
    const conditionMap = {
      new: '全新',
      like_new: '几乎全新',
      good: '良好',
      fair: '一般',
    };
    return conditionMap[post.condition] || '未说明';
  };

  // 获取用户头像
  const getAvatarUrl = () => {
    if (post?.owner.avatar_url) {
      return post.owner.avatar_url.startsWith('http') ? post.owner.avatar_url : `${API_BASE_URL}${post.owner.avatar_url}`;
    }
    return undefined;
  };

  // 格式化价格显示
  const getPriceDisplay = () => {
    if (!post) return '—';
    
    if (post.post_type === 'free') {
      return '免费';
    }
    if (post.post_type === 'buy') {
      if (post.price_min !== null && post.price_min !== post.price) {
        return `¥${post.price_min} - ¥${post.price}`;
      }
      return `¥${post.price}`;
    }
    return `¥${post.price}`;
  };

  // 加载中状态（骨架屏）
  if (loading) {
    return (
      <div className="post-detail-page">
        <Skeleton.Button active style={{ marginBottom: '16px' }} />
        
        <div className="post-detail-container">
          {/* 左侧图片骨架 */}
          <div className="post-detail-left">
            <Card>
              <Skeleton.Image active style={{ width: '100%', height: '400px' }} />
            </Card>
          </div>

          {/* 右侧信息骨架 */}
          <div className="post-detail-right">
            <Card>
              <Skeleton active paragraph={{ rows: 2 }} />
              <Divider />
              <Skeleton active paragraph={{ rows: 4 }} />
              <Divider />
              <Skeleton active paragraph={{ rows: 3 }} />
              <Divider />
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Skeleton.Avatar active size={64} />
                <Skeleton active paragraph={{ rows: 2 }} />
              </div>
              <Divider />
              <Skeleton.Button active block size="large" />
              <Skeleton.Button active style={{ marginTop: '8px' }} />
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // 帖子不存在
  if (!post) {
    return (
      <div className="empty-container">
        <p>帖子不存在或已被删除</p>
        <Button onClick={handleBack}>返回首页</Button>
      </div>
    );
  }

  return (
    <div className="post-detail-page">
      {/* 返回按钮 */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      {/* 帖主操作按钮 */}
      {isOwner && (
        <div style={{ float: 'right', marginBottom: '16px' }}>
          <Dropdown menu={{ items: ownerMenuItems, onClick: handleMenuClick }} trigger={['click']}>
            <Button icon={<MoreOutlined />}>
              管理
            </Button>
          </Dropdown>
        </div>
      )}

      {/* 非帖主：举报按钮 */}
      {!isOwner && user && (
        <div style={{ float: 'right', marginBottom: '16px' }}>
          <Button 
            icon={<WarningOutlined />} 
            onClick={handleOpenReport}
          >
            举报
          </Button>
        </div>
      )}

      <div className="post-detail-container">
        {/* 左侧：图片轮播 */}
        <div className="post-detail-left">
          <Card className="image-card">
            {post.images && post.images.length > 0 ? (
              <Carousel autoplay>
                {post.images.map((image) => (
                  <div key={image.id} className="carousel-item">
                    <img
                      src={image.image_url.startsWith('http') ? image.image_url : `${API_BASE_URL}${image.image_url}`}
                      alt={post.title}
                      className="post-detail-image"
                    />
                  </div>
                ))}
              </Carousel>
            ) : (
              <div className="no-image">
                <img
                  src="https://via.placeholder.com/500x400?text=暂无图片"
                  alt="暂无图片"
                  className="post-detail-image"
                />
              </div>
            )}
          </Card>
        </div>

        {/* 右侧：详细信息 */}
        <div className="post-detail-right">
          <Card>
            {/* 标题和标签 */}
            <div className="post-title-section">
              <h1 className="post-title">{post.title}</h1>
              <Space>
                {getPostTypeTag()}
                {getStatusTag()}
              </Space>
            </div>

            {/* 价格 */}
            <div className="post-price-section">
              <span className="price-label">价格：</span>
              <span className="price-value">{getPriceDisplay()}</span>
            </div>

            <Divider />

            {/* 详细信息 */}
            <Descriptions column={1} bordered size="small">
              <Descriptions.Item label="分类">
                {post.category.name}
              </Descriptions.Item>
              <Descriptions.Item label="新旧程度">
                {getConditionText()}
              </Descriptions.Item>
              <Descriptions.Item label="发布时间">
                {new Date(post.created_at).toLocaleString('zh-CN')}
              </Descriptions.Item>
              {post.updated_at !== post.created_at && (
                <Descriptions.Item label="更新时间">
                  {new Date(post.updated_at).toLocaleString('zh-CN')}
                </Descriptions.Item>
              )}
            </Descriptions>

            <Divider />

            {/* 详细描述 */}
            <div className="post-description-section">
              <h3>详细描述</h3>
              <p className="post-description">{post.description}</p>
            </div>

            <Divider />

            {/* 卖家信息 */}
            <div className="seller-info-section">
              <h3>卖家信息</h3>
              <div className="seller-info" onClick={handleUserClick} style={{ cursor: 'pointer' }}>
                <Avatar 
                  size={64} 
                  src={getAvatarUrl()} 
                  icon={<UserOutlined />} 
                />
                <div className="seller-details">
                  <div className="seller-name">{post.owner.username}</div>
                  <div className="seller-stats">
                    成功交易 {post.owner.success_trades} 次
                  </div>
                  <div className="seller-email">{post.owner.email}</div>
                </div>
              </div>
            </div>

            <Divider />

            {/* 操作按钮 */}
            <div className="action-buttons">
              <Button
                type="primary"
                size="large"
                icon={<MessageOutlined />}
                onClick={handleContact}
                block
              >
                联系{post.post_type === 'buy' ? '买家' : '卖家'}
              </Button>
              <Button
                size="large"
                icon={isFavorited ? <HeartFilled /> : <HeartOutlined />}
                onClick={handleFavorite}
                danger={isFavorited}
              >
                {isFavorited ? '已收藏' : '收藏'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* 举报对话框 */}
      <Modal
        title="举报帖子"
        open={reportModalVisible}
        onOk={handleSubmitReport}
        onCancel={handleCancelReport}
        confirmLoading={reportSubmitting}
        okText="提交举报"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            举报理由 <span style={{ color: 'red' }}>*</span>
          </label>
          <Select
            value={reportReason || undefined}
            onChange={(value) => setReportReason(value)}
            placeholder="请选择举报理由"
            style={{ width: '100%' }}
            options={[
              { label: '垃圾信息', value: '垃圾信息' },
              { label: '虚假交易', value: '虚假交易' },
              { label: '违规内容', value: '违规内容' },
              { label: '其他', value: '其他' },
            ]}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '8px' }}>
            详细描述（可选）
          </label>
          <Input.TextArea
            value={reportDescription}
            onChange={(e) => setReportDescription(e.target.value)}
            placeholder="请详细描述举报原因..."
            rows={4}
            style={{ resize: 'vertical' }}
          />
        </div>
      </Modal>

      {/* 选择买家对话框 */}
      <Modal
        title="选择买家"
        open={selectBuyerModalVisible}
        onOk={handleConfirmBuyer}
        onCancel={handleCancelSelectBuyer}
        confirmLoading={creatingTransaction}
        okText="确认"
        cancelText="取消"
      >
        <div style={{ marginBottom: '16px' }}>
          <p style={{ marginBottom: '8px', color: '#666' }}>
            选择与您联系过的用户作为买家，创建交易记录。双方确认后，成功交易次数 +1。
          </p>
          <Select
            value={selectedBuyer || undefined}
            onChange={(value) => setSelectedBuyer(value)}
            placeholder="请选择买家"
            style={{ width: '100%' }}
            showSearch
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={contactedUsers.map(user => ({
              label: `${user.username} (${user.email})`,
              value: user.id,
            }))}
          />
        </div>
      </Modal>
    </div>
  );
};

export default PostDetailPage;
