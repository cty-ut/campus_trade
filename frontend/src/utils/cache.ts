/**
 * 简单的内存缓存工具
 * 支持设置过期时间，避免数据过期
 */

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expireTime: number; // 过期时间（毫秒）
}

class SimpleCache {
  private cache: Map<string, CacheItem<any>> = new Map();

  /**
   * 设置缓存
   * @param key - 缓存键
   * @param data - 缓存数据
   * @param expireTime - 过期时间（毫秒），默认 5 分钟
   */
  set<T>(key: string, data: T, expireTime: number = 5 * 60 * 1000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expireTime,
    });
  }

  /**
   * 获取缓存
   * @param key - 缓存键
   * @returns 缓存数据，如果不存在或已过期返回 null
   */
  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    const now = Date.now();
    if (now - item.timestamp > item.expireTime) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  /**
   * 删除缓存
   * @param key - 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 删除匹配前缀的所有缓存
   * @param prefix - 键前缀
   */
  deleteByPrefix(prefix: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// 导出单例
export const cache = new SimpleCache();

// 缓存键生成器
export const CacheKeys = {
  // 帖子列表缓存键
  posts: (params: {
    post_type?: string;
    skip?: number;
    limit?: number;
    keyword?: string;
    category_id?: number;
    sort_by?: string;
  }) => {
    const parts = ['posts'];
    if (params.post_type) parts.push(`type:${params.post_type}`);
    if (params.skip !== undefined) parts.push(`skip:${params.skip}`);
    if (params.limit !== undefined) parts.push(`limit:${params.limit}`);
    if (params.keyword) parts.push(`keyword:${params.keyword}`);
    if (params.category_id) parts.push(`cat:${params.category_id}`);
    if (params.sort_by) parts.push(`sort:${params.sort_by}`);
    return parts.join('_');
  },

  // 帖子详情缓存键
  postDetail: (postId: number) => `post_detail_${postId}`,

  // 分类列表缓存键
  categories: () => 'categories',

  // 用户信息缓存键
  user: (userId: number) => `user_${userId}`,

  // 我的收藏缓存键
  favorites: () => 'my_favorites',

  // 收件箱缓存键
  inbox: () => 'inbox',

  // 对话缓存键
  conversation: (postId: number, userId: number) => `conversation_${postId}_${userId}`,
};

export default cache;
