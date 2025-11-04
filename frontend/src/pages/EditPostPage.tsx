import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Card,
  App,
  Spin,
  Space,
} from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import postService from '../api/postService';
import type { Post } from '../types/post.types';
import './CreatePostPage.css';

const { TextArea } = Input;
const { Option } = Select;

const EditPostPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, isLoading } = useAuth();  // 添加 isLoading
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);
  const [fetchLoading, setFetchLoading] = useState<boolean>(true);
  const [post, setPost] = useState<Post | null>(null);

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!isLoading && !user) {  // 等待加载完成后再检查
      app.message.warning('请先登录');
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // 获取帖子详情
  useEffect(() => {
    const fetchPost = async () => {
      if (!id) return;

      setFetchLoading(true);
      try {
        const data = await postService.getPostById(Number(id));
        
        // 检查是否是帖主
        if (data.owner.id !== user?.id) {
          app.message.error('您没有权限编辑此帖子');
          navigate(`/posts/${id}`);
          return;
        }

        setPost(data);
        
        // 填充表单
        form.setFieldsValue({
          title: data.title,
          description: data.description,
          price: data.price,
          price_min: data.price_min,
          category_id: data.category_id,
          condition: data.condition,
          status: data.status,
        });
      } catch (error: any) {
        console.error('获取帖子失败:', error);
        app.message.error('获取帖子信息失败');
        navigate('/');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchPost();
  }, [id, user]);

  // 返回详情页
  const handleBack = () => {
    navigate(`/posts/${id}`);
  };

  // 提交表单
  const onFinish = async (values: any) => {
    if (!id) return;

    setLoading(true);
    try {
      const updateData = {
        title: values.title,
        description: values.description,
        price: values.price,
        price_min: post?.post_type === 'buy' ? values.price_min : undefined,
        condition: values.condition,
        status: values.status,
      };

      await postService.updatePost(Number(id), updateData);
      
      app.message.success('更新成功！');
      navigate(`/posts/${id}`);
      
    } catch (error: any) {
      console.error('更新失败:', error);
      const errorMsg = error.response?.data?.detail || '更新失败，请稍后再试';
      app.message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // 加载中
  if (fetchLoading) {
    return (
      <div className="create-post-page">
        <div style={{ textAlign: 'center', padding: '100px 0' }}>
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  if (!post) {
    return null;
  }

  return (
    <div className="create-post-page">
      {/* 返回按钮 */}
      <Button 
        icon={<ArrowLeftOutlined />} 
        onClick={handleBack}
        style={{ marginBottom: '16px' }}
      >
        返回
      </Button>

      <Card title="编辑帖子" className="create-post-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
        >
          {/* 标题 */}
          <Form.Item
            label="标题"
            name="title"
            rules={[
              { required: true, message: '请输入标题' },
              { max: 100, message: '标题不能超过100个字符' },
            ]}
          >
            <Input placeholder="请输入帖子标题" maxLength={100} showCount />
          </Form.Item>

          {/* 分类（不可编辑，仅显示） */}
          <Form.Item label="分类">
            <Input value={post.category.name} disabled />
          </Form.Item>

          {/* 价格（出售类型） */}
          {post.post_type === 'sell' && (
            <Form.Item
              label="价格（元）"
              name="price"
              rules={[
                { required: true, message: '请输入价格' },
                { type: 'number', min: 0, message: '价格不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入价格"
                min={0}
                precision={2}
              />
            </Form.Item>
          )}

          {/* 价格范围（求购类型） */}
          {post.post_type === 'buy' && (
            <Space.Compact style={{ width: '100%' }}>
              <Form.Item
                label="最低价格（元）"
                name="price_min"
                style={{ width: '50%', marginBottom: 0 }}
                rules={[
                  { required: true, message: '请输入最低价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' },
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="最低价"
                  min={0}
                  precision={2}
                />
              </Form.Item>
              <Form.Item
                label="最高价格（元）"
                name="price"
                style={{ width: '50%', marginBottom: 0 }}
                rules={[
                  { required: true, message: '请输入最高价格' },
                  { type: 'number', min: 0, message: '价格不能为负数' },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const minPrice = getFieldValue('price_min');
                      if (!value || !minPrice || value >= minPrice) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error('最高价格不能低于最低价格'));
                    },
                  }),
                ]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="最高价"
                  min={0}
                  precision={2}
                />
              </Form.Item>
            </Space.Compact>
          )}

          {/* 新旧程度 */}
          {post.post_type !== 'buy' && (
            <Form.Item
              label="新旧程度"
              name="condition"
              rules={[{ required: true, message: '请选择新旧程度' }]}
            >
              <Select placeholder="请选择新旧程度">
                <Option value="new">全新</Option>
                <Option value="like_new">几乎全新</Option>
                <Option value="good">良好</Option>
                <Option value="fair">一般</Option>
              </Select>
            </Form.Item>
          )}

          {/* 状态 */}
          <Form.Item
            label="状态"
            name="status"
            rules={[{ required: true, message: '请选择状态' }]}
          >
            <Select placeholder="请选择状态">
              <Option value="available">可用</Option>
              <Option value="sold">已售出</Option>
              <Option value="hidden">已隐藏</Option>
            </Select>
          </Form.Item>

          {/* 详细描述 */}
          <Form.Item
            label="详细描述"
            name="description"
            rules={[
              { required: true, message: '请输入详细描述' },
              { min: 10, message: '描述至少10个字符' },
              { max: 1000, message: '描述不能超过1000个字符' },
            ]}
          >
            <TextArea
              rows={6}
              placeholder="请详细描述商品信息"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} size="large">
              保存修改
            </Button>
            <Button onClick={handleBack} size="large" style={{ marginLeft: '12px' }}>
              取消
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default EditPostPage;
