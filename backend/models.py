import enum
from sqlalchemy import (
    Column, Integer, String, TIMESTAMP, TEXT, 
    DECIMAL, Enum, BOOLEAN, ForeignKey
)
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.sql import func

Base = declarative_base()

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=False) 
    hashed_password = Column(String(255), nullable=False)
    avatar_url = Column(String(1024), nullable=True)
    success_trades = Column(Integer, nullable=False, server_default="0")
    created_at = Column(TIMESTAMP, server_default=func.now())

    # --- 关系 (Relationships) ---
    # 一个用户可以发布多个帖子
    posts = relationship("Post", back_populates="owner", cascade="all, delete-orphan")
    
    # 一个用户可以收藏多个帖子
    favorites = relationship("Favorite", back_populates="user", cascade="all, delete-orphan")
    
    # 一个用户可以发送多条消息
    sent_messages = relationship(
        "Message", 
        back_populates="sender", 
        foreign_keys="[Message.sender_id]", 
        cascade="all, delete-orphan"
    )
    # 一个用户可以接收多条消息
    received_messages = relationship(
        "Message", 
        back_populates="receiver", 
        foreign_keys="[Message.receiver_id]", 
        cascade="all, delete-orphan"
    )
    
    # 一个用户可以发起多个举报
    reports_made = relationship(
        "Report", 
        back_populates="reporter", 
        foreign_keys="[Report.reporter_id]", 
        cascade="all, delete-orphan"
    )
    # 一个用户可以被多个举报
    reports_received = relationship(
        "Report", 
        back_populates="reported_user", 
        foreign_keys="[Report.reported_user_id]"
    )
    
    # 一个用户作为卖家的交易
    transactions_as_seller = relationship(
        "Transaction",
        back_populates="seller",
        foreign_keys="[Transaction.seller_id]",
        cascade="all, delete-orphan"
    )
    # 一个用户作为买家的交易
    transactions_as_buyer = relationship(
        "Transaction",
        back_populates="buyer",
        foreign_keys="[Transaction.buyer_id]",
        cascade="all, delete-orphan"
    )


# --- 2. Category (分类) 模型 ---
class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)

    # --- 关系 ---
    # 一个分类下有多个帖子
    posts = relationship("Post", back_populates="category")


# --- 3. Post (帖子/商品) 模型 ---
class Post(Base):
    __tablename__ = "posts"

    # 为 ENUM 类型创建 Python Enum (推荐做法)
    class PostTypeEnum(str, enum.Enum):
        sell = "sell"
        buy = "buy"
        free = "free"

    class ConditionEnum(str, enum.Enum):
        new = "new"
        like_new = "like_new"
        good = "good"
        fair = "fair"

    class StatusEnum(str, enum.Enum):
        available = "available"
        sold = "sold"
        hidden = "hidden"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(TEXT, nullable=False)
    
    post_type = Column(Enum(PostTypeEnum, name="post_type_enum"), nullable=False)
    
    price = Column(DECIMAL(10, 2), nullable=False, server_default="0.00")
    price_min = Column(DECIMAL(10, 2), nullable=True)
    
    condition = Column(Enum(ConditionEnum, name="condition_enum"), nullable=True)
    status = Column(Enum(StatusEnum, name="status_enum"), nullable=False, server_default="available")
    
    # 关系 (外键)
    owner_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=False, index=True)

    # 时间戳
    created_at = Column(TIMESTAMP, server_default=func.now())
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now())

    # --- 关系 (Relationships) ---
    # 帖子属于一个用户
    owner = relationship("User", back_populates="posts")
    # 帖子属于一个分类
    category = relationship("Category", back_populates="posts")
    
    # 帖子有多张图片
    images = relationship("PostImage", back_populates="post", cascade="all, delete-orphan")
    # 帖子被多人收藏
    favorited_by = relationship("Favorite", back_populates="post", cascade="all, delete-orphan")
    messages = relationship("Message", back_populates="post")
    # 帖子对应的交易记录（一对一）
    transaction = relationship("Transaction", back_populates="post", uselist=False, cascade="all, delete-orphan")


# --- 4. PostImage (商品图片) 模型 ---
class PostImage(Base):
    __tablename__ = "post_images"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, index=True)
    image_url = Column(String(1024), nullable=False)

    # --- 关系 ---
    post = relationship("Post", back_populates="images")


# --- 5. Favorite (收藏) 模型 ---
class Favorite(Base):
    __tablename__ = "favorites"

    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), primary_key=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # --- 关系 ---
    user = relationship("User", back_populates="favorites")
    post = relationship("Post", back_populates="favorited_by")


# --- 6. Message (私信) 模型 ---
class Message(Base):
    __tablename__ = "messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    receiver_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True, index=True)
    content = Column(TEXT, nullable=False)
    is_read = Column(BOOLEAN, nullable=False, server_default="0", index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())

    # --- 关系 ---
    sender = relationship("User", back_populates="sent_messages", foreign_keys=[sender_id])
    receiver = relationship("User", back_populates="received_messages", foreign_keys=[receiver_id])
    post = relationship("Post", back_populates="messages")

# --- 7. Report (举报) 模型 ---
class Report(Base):
    __tablename__ = "reports"

    # 为 ENUM 类型创建 Python Enum
    class ReportStatusEnum(str, enum.Enum):
        pending = "pending"
        resolved = "resolved"
        dismissed = "dismissed"

    id = Column(Integer, primary_key=True, index=True)
    reporter_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    reported_user_id = Column(Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    reported_post_id = Column(Integer, ForeignKey("posts.id", ondelete="SET NULL"), nullable=True)
    reason = Column(String(255), nullable=False)
    description = Column(TEXT, nullable=True)
    status = Column(Enum(ReportStatusEnum, name="report_status_enum"), nullable=False, server_default="pending")
    created_at = Column(TIMESTAMP, server_default=func.now())

    # --- 关系 ---
    reporter = relationship("User", back_populates="reports_made", foreign_keys=[reporter_id])
    reported_user = relationship("User", back_populates="reports_received", foreign_keys=[reported_user_id])

# --- 8. Transaction (交易确认) 模型 ---
class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    post_id = Column(Integer, ForeignKey("posts.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    seller_confirmed = Column(BOOLEAN, nullable=False, server_default="0")
    buyer_confirmed = Column(BOOLEAN, nullable=False, server_default="0")
    completed = Column(BOOLEAN, nullable=False, server_default="0", index=True)
    created_at = Column(TIMESTAMP, server_default=func.now())
    completed_at = Column(TIMESTAMP, nullable=True)

    # --- 关系 ---
    post = relationship("Post", back_populates="transaction")
    seller = relationship("User", back_populates="transactions_as_seller", foreign_keys=[seller_id])
    buyer = relationship("User", back_populates="transactions_as_buyer", foreign_keys=[buyer_id])