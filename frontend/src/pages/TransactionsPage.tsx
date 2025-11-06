import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, List, Avatar, Button, Tag, Empty, Spin, App } from 'antd';
import { UserOutlined, CheckCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import { useAuth } from '../hooks/useAuth';
import transactionService from '../api/transactionService';
import type { Transaction } from '../types/transaction.types';
import { API_BASE_URL } from '../api/apiService';
import './TransactionsPage.css';

const TransactionsPage: React.FC = () => {
  const navigate = useNavigate();
  const app = App.useApp();
  const { user, isLoading } = useAuth();  // 添加 isLoading

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [confirming, setConfirming] = useState<number | null>(null);

  // 获取待确认交易列表
  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const data = await transactionService.getMyPendingTransactions();
      setTransactions(data);
    } catch (error: any) {
      console.error('获取交易列表失败:', error);
      app.message.error('获取交易列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading) return;  // 等待加载完成
    
    if (!user) {
      app.message.warning('请先登录');
      navigate('/login');
      return;
    }

    fetchTransactions();
  }, [user, isLoading]);

  // 确认交易
  const handleConfirm = async (transactionId: number) => {
    setConfirming(transactionId);
    try {
      await transactionService.confirmTransaction(transactionId);
      app.message.success('确认成功！');
      // 刷新列表
      await fetchTransactions();
    } catch (error: any) {
      const errorMsg = error.response?.data?.detail || '确认失败';
      app.message.error(errorMsg);
    } finally {
      setConfirming(null);
    }
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
    const jstDate = new Date(date.getTime() + 9 * 60 * 60 * 1000);
    const year = jstDate.getFullYear();
    const month = jstDate.getMonth() + 1;
    const day = jstDate.getDate();
    return `${year}年${month}月${day}日`;
  };  // 判断当前用户的角色和确认状态
  const getUserStatus = (transaction: Transaction) => {
    if (!user) return { role: '', confirmed: false, otherConfirmed: false, otherUser: null };

    const isSeller = transaction.seller_id === user.id;
    const role = isSeller ? '卖家' : '买家';
    const confirmed = isSeller ? transaction.seller_confirmed : transaction.buyer_confirmed;
    const otherConfirmed = isSeller ? transaction.buyer_confirmed : transaction.seller_confirmed;
    const otherUser = isSeller ? transaction.buyer : transaction.seller;

    return { role, confirmed, otherConfirmed, otherUser };
  };

  if (loading) {
    return (
      <div className="transactions-page">
        <div className="transactions-loading">
          <Spin size="large" tip="加载中..." />
        </div>
      </div>
    );
  }

  return (
    <div className="transactions-page">
      <Card title="待确认交易" className="transactions-card">
        {transactions.length === 0 ? (
          <Empty
            description="暂无待确认的交易"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            <Button type="primary" onClick={() => navigate('/')}>
              去逛逛
            </Button>
          </Empty>
        ) : (
          <List
            itemLayout="vertical"
            dataSource={transactions}
            renderItem={(transaction) => {
              const { role, confirmed, otherConfirmed, otherUser } = getUserStatus(transaction);
              
              return (
                <List.Item
                  key={transaction.id}
                  className="transaction-item"
                  actions={[
                    confirmed ? (
                      <Tag icon={<CheckCircleOutlined />} color="success">
                        您已确认
                      </Tag>
                    ) : (
                      <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => handleConfirm(transaction.id)}
                        loading={confirming === transaction.id}
                      >
                        确认交易成功
                      </Button>
                    ),
                  ]}
                >
                  <List.Item.Meta
                    avatar={
                      <Avatar
                        size={64}
                        src={getAvatarUrl(otherUser?.avatar_url || null)}
                        icon={<UserOutlined />}
                      />
                    }
                    title={
                      <div className="transaction-title">
                        <span>
                          与 <strong>{otherUser?.username}</strong> 的交易
                        </span>
                        <Tag color="blue">{role}</Tag>
                      </div>
                    }
                    description={
                      <div className="transaction-description">
                        <div className="post-info">
                          <span className="label">商品：</span>
                          <a onClick={() => navigate(`/posts/${transaction.post.id}`)}>
                            {transaction.post.title}
                          </a>
                        </div>
                        <div className="post-info">
                          <span className="label">创建时间：</span>
                          {formatTime(transaction.created_at)}
                        </div>
                        <div className="status-info">
                          <span className="label">状态：</span>
                          {confirmed && (
                            <Tag icon={<CheckCircleOutlined />} color="success">
                              您已确认
                            </Tag>
                          )}
                          {!confirmed && (
                            <Tag icon={<ClockCircleOutlined />} color="warning">
                              待您确认
                            </Tag>
                          )}
                          {otherConfirmed && (
                            <Tag icon={<CheckCircleOutlined />} color="success">
                              对方已确认
                            </Tag>
                          )}
                          {!otherConfirmed && (
                            <Tag icon={<ClockCircleOutlined />} color="default">
                              对方未确认
                            </Tag>
                          )}
                        </div>
                        {confirmed && otherConfirmed && (
                          <div className="complete-tip">
                            <Tag icon={<CheckCircleOutlined />} color="green">
                              🎉 交易已完成！双方成功交易次数已 +1
                            </Tag>
                          </div>
                        )}
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        )}
      </Card>
    </div>
  );
};

export default TransactionsPage;
