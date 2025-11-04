import apiService from './apiService';
import type { 
  Post, 
  Category, 
  CreatePostData, 
  UpdatePostData, 
  GetPostsParams,
  PostsResponse 
} from '../types/post.types';
import { cache, CacheKeys } from '../utils/cache';

/**
 * 帖子相关的 API 服务
 */
const postService = {
  /**
   * 获取帖子列表（带缓存）
   * @param params - 查询参数（post_type, skip, limit）
   * @returns Promise<PostsResponse> - 返回帖子列表和总数
   */
  getPosts: async (params?: GetPostsParams): Promise<PostsResponse> => {
    // 生成缓存键
    const cacheKey = CacheKeys.posts(params || {});
    
    // 尝试从缓存获取
    const cachedData = cache.get<PostsResponse>(cacheKey);
    if (cachedData) {
      console.log('📦 从缓存加载帖子列表:', cacheKey);
      return cachedData;
    }

    // 缓存未命中，从服务器获取
    console.log('🌐 从服务器加载帖子列表:', cacheKey);
    const response = await apiService.get<PostsResponse>('/api/posts', { params });
    
    // 存入缓存（3 分钟过期）
    cache.set(cacheKey, response.data, 3 * 60 * 1000);
    
    return response.data;
  },

  /**
   * 获取单个帖子详情（带缓存）
   * @param postId - 帖子 ID
   * @returns Promise<Post>
   */
  getPostById: async (postId: number): Promise<Post> => {
    const cacheKey = CacheKeys.postDetail(postId);
    
    // 尝试从缓存获取
    const cachedData = cache.get<Post>(cacheKey);
    if (cachedData) {
      console.log('📦 从缓存加载帖子详情:', postId);
      return cachedData;
    }

    // 从服务器获取
    console.log('🌐 从服务器加载帖子详情:', postId);
    const response = await apiService.get<Post>(`/api/posts/${postId}`);
    
    // 存入缓存（5 分钟过期）
    cache.set(cacheKey, response.data, 5 * 60 * 1000);
    
    return response.data;
  },

  /**
   * 创建新帖子（清除相关缓存）
   * @param data - 帖子数据
   * @returns Promise<Post>
   */
  createPost: async (data: CreatePostData): Promise<Post> => {
    const response = await apiService.post<Post>('/api/posts', data);
    
    // 清除帖子列表缓存
    cache.deleteByPrefix('posts');
    
    return response.data;
  },

  /**
   * 更新帖子（清除相关缓存）
   * @param postId - 帖子 ID
   * @param data - 要更新的数据
   * @returns Promise<Post>
   */
  updatePost: async (postId: number, data: UpdatePostData): Promise<Post> => {
    const response = await apiService.patch<Post>(`/api/posts/${postId}`, data);
    
    // 清除该帖子的详情缓存和列表缓存
    cache.delete(CacheKeys.postDetail(postId));
    cache.deleteByPrefix('posts');
    
    return response.data;
  },

  /**
   * 删除帖子（清除相关缓存）
   * @param postId - 帖子 ID
   * @returns Promise<void>
   */
  deletePost: async (postId: number): Promise<void> => {
    await apiService.delete(`/api/posts/${postId}`);
    
    // 清除该帖子的详情缓存和列表缓存
    cache.delete(CacheKeys.postDetail(postId));
    cache.deleteByPrefix('posts');
  },

  /**
   * 上传帖子图片
   * @param postId - 帖子 ID
   * @param file - 图片文件
   * @returns Promise<{ id: number; image_url: string }>
   */
  uploadPostImage: async (
    postId: number, 
    file: File
  ): Promise<{ id: number; image_url: string }> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await apiService.post(
      `/api/posts/${postId}/images`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  /**
   * 获取所有分类（带缓存）
   * @returns Promise<Category[]>
   */
  getCategories: async (): Promise<Category[]> => {
    const cacheKey = CacheKeys.categories();
    
    // 尝试从缓存获取（分类很少变化，缓存 30 分钟）
    const cachedData = cache.get<Category[]>(cacheKey);
    if (cachedData) {
      console.log('📦 从缓存加载分类列表');
      return cachedData;
    }

    console.log('🌐 从服务器加载分类列表');
    const response = await apiService.get<Category[]>('/api/categories');
    
    // 存入缓存（30 分钟过期）
    cache.set(cacheKey, response.data, 30 * 60 * 1000);
    
    return response.data;
  },

  /**
   * 收藏帖子（清除收藏缓存）
   * @param postId - 帖子 ID
   * @returns Promise<void>
   */
  favoritePost: async (postId: number): Promise<void> => {
    await apiService.post(`/api/posts/${postId}/favorite`);
    
    // 清除收藏列表缓存
    cache.delete(CacheKeys.favorites());
  },

  /**
   * 检查是否已收藏某个帖子
   * @param postId - 帖子 ID
   * @returns Promise<boolean> - 返回是否已收藏
   */
  checkIfFavorited: async (postId: number): Promise<boolean> => {
    const response = await apiService.get<{ is_favorited: boolean }>(
      `/api/posts/${postId}/favorite`
    );
    return response.data.is_favorited;
  },

  /**
   * 取消收藏帖子（清除收藏缓存）
   * @param postId - 帖子 ID
   * @returns Promise<void>
   */
  unfavoritePost: async (postId: number): Promise<void> => {
    await apiService.delete(`/api/posts/${postId}/favorite`);
    
    // 清除收藏列表缓存
    cache.delete(CacheKeys.favorites());
  },

  /**
   * 获取我的收藏列表（带缓存）
   * @returns Promise<Post[]>
   */
  getMyFavorites: async (): Promise<Post[]> => {
    const cacheKey = CacheKeys.favorites();
    
    // 尝试从缓存获取
    const cachedData = cache.get<Post[]>(cacheKey);
    if (cachedData) {
      console.log('📦 从缓存加载收藏列表');
      return cachedData;
    }

    console.log('🌐 从服务器加载收藏列表');
    const response = await apiService.get<Post[]>('/api/users/me/favorites');
    
    // 存入缓存（2 分钟过期）
    cache.set(cacheKey, response.data, 2 * 60 * 1000);
    
    return response.data;
  },
};

export default postService;
