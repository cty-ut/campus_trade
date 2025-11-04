from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, func
from . import models, schemas, security
from typing import Optional, List
import os
from pathlib import Path

YOUR_SCHOOL_EMAIL_SUFFIX = "@edu.k.u-tokyo.ac.jp"



def get_user_by_email(db: Session, email: str):
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate):
    
    # 使用我们在这里定义的后缀
    if not user.email.endswith(YOUR_SCHOOL_EMAIL_SUFFIX):
        raise ValueError("必须使用学校邮箱注册")

    hashed_password = security.get_password_hash(user.password)
    
    db_user = models.User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    return db_user

def get_user_by_id(db: Session, user_id: int):

    return db.query(models.User).filter(models.User.id == user_id).first()

def update_user_avatar(db: Session, user_id: int, avatar_url: str) -> models.User:
    """
    更新用户头像，并删除旧头像文件
    """
    # 1. 根据 user_id 找到这个用户
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if db_user:
        # 2. 保存旧头像 URL（用于后续删除）
        old_avatar_url = db_user.avatar_url
        
        # 3. 更新 avatar_url 字段
        db_user.avatar_url = avatar_url
        
        # 4. 提交更改
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        # 5. 删除旧头像文件（如果存在且不是默认头像）
        if old_avatar_url and old_avatar_url.startswith('/static/avatars/'):
            try:
                old_file_path = f"backend{old_avatar_url}"
                if os.path.exists(old_file_path):
                    os.remove(old_file_path)
                    print(f"✅ 已删除旧头像: {old_file_path}")
            except Exception as e:
                print(f"❌ 删除旧头像失败: {old_file_path}, 错误: {e}")
        
    return db_user

def update_user_profile(db: Session, user_id: int, user_update: schemas.UserUpdate) -> models.User:
    """
    更新用户信息
    
    Args:
        db: 数据库会话
        user_id: 用户ID
        user_update: 要更新的用户数据
        
    Returns:
        更新后的用户对象
    """
    # 1. 查找用户
    db_user = db.query(models.User).filter(models.User.id == user_id).first()
    
    if not db_user:
        return None
    
    # 2. 更新字段（只更新提供的字段）
    if user_update.username is not None:
        db_user.username = user_update.username
    
    # 3. 提交到数据库
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # 4. 返回更新后的用户
    return db_user

def get_post_by_id(db: Session, post_id: int):

    return db.query(models.Post).filter(models.Post.id == post_id).first()

def get_posts(
    db: Session, 
    post_type: Optional[models.Post.PostTypeEnum] = None,
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    sort_by: Optional[str] = None,
    skip: int = 0, 
    limit: int = 100
):
    """
    获取帖子列表，支持多种筛选和排序
    
    Args:
        db: 数据库会话
        post_type: 帖子类型筛选 (sell/buy/free)
        keyword: 关键词搜索（标题或描述）
        category_id: 分类筛选
        sort_by: 排序方式 (latest/price_asc/price_desc)
        skip: 跳过的记录数
        limit: 返回的最大记录数
    
    Returns:
        tuple: (帖子列表, 总数)
    """
    # 建立基础查询
    query = db.query(models.Post)
    
    # 1. 帖子类型筛选
    if post_type:
        query = query.filter(models.Post.post_type == post_type)
    
    # 2. 关键词搜索（标题或描述）
    if keyword:
        search_pattern = f"%{keyword}%"
        query = query.filter(
            (models.Post.title.like(search_pattern)) | 
            (models.Post.description.like(search_pattern))
        )
    
    # 3. 分类筛选
    if category_id:
        query = query.filter(models.Post.category_id == category_id)
    
    # 先计算总数（在排序和分页之前）
    total = query.count()
    
    # 4. 排序
    if sort_by == "price_asc":
        # 价格从低到高
        query = query.order_by(models.Post.price.asc())
    elif sort_by == "price_desc":
        # 价格从高到低
        query = query.order_by(models.Post.price.desc())
    else:
        # 默认按最新发布排序
        query = query.order_by(models.Post.created_at.desc())
    
    # 5. 分页并执行查询
    posts = query.offset(skip).limit(limit).all()
    
    # 返回帖子列表和总数
    return posts, total

def create_post(db: Session, post: schemas.PostCreate, owner_id: int):
    
    db_post = models.Post(
        **post.dict(), 
        owner_id=owner_id  # 2. 手动关联当前登录的用户 ID
    )
    # 3. 存入数据库
    db.add(db_post)
    db.commit()
    db.refresh(db_post) # 刷新，以获取新创建的 post_id
    
    # 4. 返回新创建的帖子模型
    return db_post


def update_post(
    db: Session, 
    db_post: models.Post, 
    post_update: schemas.PostUpdate
) -> models.Post:
   
    update_data = post_update.dict(exclude_unset=True)
    
    # 2. 遍历你获取到的新数据
    for key, value in update_data.items():

        setattr(db_post, key, value)
        
    # 3. 提交更改到数据库
    db.add(db_post) # 标记 db_post 为已更改
    db.commit()      # 提交事务
    db.refresh(db_post) # 刷新，获取最新的数据
    
    return db_post


def delete_post(db: Session, db_post: models.Post):
    """
    删除帖子及其关联的图片文件
    """
    # 1. 先获取所有图片的 URL
    image_urls = [img.image_url for img in db_post.images]
    
    # 2. 删除数据库记录（会自动删除关联的 images 记录，因为有 cascade）
    db.delete(db_post)
    db.commit()
    
    # 3. 删除物理文件
    for image_url in image_urls:
        try:
            # image_url 格式: /static/images/uuid.jpg
            # 转换为物理路径: backend/static/images/uuid.jpg
            file_path = f"backend{image_url}"
            
            # 检查文件是否存在
            if os.path.exists(file_path):
                os.remove(file_path)
                print(f"✅ 已删除图片文件: {file_path}")
            else:
                print(f"⚠️  图片文件不存在: {file_path}")
        except Exception as e:
            # 文件删除失败不影响数据库操作，只记录错误
            print(f"❌ 删除图片文件失败: {file_path}, 错误: {e}")
    
    return

def get_categories(db: Session):

    # 查询 models.Category (分类) 表，并返回 .all() (所有) 结果
    return db.query(models.Category).all()

def add_post_image(db: Session, post_id: int, image_url: str) -> models.PostImage:

    
    # 1. 创建一个 PostImage 模型实例
    db_image = models.PostImage(
        post_id=post_id,
        image_url=image_url
    )
    
    # 2. 存入数据库
    db.add(db_image)
    db.commit()
    db.refresh(db_image) # 刷新，以获取新创建的 id
    
    # 3. 返回新创建的图片模型
    return db_image

def get_favorite(db: Session, user_id: int, post_id: int) -> Optional[models.Favorite]:

    # 查询 favorites 表，条件是 user_id 和 post_id 必须同时匹配
    return db.query(models.Favorite).filter(
        models.Favorite.user_id == user_id,
        models.Favorite.post_id == post_id
    ).first()

def favorite_post(db: Session, user_id: int, post_id: int) -> models.Favorite:

    # 1. 创建一个 Favorite (收藏) 数据库对象
    db_favorite = models.Favorite(
        user_id=user_id,
        post_id=post_id
    )
    
    # 2. 存入数据库
    db.add(db_favorite)
    db.commit()
    db.refresh(db_favorite)
    
    return db_favorite

def unfavorite_post(db: Session, db_favorite: models.Favorite):

    db.delete(db_favorite)
    db.commit()
    return

def get_user_favorites(db: Session, user_id: int) -> List[models.Post]:

    # 1. ⬇️ 关键：执行数据库的 "JOIN" (连接) 查询 ⬇️
    #    我们说“我想要查询 Post (帖子) 表”...
    query = db.query(models.Post).join(
        models.Favorite, # ...“把它和 Favorite (收藏) 表连接起来”...
        models.Favorite.post_id == models.Post.id # ...“连接的条件是 Post.id 等于 Favorite.post_id”
    )
    
    # 2. (在连接后的“大表”中) 筛选出 "Favorite.user_id" 是当前用户的记录
    query = query.filter(models.Favorite.user_id == user_id)
    
    # 3. (可选) 按收藏时间倒序排列，让最新收藏的排在最前面
    query = query.order_by(models.Favorite.created_at.desc())
    
    # 4. 返回所有匹配的“帖子 (Post)”对象的列表
    return query.all()


def create_message(
    db: Session, 
    content: str, 
    post_id: int, 
    sender_id: int, 
    receiver_id: int
) -> models.Message:

    # 1. 创建 Message 数据库对象
    db_message = models.Message(
        content=content,
        post_id=post_id,
        sender_id=sender_id,
        receiver_id=receiver_id
        # 'created_at' 和 'read' 字段会自动使用数据库的默认值
    )
    
    # 2. 存入数据库
    db.add(db_message)
    db.commit()
    db.refresh(db_message)
    
    return db_message

def get_conversation_messages(
    db: Session, 
    post_id: int, 
    user_a_id: int, 
    user_b_id: int
) -> List[models.Message]:

    from sqlalchemy import or_, and_
    
    # 1. 查询 messages 表
    query = db.query(models.Message)
    
    # 2. 筛选条件 (关键)：
    query = query.filter(
        # A. 必须是这个帖子
        models.Message.post_id == post_id,
        
        # B. 必须在 A 和 B 之间
        or_(
            # (情况1: A 发给 B)
            and_(
                models.Message.sender_id == user_a_id,
                models.Message.receiver_id == user_b_id
            ),
            # (情况2: B 发给 A)
            and_(
                models.Message.sender_id == user_b_id,
                models.Message.receiver_id == user_a_id
            )
        )
    )
    
    # 3. 按时间正序排列 (最早的消息在最前面)
    query = query.order_by(models.Message.created_at.asc())
    
    # 4. 返回所有消息
    return query.all()

def get_user_inbox(db: Session, user_id: int) -> List[schemas.InboxConversation]:

    # 1. 查询所有与该用户相关的消息
    #    .options(joinedload(...)) 是一个“预加载”优化：
    #    告诉 SQLAlchemy 在一次查询中，同时获取关联的
    #    post, sender, 和 receiver 对象，避免“N+1查询”
    messages_query = db.query(models.Message).options(
        joinedload(models.Message.post),
        joinedload(models.Message.sender),
        joinedload(models.Message.receiver)
    ).filter(
        or_(
            models.Message.sender_id == user_id,
            models.Message.receiver_id == user_id
        )
    )
    
    # 2. 按时间倒序排列 (最新的消息在最前面)
    messages = messages_query.order_by(desc(models.Message.created_at)).all()
    
    # 3. ⬇️ 关键：在 Python 中处理，按“会话”分组 ⬇️
    
    inbox_list: List[schemas.InboxConversation] = []
    processed_keys = set() # 用来跟踪已处理的会话 (post_id, other_user_id)
    
    for msg in messages:
        # (检查：确保关联数据存在，比如帖子或用户没被删除)
        if not msg.post or not msg.sender or not msg.receiver:
            continue
            
        # 4. 确定“对方”是谁
        other_user_id = msg.sender_id if msg.sender_id != user_id else msg.receiver_id
        
        # 5. 定义这个会话的唯一“钥匙”
        conversation_key = (msg.post_id, other_user_id)
        
        # 6. 检查是否已经处理过这个会话
        if conversation_key not in processed_keys:
            
            # (如果没处理过，这条 msg 就是最新的)
            
            # 7. 确定 "other_user" 对象
            other_user = msg.sender if msg.sender_id != user_id else msg.receiver
            
            # 8. 组装成 InboxConversation
            #    (Pydantic 会自动把 models.Post 转换为 schemas.Post)
            inbox_item = schemas.InboxConversation(
                post=msg.post,
                other_user=other_user,
                last_message=msg
            )
            
            # 9. 添加到结果列表
            inbox_list.append(inbox_item)
            
            # 10. 标记这个“钥匙”为“已处理”
            processed_keys.add(conversation_key)
            
    return inbox_list

def create_report(
    db: Session, 
    reporter_id: int, 
    report_data: schemas.ReportCreate
) -> models.Report:

    
    # 1. 创建 Report 数据库对象
    #    使用 **report_data.dict() 来自动解包 
    #    reported_user_id, reason, 和 description
    db_report = models.Report(
        **report_data.dict(),
        reporter_id=reporter_id 
        # 'status' 字段会自动使用数据库的默认值 (e.g., 'pending')
    )
    
    # 2. 存入数据库
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

def mark_conversation_as_read(
    db: Session,
    post_id: int,
    current_user_id: int,
    other_user_id: int
) -> int:
    """
    将指定会话中，对方发给当前用户的所有未读消息标记为已读。
    
    返回被更新的消息数量。
    """
    # 查找符合条件的消息并更新
    updated_count = db.query(models.Message).filter(
        models.Message.post_id == post_id,
        models.Message.sender_id == other_user_id,      # 对方发的
        models.Message.receiver_id == current_user_id,  # 发给我的
        models.Message.is_read == False                 # 未读的
    ).update({"is_read": True}, synchronize_session=False)
    
    db.commit()
    
    return updated_count

# =======================================================================
# Transaction (交易确认) 相关函数
# =======================================================================

def create_transaction(
    db: Session,
    post_id: int,
    seller_id: int,
    buyer_id: int
) -> models.Transaction:
    """
    创建交易记录（卖家标记已售出时调用）
    """
    db_transaction = models.Transaction(
        post_id=post_id,
        seller_id=seller_id,
        buyer_id=buyer_id
    )
    
    db.add(db_transaction)
    db.commit()
    db.refresh(db_transaction)
    
    return db_transaction

def get_transaction_by_post_id(db: Session, post_id: int) -> Optional[models.Transaction]:
    """
    根据帖子 ID 获取交易记录
    """
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.seller),
        joinedload(models.Transaction.buyer),
        joinedload(models.Transaction.post)
    ).filter(models.Transaction.post_id == post_id).first()

def get_transaction_by_id(db: Session, transaction_id: int) -> Optional[models.Transaction]:
    """
    根据交易 ID 获取交易记录
    """
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.seller),
        joinedload(models.Transaction.buyer),
        joinedload(models.Transaction.post)
    ).filter(models.Transaction.id == transaction_id).first()

def confirm_transaction(
    db: Session,
    transaction: models.Transaction,
    user_id: int
) -> models.Transaction:
    """
    确认交易（买家或卖家确认）
    如果双方都确认，则完成交易并增加双方的 success_trades
    """
    # 判断是买家还是卖家
    if user_id == transaction.seller_id:
        transaction.seller_confirmed = True
    elif user_id == transaction.buyer_id:
        transaction.buyer_confirmed = True
    else:
        raise ValueError("用户不是交易的买家或卖家")
    
    # 检查是否双方都确认
    if transaction.seller_confirmed and transaction.buyer_confirmed and not transaction.completed:
        transaction.completed = True
        transaction.completed_at = func.now()
        
        # 增加双方的成功交易次数
        seller = db.query(models.User).filter(models.User.id == transaction.seller_id).first()
        buyer = db.query(models.User).filter(models.User.id == transaction.buyer_id).first()
        
        if seller:
            seller.success_trades += 1
        if buyer:
            buyer.success_trades += 1
    
    db.commit()
    db.refresh(transaction)
    
    return transaction

def get_pending_transactions_for_user(db: Session, user_id: int) -> List[models.Transaction]:
    """
    获取用户的待确认交易列表
    """
    return db.query(models.Transaction).options(
        joinedload(models.Transaction.seller),
        joinedload(models.Transaction.buyer),
        joinedload(models.Transaction.post)
    ).filter(
        or_(
            models.Transaction.seller_id == user_id,
            models.Transaction.buyer_id == user_id
        ),
        models.Transaction.completed == False
    ).order_by(desc(models.Transaction.created_at)).all()

def get_users_who_contacted_post(db: Session, post_id: int, owner_id: int) -> List[models.User]:
    """
    获取与帖主联系过的所有用户（用于选择买家）
    返回去重后的用户列表
    """
    # 查询所有与该帖子相关的消息
    messages = db.query(models.Message).filter(
        models.Message.post_id == post_id,
        or_(
            models.Message.sender_id == owner_id,
            models.Message.receiver_id == owner_id
        )
    ).all()
    
    # 提取对方用户ID并去重
    user_ids = set()
    for msg in messages:
        if msg.sender_id != owner_id:
            user_ids.add(msg.sender_id)
        if msg.receiver_id != owner_id:
            user_ids.add(msg.receiver_id)
    
    # 查询这些用户
    if not user_ids:
        return []
    
    users = db.query(models.User).filter(models.User.id.in_(user_ids)).all()
    return users