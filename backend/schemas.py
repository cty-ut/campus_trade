import enum
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
from . import models 



class User(BaseModel):
    """用于“读取”或“显示”的用户模型，不含密码"""
    id: int
    email: EmailStr
    username: str
    avatar_url: Optional[str] = None
    success_trades: int
    created_at: datetime

    class Config:
        from_attributes = True 

class Category(BaseModel):
    """用于读取的分类模型"""
    id: int
    name: str

    class Config:
        from_attributes = True

class PostImage(BaseModel):
    """用于读取的商品图片模型"""
    id: int
    image_url: str

    class Config:
        from_attributes = True

# =======================================================================
# 1. 用户 (User) Schemas
# =======================================================================

class UserCreate(BaseModel):
    """用于“创建”用户的模型 (注册时)"""
    email: EmailStr  # 使用 EmailStr 进行自动邮箱格式验证
    username: str
    password: str    # 注册时接收明文密码

class UserUpdate(BaseModel):
    """用于"更新"用户信息的模型"""
    username: Optional[str] = None

# =======================================================================
# 2. 帖子 (Post) Schemas
# =======================================================================

class PostBase(BaseModel):
    """帖子的“基础”字段，用于创建和更新"""
    title: str
    description: str
    price: float  # 在 Python 中使用 float，对应 DECIMAL
    category_id: int
    
    # 使用从 models.py 导入的 Enum
    post_type: models.Post.PostTypeEnum
    
    # 可选字段
    price_min: Optional[float] = None
    condition: Optional[models.Post.ConditionEnum] = None

class PostCreate(PostBase):
    """用于“创建”帖子"""
    pass  # 继承 PostBase 的所有字段

class PostUpdate(BaseModel):
    """用于“更新”帖子 (所有字段都是可选的)"""
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    category_id: Optional[int] = None
    post_type: Optional[models.Post.PostTypeEnum] = None
    price_min: Optional[float] = None
    condition: Optional[models.Post.ConditionEnum] = None
    status: Optional[models.Post.StatusEnum] = None # 允许更新状态

class Post(PostBase):
    """用于“读取”的完整帖子模型 (包含关系)"""
    id: int
    status: models.Post.StatusEnum
    created_at: datetime
    updated_at: datetime
    
    # --- 嵌套的关系 ---
    owner: User        # 嵌套一个 User 对象 (不只是 owner_id)
    category: Category   # 嵌套一个 Category 对象
    images: List[PostImage] = [] # 嵌套一个图片列表

    class Config:
        from_attributes = True

class PostsResponse(BaseModel):
    """用于返回帖子列表和总数的响应模型"""
    posts: List[Post]
    total: int

# =======================================================================
# 3. 收藏 (Favorite) Schemas
# =======================================================================

class FavoriteCreate(BaseModel):
    """用于“创建”收藏 (用户ID将从Token获取)"""
    post_id: int

class Favorite(BaseModel):
    """用于“读取”收藏记录"""
    user_id: int
    post_id: int
    created_at: datetime
    
    # (可选) 嵌套 post 对象，使响应更丰富
    post: Post 

    class Config:
        from_attributes = True

# =======================================================================
# 4. 私信 (Message) Schemas (已简化)
# =======================================================================

class MessageCreate(BaseModel):

    content: str  # 消息内容
    post_id: int  # 关于哪个帖子
    receiver_id: int # 发给谁 (收信人ID)


class Message(BaseModel):

    id: int
    content: str
    post_id: int
    sender_id: int
    receiver_id: int
    is_read: bool
    created_at: datetime
    
    # 关键：自动关联发送者和接收者的“用户信息”
    # (我们已有的 User schema 会自动过滤掉密码)
    sender: User
    receiver: User

    class Config:
        from_attributes = True # 允许从数据库模型自动转换


class InboxConversation(BaseModel):

    post: Post          # 1. 这是关于哪个帖子的会话 (帖子详情)
    other_user: User    # 2. 这是和谁的会话 (对方的用户信息)
    last_message: Message # 3. 这条会话的“最后一条消息” (用于预览)

    class Config:
        from_attributes = True

# =======================================================================
# 5. 举报 (Report) Schemas 
# =======================================================================

class ReportCreate(BaseModel):
    """用于“创建”举报"""
    reported_user_id: int
    reason: str
    description: Optional[str] = None

class Report(BaseModel):
    """用于“读取”举报"""
    id: int
    reporter_id: int
    reported_user_id: Optional[int]
    reason: str
    description: Optional[str]
    status: models.Report.ReportStatusEnum
    created_at: datetime

    # 嵌套举报者和被举报者的信息
    reporter: User
    reported_user: Optional[User]

    class Config:
        from_attributes = True

# =======================================================================
# ⬇️ 新增：Transaction (交易确认) Schemas ⬇️
# =======================================================================

class TransactionCreate(BaseModel):
    """用于"创建"交易（卖家标记已售出时选择买家）"""
    post_id: int
    buyer_id: int

class Transaction(BaseModel):
    """用于"读取"交易信息"""
    id: int
    post_id: int
    seller_id: int
    buyer_id: int
    seller_confirmed: bool
    buyer_confirmed: bool
    completed: bool
    created_at: datetime
    completed_at: Optional[datetime]
    
    # 嵌套关联信息
    seller: User
    buyer: User
    post: Post

    class Config:
        from_attributes = True

# =======================================================================
# 6. 用于解决循环嵌套的更新 (Advanced)
# =======================================================================
# 比如：User 读取时想包含 Post, Post 读取时想包含 User
# 我们需要一个更“完整”的 User schema

class UserWithPosts(User):
    """一个“完整”的 User 视图，包含他发布的所有帖子"""
    posts: List[Post] = []



class Token(BaseModel):
    """
    “响应”模型：定义登录成功后，服务器返回的 JSON 格式
    """
    access_token: str  # 这就是那张“数字身份证” (JWT Token 字符串)
    token_type: str    # 这是一个固定的字符串，内容通常是 "bearer"

class TokenData(BaseModel):
    """
    “数据”模型：定义了 Token 内部存储的数据格式 (我们任务B会用到)
    """
    username: str | None = None



# --- 解决循环引用 ---
# 因为 UserWithPosts 引用了 Post, 而 Post 引用了 User
# 我们需要在 Pydantic 加载完所有模型后，
# 手动告诉它们去“更新”这些循环的引用
UserWithPosts.update_forward_refs()
Favorite.update_forward_refs()
Message.update_forward_refs()
Report.update_forward_refs()