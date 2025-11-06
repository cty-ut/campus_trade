import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Avatar,
  Descriptions,
  Tabs,
  Button,
  Upload,
  Modal,
  Input,
  Form,
  App,
  Row,
  Col,
  Empty,
} from 'antd';
import {
  UserOutlined,
  EditOutlined,
  CameraOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import type { UploadFile } from 'antd';
import { useAuth } from '../hooks/useAuth';
import postService from '../api/postService';
import apiService, { API_BASE_URL } from '../api/apiService';
import userService from '../api/userService';
import PostCard, { PostCardSkeleton } from '../components/PostCard';
import type { Post, PostType } from '../types/post.types';
import './ProfilePage.css';

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, saveAuth, isLoading } = useAuth();  // 添加 isLoading
  const [form] = Form.useForm();

  const [myPosts, setMyPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>('sell');
  const [editModalVisible, setEditModalVisible] = useState<boolean>(false);
  const [avatarModalVisible, setAvatarModalVisible] = useState<boolean>(false);
  const [avatarFile, setAvatarFile] = useState<UploadFile | null>(null);

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!isLoading && !user) {  // 等待加载完成后再检查
      app.message.warning('请先登录');
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // 获取我的帖子列表
  useEffect(() => {
    if (user) {
      fetchMyPosts(activeTab as PostType);
    }
  }, [user, activeTab]);

  // 获取我的帖子
  const fetchMyPosts = async (postType: PostType) => {
    setLoading(true);
    try {
      const response = await postService.getPosts({
        post_type: postType,
        skip: 0,
        limit: 100,
      });
      
      // 筛选出当前用户的帖子
      const userPosts = response.posts.filter(post => post.owner.id === user?.id);
      setMyPosts(userPosts);
    } catch (error) {
      console.error('获取帖子列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  // 打开编辑资料对话框
  const handleEditProfile = () => {
    form.setFieldsValue({
      username: user?.username,
    });
    setEditModalVisible(true);
  };

  // 提交编辑资料
  const handleEditSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      // 调用 API 更新用户信息
      const updatedUser = await userService.updateUserProfile({
        username: values.username,
      });
      
      // 更新 AuthContext 中的用户信息（保持 token 不变）
      const token = localStorage.getItem('authToken');
      if (token) {
        saveAuth(updatedUser, token);
      }
      
      app.message.success('资料更新成功');
      setEditModalVisible(false);
    } catch (error: any) {
      console.error('更新失败:', error);
      const errorMsg = error.response?.data?.detail || '更新失败，请稍后再试';
      app.message.error(errorMsg);
    }
  };

  // 打开上传头像对话框
  const handleUploadAvatar = () => {
    setAvatarModalVisible(true);
  };

  // 头像文件选择
  const beforeAvatarUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      app.message.error('只能上传图片文件！');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      app.message.error('图片大小不能超过 2MB！');
      return false;
    }
    
    setAvatarFile({
      uid: '-1',
      name: file.name,
      status: 'done',
      url: URL.createObjectURL(file),
      originFileObj: file as any,
    });
    
    return false;
  };

  // 提交头像
  const handleAvatarSubmit = async () => {
    if (!avatarFile || !avatarFile.originFileObj) {
      app.message.warning('请先选择图片');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', avatarFile.originFileObj);

      await apiService.post('/api/users/me/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      app.message.success('头像上传成功，请刷新页面查看');
      setAvatarModalVisible(false);
      setAvatarFile(null);
      
      // 刷新页面以获取最新头像
      window.location.reload();
    } catch (error: any) {
      console.error('上传头像失败:', error);
      const errorMsg = error.response?.data?.detail || '上传失败';
      app.message.error(errorMsg);
    }
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

  if (!user) {
    return null;
  }

  return (
    <div className="profile-page">
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
          <div className="avatar-section">
            <Avatar
              size={100}
              src={getAvatarUrl()}
              icon={<UserOutlined />}
            />
            <Button
              type="link"
              icon={<CameraOutlined />}
              onClick={handleUploadAvatar}
            >
              更换头像
            </Button>
          </div>

          <div className="user-details">
            <div className="user-name-section">
              <h2>{user.username}</h2>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={handleEditProfile}
              >
                编辑资料
              </Button>
            </div>

            <Descriptions column={2} size="small">
              <Descriptions.Item label="邮箱">
                {user.email}
              </Descriptions.Item>
              <Descriptions.Item label="成功交易">
                {user.success_trades} 次
              </Descriptions.Item>
                            <Descriptions.Item label="注册时间">
                {(() => {
                  const date = new Date(user.created_at);
                  const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
                  return `${jstDate.getFullYear()}/${jstDate.getMonth() + 1}/${jstDate.getDate()}`;
                })()}
              </Descriptions.Item>
            </Descriptions>
          </div>
        </div>
      </Card>

      {/* 我的帖子 */}
      <Card title="我的帖子" style={{ marginTop: '24px' }}>
        <Tabs
          activeKey={activeTab}
          items={tabItems}
          onChange={handleTabChange}
        />

        {loading ? (
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            {Array.from({ length: 8 }).map((_, index) => (
              <Col key={`skeleton-${index}`} xs={24} sm={12} md={8} lg={6}>
                <PostCardSkeleton />
              </Col>
            ))}
          </Row>
        ) : myPosts.length === 0 ? (
          <Empty description="暂无帖子" />
        ) : (
          <Row gutter={[16, 16]}>
            {myPosts.map((post) => (
              <Col key={post.id} xs={24} sm={12} md={8} lg={6}>
                <PostCard post={post} />
              </Col>
            ))}
          </Row>
        )}
      </Card>

      {/* 编辑资料对话框 */}
      <Modal
        title="编辑资料"
        open={editModalVisible}
        onOk={handleEditSubmit}
        onCancel={() => setEditModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="昵称"
            name="username"
            rules={[
              { required: true, message: '请输入昵称' },
              { max: 50, message: '昵称不能超过50个字符' },
            ]}
          >
            <Input placeholder="请输入昵称" />
          </Form.Item>
        </Form>
      </Modal>

      {/* 上传头像对话框 */}
      <Modal
        title="更换头像"
        open={avatarModalVisible}
        onOk={handleAvatarSubmit}
        onCancel={() => {
          setAvatarModalVisible(false);
          setAvatarFile(null);
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Upload
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeAvatarUpload}
          >
            {avatarFile ? (
              <img src={avatarFile.url} alt="avatar" style={{ width: '100%' }} />
            ) : (
              <div>
                <CameraOutlined style={{ fontSize: '32px' }} />
                <div style={{ marginTop: 8 }}>选择图片</div>
              </div>
            )}
          </Upload>
          <p style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '8px' }}>
            支持 JPG、PNG 格式，不超过 2MB
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default ProfilePage;
