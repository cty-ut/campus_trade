import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Form,
  Input,
  InputNumber,
  Select,
  Radio,
  Button,
  Card,
  App,
  Upload,
  Space,
} from 'antd';
import { PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import { useAuth } from '../hooks/useAuth';
import postService from '../api/postService';
import type { Category, PostType, Condition } from '../types/post.types';
import './CreatePostPage.css';

const { TextArea } = Input;
const { Option } = Select;

const CreatePostPage: React.FC = () => {
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, isLoading } = useAuth();  // 添加 isLoading
  const [form] = Form.useForm();

  const [loading, setLoading] = useState<boolean>(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [postType, setPostType] = useState<PostType>('sell');
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // 获取分类列表
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await postService.getCategories();
        setCategories(data);
      } catch (error) {
        console.error('获取分类失败:', error);
      }
    };
    fetchCategories();
  }, []);

  // 如果未登录，跳转到登录页
  useEffect(() => {
    if (!isLoading && !user) {  // 等待加载完成后再检查
      app.message.warning('请先登录');
      navigate('/login');
    }
  }, [user, isLoading, navigate]);

  // 返回首页
  const handleBack = () => {
    navigate('/');
  };

  // 处理帖子类型切换
  const handlePostTypeChange = (value: PostType) => {
    setPostType(value);
    // 如果是免费，自动设置价格为0
    if (value === 'free') {
      form.setFieldsValue({ price: 0 });
    }
  };

  // 图片上传前的检查
  const beforeUpload = (file: File) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      app.message.error('只能上传图片文件！');
      return false;
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      app.message.error('图片大小不能超过 5MB！');
      return false;
    }
    return false; // 返回 false 阻止自动上传，我们手动控制
  };

  // 处理图片变化
  const handleImageChange: UploadProps['onChange'] = ({ fileList: newFileList }) => {
    setFileList(newFileList);
  };

  // 提交表单
  const onFinish = async (values: any) => {
    setLoading(true);
    try {
      // 1. 创建帖子
      const postData = {
        title: values.title,
        description: values.description,
        price: postType === 'free' ? 0 : values.price,
        price_min: postType === 'buy' ? values.price_min : undefined,
        category_id: values.category_id,
        post_type: postType,
        condition: values.condition,
      };

      const newPost = await postService.createPost(postData);
      
      // 2. 上传图片
      if (fileList.length > 0) {
        const uploadPromises = fileList.map((file) => {
          if (file.originFileObj) {
            return postService.uploadPostImage(newPost.id, file.originFileObj);
          }
          return Promise.resolve();
        });
        
        await Promise.all(uploadPromises);
      }

      app.message.success('发布成功！');
      
      // 跳转到帖子详情页
      navigate(`/posts/${newPost.id}`);
      
    } catch (error: any) {
      console.error('发布失败:', error);
      const errorMsg = error.response?.data?.detail || '发布失败，请稍后再试';
      app.message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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

      <Card title="发布帖子" className="create-post-card">
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          initialValues={{
            post_type: 'sell',
            condition: 'good',
          }}
        >
          {/* 帖子类型 */}
          <Form.Item
            label="帖子类型"
            name="post_type"
            rules={[{ required: true, message: '请选择帖子类型' }]}
          >
            <Radio.Group onChange={(e) => handlePostTypeChange(e.target.value)}>
              <Radio.Button value="sell">出售</Radio.Button>
              <Radio.Button value="buy">求购</Radio.Button>
              <Radio.Button value="free">免费赠送</Radio.Button>
            </Radio.Group>
          </Form.Item>

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

          {/* 分类 */}
          <Form.Item
            label="分类"
            name="category_id"
            rules={[{ required: true, message: '请选择分类' }]}
          >
            <Select placeholder="请选择分类">
              {categories.map((category) => (
                <Option key={category.id} value={category.id}>
                  {category.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* 价格（出售类型） */}
          {postType === 'sell' && (
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
          {postType === 'buy' && (
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
          {postType !== 'buy' && (
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
              placeholder="请详细描述商品信息，如购买时间、使用情况、交易方式等"
              maxLength={1000}
              showCount
            />
          </Form.Item>

          {/* 图片上传 */}
          <Form.Item label="商品图片（最多9张）">
            <Upload
              listType="picture-card"
              fileList={fileList}
              onChange={handleImageChange}
              beforeUpload={beforeUpload}
              maxCount={9}
            >
              {fileList.length >= 9 ? null : (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>上传图片</div>
                </div>
              )}
            </Upload>
            <div style={{ color: '#8c8c8c', fontSize: '12px', marginTop: '8px' }}>
              支持 JPG、PNG 格式，单张图片不超过 5MB
            </div>
          </Form.Item>

          {/* 提交按钮 */}
          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading} size="large">
                发布
              </Button>
              <Button onClick={handleBack} size="large">
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default CreatePostPage;
