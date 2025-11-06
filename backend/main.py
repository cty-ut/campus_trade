from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi import UploadFile, File
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm, OAuth2PasswordBearer
from typing import Annotated, List, Optional
from fastapi import Response
import shutil  
import uuid    
from pathlib import Path 
from . import crud, models, schemas, security
from .database import SessionLocal, engine, get_db






models.Base.metadata.create_all(bind=engine)


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/token")

app = FastAPI()

app.mount("/static", StaticFiles(directory="backend/static"), name="static")

origins = [
    "http://localhost:3000", # 你的 React (CRA) 开发服务器地址
    "http://localhost:5173", # 你的 React (Vite) 开发服务器地址
    "http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com", # AWS S3 前端
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,       # 允许访问的源
    allow_credentials=True,    # 允许携带 cookie
    allow_methods=["*"],         # 允许所有 HTTP 方法 (GET, POST, etc.)
    allow_headers=["*"],         # 允许所有 HTTP 请求头
)


credentials_exception = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED,
    detail="身份验证失败",
    headers={"WWW-Authenticate": "Bearer"},
)

def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)], 
    db: Session = Depends(get_db)
) -> models.User:
    """
    一个依赖项 (门卫)，用于：
    1. 从请求头中提取 Token。
    2. 验证 Token (验票)。
    3. 返回数据库中的 User 对象。
    """
    
    # 1. 验票 (调用 security.py 里的“验票机”)
    email = security.decode_access_token(token)
    
    # 2. 如果验票失败 (Token 错误或过期)
    if email is None:
        raise credentials_exception
        
    # 3. 验票成功，从 Token 中获取 email，去数据库里找人
    user = crud.get_user_by_email(db, email=email)
    
    # 4. 如果在数据库里找不到 (比如用户在 Token 过期前被删了)
    if user is None:
        raise credentials_exception
        
    # 5. 返回完整的 User 对象
    return user

# =======================================================
# 🚀 第一个 API 接口：用户注册
# =======================================================

@app.post("/api/users/register", 
          response_model=schemas.User,  # 4. 指定“响应”模型
          status_code=status.HTTP_201_CREATED, # 5. 成功时的状态码
          tags=["Users"]) # 6. 在 API 文档中的分组
def register_user(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """
    注册一个新用户：
    - 验证学校邮箱后缀
    - 检查邮箱或昵称是否已存在
    - 加密密码并存储
    """
    
    # 7. 检查邮箱是否已存在 (调用 crud "厨师" 的功能)
    db_user_email = crud.get_user_by_email(db, email=user.email)
    if db_user_email:
        # 8. 如果存在，"服务员" 抛出一个 HTTP 错误给前端
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该邮箱已被注册"
        )
    
    try:
        # 9. 一切正常，让“厨师”创建用户
        new_user = crud.create_user(db=db, user=user)
        return new_user
    except ValueError as e:
        # 10. 捕获“厨师”抛出的“学校邮箱错误”
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e) # str(e) 会是 "必须使用学校邮箱注册"
        )


@app.post("/api/token", 
          response_model=schemas.Token, # ⬅️ 响应模型是我们在 schema 里定义的 Token
          tags=["Auth"]) # ⬅️ 分组为 "Auth" (认证)
def login_for_access_token(
    form_data: OAuth2PasswordRequestForm = Depends(), # ⬅️ 关键
    db: Session = Depends(get_db)
):
    """
    用户登录以获取 Access Token (数字身份证)
    """
    
    # --- 关键说明 ---
    # OAuth2PasswordRequestForm 规定了登录必须使用 "username" 和 "password" 字段。
    # 在我们的系统中，"username" 字段对应的就是 "email"。
    # 所以我们用 form_data.username 来获取用户输入的 "email"。
    
    # 1. 验证用户
    user = crud.get_user_by_email(db, email=form_data.username)
    
    # 2. 检查用户是否存在，以及密码是否正确
    if not user or not security.verify_password(form_data.password, user.hashed_password):
        # 统一抛出“未授权”错误，不告诉黑客到底是“用户名错了”还是“密码错了”
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="邮箱或密码不正确",
            headers={"WWW-Authenticate": "Bearer"}, # ⬅️ OAuth2 标准要求
        )
        
    # 3. 制造 Token
    # "sub" (subject) 是 JWT 的标准字段，用来存放用户的唯一标识
    access_token = security.create_access_token(
        data={"sub": user.email}
    )
    
    # 4. 返回 Token
    return {"access_token": access_token, "token_type": "bearer"}


# =ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==
# 4. ⬇️ 接口 3：获取当前用户信息 (新功能) ⬇️
# =ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==ax==
@app.get("/api/users/me", 
         response_model=schemas.User, # 响应会是一个 User 对象
         tags=["Users"])
def read_users_me(
    current_user: Annotated[models.User, Depends(get_current_user)]
):
    """
    获取当前登录用户的信息。
    这个接口受保护，必须提供有效的 Access Token。
    """
    # 5. ⬇️ 这就是全部的逻辑 ⬇️
    return current_user

# =======================================================
# 接口：更新用户信息
# =======================================================
@app.patch("/api/users/me",
           response_model=schemas.User,
           tags=["Users"])
def update_user_info(
    user_update: schemas.UserUpdate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    更新当前登录用户的信息（如用户名）。
    这个接口受保护，必须提供有效的 Access Token。
    """
    # 调用 CRUD 函数更新用户信息
    updated_user = crud.update_user_profile(
        db=db,
        user_id=current_user.id,
        user_update=user_update
    )
    
    if updated_user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="用户未找到"
        )
    
    return updated_user

# =======================================================
# ⬇️ 2. 接口 4：上传/更新用户头像 (新功能) ⬇️
# =======================================================
@app.post("/api/users/me/avatar",
          response_model=schemas.User, # 1. 响应是更新后的 User 对象
          tags=["Users"])
def upload_user_avatar( 
    current_user: Annotated[models.User, Depends(get_current_user)],
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    为当前登录用户上传或更新头像。
    """
    
    # 4. ⬇️ 关键：文件保存逻辑 (复制自任务D) ⬇️
    
    # A. 获取文件后缀
    file_extension = Path(file.filename).suffix
    
    # B. 生成唯一文件名
    file_name = f"{uuid.uuid4()}{file_extension}"
    
    # C. ⬇️ 关键：使用新的 "avatars" 文件夹 ⬇️
    save_path = f"backend/static/avatars/{file_name}"
    
    # D. ⬇️ 关键：使用新的 "avatars" URL ⬇️
    url_path = f"/static/avatars/{file_name}"
    
    try:
        # E. 保存文件
        with open(save_path, "wb") as f_out:
            shutil.copyfileobj(file.file, f_out)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存文件失败: {e}"
        )
    finally:
        file.file.close()

    # 5. (文件保存成功) 调用“厨师”函数，更新数据库
    updated_user = crud.update_user_avatar(
        db=db, 
        user_id=current_user.id, # ⬅️ 使用当前登录用户的 ID
        avatar_url=url_path        # ⬅️ 使用新的 URL
    )
    
    # 6. 返回更新后的用户信息
    return updated_user

# =======================================================
# ⬇️ 2. 接口 4：创建新帖子 (新功能) ⬇️
# =======================================================
@app.post("/api/posts", 
          response_model=schemas.Post, # 响应模型是 Post
          status_code=status.HTTP_201_CREATED,
          tags=["Posts"]) # 归类到 "Posts"
def create_new_post(
    post: schemas.PostCreate, # 1. 从请求体中获取帖子数据
    # 2. ⬇️ 关键：使用“门卫”依赖项 ⬇️
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    创建一个新帖子（商品/求购/免费）。
    这个接口受保护，必须提供有效的 Access Token。
    """
    # 3. 调用“厨师”函数，并传入当前登录用户的 ID
    new_post = crud.create_post(db=db, post=post, owner_id=current_user.id)
    return new_post

# =======================================================
# 接口 5：获取帖子列表 (支持分页和筛选)
# =======================================================
@app.get("/api/posts", 
         response_model=schemas.PostsResponse,
         tags=["Posts"])
def read_posts(
    post_type: Optional[models.Post.PostTypeEnum] = None,
    keyword: Optional[str] = None,
    category_id: Optional[int] = None,
    sort_by: Optional[str] = None,
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """
    获取帖子列表，支持筛选、搜索、排序和分页
    
    返回格式: {"posts": [...], "total": 总数}
    """
    # 调用 crud 函数获取帖子列表和总数
    posts, total = crud.get_posts(
        db=db, 
        post_type=post_type,
        keyword=keyword,
        category_id=category_id,
        sort_by=sort_by,
        skip=skip,
        limit=limit
    )
    
    # 返回新的响应格式
    return {"posts": posts, "total": total}

# =======================================================
# ⬇️ 4. 接口 6：获取单个帖子详情 (新功能) ⬇️
# =======================================================
@app.get("/api/posts/{post_id}", 
         response_model=schemas.Post,
         tags=["Posts"])
def read_post(
    post_id: int, # 从 URL 路径中获取 post_id
    db: Session = Depends(get_db)
):
    """
    根据 ID 获取单个帖子的详细信息。
    这个接口是公开的，不需要登录。
    """
    db_post = crud.get_post_by_id(db=db, post_id=post_id)
    
    # 关键：处理“未找到”的情况
    if db_post is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="帖子未找到"
        )
    return db_post


# =======================================================
# ⬇️ 2. 接口 7：更新帖子 (新功能) ⬇️
# =======================================================
@app.patch("/api/posts/{post_id}", 
           response_model=schemas.Post,
           tags=["Posts"])
def update_existing_post(
    post_id: int, 
    post_update: schemas.PostUpdate, # 1. 接收更新数据
    current_user: Annotated[models.User, Depends(get_current_user)], # 2. 必须登录
    db: Session = Depends(get_db)
):
    """
    更新一篇帖子的信息。
    - 必须登录。
    - 必须是帖子的所有者。
    """
    # 3. 先从数据库找到这个帖子
    db_post = crud.get_post_by_id(db=db, post_id=post_id)
    
    # 4. 检查帖子是否存在
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
        
    # 5. ⬇️ 关键：授权 (Authorization) 检查 ⬇️
    # 检查帖子的所有者ID (db_post.owner_id) 
    # 是否等于当前登录用户的ID (current_user.id)
    if db_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="没有权限修改此帖子"
        )
        
    # 6. (授权通过) 调用“厨师”函数来更新
    updated_post = crud.update_post(db=db, db_post=db_post, post_update=post_update)
    return updated_post

# =======================================================
# ⬇️ 3. 接口 8：删除帖子 (新功能) ⬇️
# =======================================================
@app.delete("/api/posts/{post_id}",
            status_code=status.HTTP_204_NO_CONTENT, # 1. 成功后不返回内容
            tags=["Posts"])
def delete_existing_post(
    post_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    删除一篇帖子。
    - 必须登录。
    - 必须是帖子的所有者。
    """
    # 3. 先从数据库找到这个帖子
    db_post = crud.get_post_by_id(db=db, post_id=post_id)
    
    # 4. 检查帖子是否存在
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
        
    # 5. ⬇️ 关键：授权 (Authorization) 检查 ⬇️
    if db_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="没有权限删除此帖子"
        )
        
    # 6. (授权通过) 调用“厨师”函数来删除
    crud.delete_post(db=db, db_post=db_post)
    
    # 7. 返回 204 No Content (表示成功，但没有内容返回)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# =======================================================
# ⬇️ 2. 接口 7：获取所有分类 (新功能) ⬇️
# =======================================================
@app.get("/api/categories",
         response_model=List[schemas.Category], # 1. 响应是一个列表，列表里是 Category
         tags=["Categories"]) # 2. 归类到 "Categories"
def read_categories(db: Session = Depends(get_db)):
    """
    获取所有分类的列表（用于发布页面的下拉菜单）。
    这个接口是公开的，不需要登录。
    """
    # 3. 调用“厨师”函数
    categories = crud.get_categories(db=db)
    return categories


@app.post("/api/posts/{post_id}/images",
          response_model=schemas.PostImage, # 1. 响应会是一个 PostImage 对象
          status_code=status.HTTP_201_CREATED,
          tags=["Posts"]) # 归类到 "Posts"
def upload_image_for_post(
    post_id: int, 
    current_user: Annotated[models.User, Depends(get_current_user)],
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    为指定的帖子上传一张图片。
    - 必须登录。
    - 必须是帖子的所有者。
    """
    
    # 4. 先从数据库找到这个帖子
    db_post = crud.get_post_by_id(db=db, post_id=post_id)
    
    # 5. 检查帖子是否存在
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
        
    # 6. ⬇️ 关键：授权 (Authorization) 检查 ⬇️
    # 检查帖子的所有者ID (db_post.owner_id) 
    # 是否等于当前登录用户的ID (current_user.id)
    if db_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="没有权限为此帖子上传图片"
        )
        
    # 7. ⬇️ 关键：处理文件保存 ⬇️
    
    # A. 获取文件后缀 (例如: ".jpg", ".png")
    file_extension = Path(file.filename).suffix
    
    # B. 生成一个唯一的 UUID + 后缀，作为新文件名
    #    (防止用户 A 和用户 B 都上传 "image.jpg" 导致文件被覆盖)
    file_name = f"{uuid.uuid4()}{file_extension}"
    
    # C. 定义文件在服务器上的“物理保存路径”
    save_path = f"backend/static/images/{file_name}"
    
    # D. 定义文件在服务器上的“URL访问路径” (这是我们要存入数据库的)
    url_path = f"/static/images/{file_name}"
    
    try:
        # E. (核心) 以二进制写模式 (wb) 打开保存路径
        with open(save_path, "wb") as f_out:
            # 使用 shutil.copyfileobj 高效地将上传的文件流 "复制" 到新文件中
            shutil.copyfileobj(file.file, f_out)
    except Exception as e:
        # 如果保存失败，返回服务器错误
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"保存文件失败: {e}"
        )
    finally:
        # 无论成功与否，都要关闭上传的文件流
        file.file.close()

    # 8. (文件保存成功) 调用“厨师”函数，将 URL 存入数据库
    new_image_record = crud.add_post_image(db=db, post_id=post_id, image_url=url_path)
    
    # 9. 返回新创建的图片记录 (符合 schemas.PostImage 格式)
    return new_image_record


# =======================================================
# ⬇️ 2. 接口 12：获取“我的收藏”列表 (新功能) ⬇️
# =======================================================
@app.get("/api/users/me/favorites",
         response_model=List[schemas.Post], 
         tags=["Favorites"]) 
def read_my_favorites(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db) 
):
    """
    获取当前登录用户收藏的所有帖子列表。
    """
    # 4. 调用“厨师”函数，传入当前用户 ID
    favorite_posts = crud.get_user_favorites(db=db, user_id=current_user.id)
    return favorite_posts

# =======================================================
# ⬇️ 3. 接口 13：收藏一个帖子 (新功能) ⬇️
# =======================================================
@app.post("/api/posts/{post_id}/favorite",
          status_code=status.HTTP_201_CREATED,
          tags=["Favorites"])
def add_post_to_favorites(
    post_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    收藏一个帖子。
    """
    # 2. 检查帖子是否存在
    db_post = crud.get_post_by_id(db=db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
        
    # 3. 检查是否“已经”收藏过了
    db_favorite = crud.get_favorite(
        db=db, user_id=current_user.id, post_id=post_id
    )
    if db_favorite:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, 
            detail="你已经收藏过此帖子"
        )
        
    # 4. (检查通过) 调用“厨师”函数
    crud.favorite_post(db=db, user_id=current_user.id, post_id=post_id)
    
    # 5. 返回 201 Created (表示成功，不返回具体内容)
    return Response(status_code=status.HTTP_201_CREATED)

# =======================================================
# ⬇️ 新增：检查是否已收藏某个帖子 ⬇️
# =======================================================
@app.get("/api/posts/{post_id}/favorite",
         tags=["Favorites"])
def check_if_favorited(
    post_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    检查当前用户是否已收藏某个帖子。
    返回 {"is_favorited": true} 或 {"is_favorited": false}
    """
    db_favorite = crud.get_favorite(
        db=db, user_id=current_user.id, post_id=post_id
    )
    return {"is_favorited": db_favorite is not None}

# =======================================================
# ⬇️ 4. 接口 14：取消收藏一个帖子 (新功能) ⬇️
# =======================================================
@app.delete("/api/posts/{post_id}/favorite",
            status_code=status.HTTP_204_NO_CONTENT,
            tags=["Favorites"])
def remove_post_from_favorites(
    post_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    取消收藏一个帖子。
    """
    # 2. 检查“收藏记录”是否存在
    db_favorite = crud.get_favorite(
        db=db, user_id=current_user.id, post_id=post_id
    )
    if db_favorite is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="收藏记录未找到"
        )
        
    # 3. (记录存在) 调用“厨师”函数删除
    crud.unfavorite_post(db=db, db_favorite=db_favorite)
    
    # 4. 返回 204 No Content (表示成功，不返回具体内容)
    return Response(status_code=status.HTTP_204_NO_CONTENT)

# =======================================================
# ⬇️ 2. 接口 15：发送一条新消息 (新功能) ⬇️
# =======================================================
@app.post("/api/messages",
          response_model=schemas.Message, # 1. 响应会是完整的 Message
          status_code=status.HTTP_201_CREATED,
          tags=["Messages"])
def send_new_message(
    message_data: schemas.MessageCreate, # 2. 接收符合 MessageCreate 格式的 JSON
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db) # 3. 必须登录
):
    """
    发送一条新消息。
    """
    # 4. 检查：不能自己给自己发
    if message_data.receiver_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能给自己发送消息"
        )
        
    # 5. (可选) 检查帖子是否存在
    db_post = crud.get_post_by_id(db, post_id=message_data.post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
        
    # 6. 调用“厨师”函数
    new_message = crud.create_message(
        db=db,
        content=message_data.content,
        post_id=message_data.post_id,
        sender_id=current_user.id, # ⬅️ 发送者是“我”
        receiver_id=message_data.receiver_id # ⬅️ 接收者是数据中指定的
    )
    
    # 7. 返回新创建的消息 (包含 sender 和 receiver 的完整信息)
    return new_message

# =======================================================
# ⬇️ 3. 接口 16：获取特定会话的聊天记录 (新功能) ⬇️
# =======================================================
@app.get("/api/conversations",
         response_model=List[schemas.Message], # 1. 响应是一个“消息”列表
         tags=["Messages"])
def get_conversation_details(
    post_id: int, # 2. (查询参数) 必须指定关于哪个帖子
    other_user_id: int, # 2. (查询参数) 必须指定“对方”是谁
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db) # 3. 必须登录
):
    """
    获取“我”和“另一个用户”之间，关于“某个帖子”的
    所有聊天记录。
    """
    
    # 4. 调用“厨师”函数
    messages = crud.get_conversation_messages(
        db=db,
        post_id=post_id,
        user_a_id=current_user.id, # ⬅️ A 是“我”
        user_b_id=other_user_id  # ⬅️ B 是“对方”
    )
    
    return messages

# =======================================================
# ⬇️ 2. 接口 17：获取“我的收件箱” (新功能) ⬇️
# =======================================================
@app.get("/api/users/me/inbox",
         response_model=List[schemas.InboxConversation], # 1. 响应是“会话”列表
         tags=["Messages"]) # 归类到 "Messages"
def read_my_inbox(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    获取当前登录用户的“收件箱”列表。
    
    返回一个“会话”列表，每个会话包含：
    - 相关的帖子 (post)
    - 对方的用户 (other_user)
    - 最后一条消息 (last_message)
    """
    
    # 3. 调用我们刚写的、最复杂的“厨师”函数
    inbox_conversations = crud.get_user_inbox(db=db, user_id=current_user.id)
    
    return inbox_conversations


# =======================================================
# ⬇️ 2. 接口 18：创建一个举报 (新功能 - 最终任务) ⬇️
# =======================================================
@app.post("/api/reports",
          response_model=schemas.Report, # 1. 响应会是你定义的 Report schema
          status_code=status.HTTP_201_CREATED,
          tags=["Reports"]) # 2. 归类到 "Reports"
def create_new_report(
    report_data: schemas.ReportCreate, # 3. 接收你定义的 ReportCreate
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db) # 4. 必须登录
):
    """
    创建一个新的举报。
    前端需要在 body 中提供 reported_user_id 和 reason。
    """
    
    # 5. 检查：不能举报自己
    if report_data.reported_user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能举报自己"
        )
        
    # 6. 检查：“被举报人”是否存在
    #    (调用我们刚在 crud.py 里加的辅助函数)
    db_user_to_report = crud.get_user_by_id(db, user_id=report_data.reported_user_id)
    if db_user_to_report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="被举报的用户未找到"
        )
        
    # 7. 调用“厨师”函数
    new_report = crud.create_report(
        db=db,
        reporter_id=current_user.id, # ⬅️ 举报人是“我”
        report_data=report_data      # ⬅️ 举报数据来自 Body
    )
    
    # 8. 返回新创建的举报记录
    return new_report

# =======================================================
# 接口 19：标记会话为已读
# =======================================================
@app.patch("/api/conversations/mark-read",
           tags=["Messages"])
def mark_conversation_read(
    post_id: int,           # 查询参数：帖子 ID
    other_user_id: int,     # 查询参数：对方用户 ID
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    将指定会话中，对方发给我的所有未读消息标记为已读。
    
    返回被更新的消息数量。
    """
    # 调用 CRUD 函数
    updated_count = crud.mark_conversation_as_read(
        db=db,
        post_id=post_id,
        current_user_id=current_user.id,
        other_user_id=other_user_id
    )
    
    return {"updated_count": updated_count}

# =======================================================
# 接口 20：创建交易（卖家标记已售出时选择买家）
# =======================================================
@app.post("/api/transactions",
          response_model=schemas.Transaction,
          status_code=status.HTTP_201_CREATED,
          tags=["Transactions"])
def create_new_transaction(
    transaction_data: schemas.TransactionCreate,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    创建交易记录（卖家标记商品已售出时选择买家）
    """
    # 检查帖子是否存在
    db_post = crud.get_post_by_id(db, post_id=transaction_data.post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
    
    # 检查是否是帖主
    if db_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有帖主可以创建交易"
        )
    
    # 检查帖子是否已经有交易记录
    existing_transaction = crud.get_transaction_by_post_id(db, post_id=transaction_data.post_id)
    if existing_transaction:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="该帖子已有交易记录"
        )
    
    # 检查买家是否存在
    buyer = crud.get_user_by_id(db, user_id=transaction_data.buyer_id)
    if buyer is None:
        raise HTTPException(status_code=404, detail="买家未找到")
    
    # 不能选择自己作为买家
    if transaction_data.buyer_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="不能选择自己作为买家"
        )
    
    # 创建交易记录
    new_transaction = crud.create_transaction(
        db=db,
        post_id=transaction_data.post_id,
        seller_id=current_user.id,
        buyer_id=transaction_data.buyer_id
    )
    
    # 同时将帖子状态更新为已售出
    db_post.status = models.Post.StatusEnum.sold
    db.commit()
    
    return new_transaction

# =======================================================
# 接口 21：确认交易
# =======================================================
@app.patch("/api/transactions/{transaction_id}/confirm",
           response_model=schemas.Transaction,
           tags=["Transactions"])
def confirm_transaction_endpoint(
    transaction_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    确认交易（买家或卖家确认）
    双方都确认后，各自的 success_trades +1
    """
    # 获取交易记录
    db_transaction = crud.get_transaction_by_id(db, transaction_id=transaction_id)
    if db_transaction is None:
        raise HTTPException(status_code=404, detail="交易记录未找到")
    
    # 检查用户是否是交易的买家或卖家
    if current_user.id not in [db_transaction.seller_id, db_transaction.buyer_id]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="您不是该交易的参与者"
        )
    
    # 检查是否已经确认过
    if current_user.id == db_transaction.seller_id and db_transaction.seller_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经确认过该交易"
        )
    if current_user.id == db_transaction.buyer_id and db_transaction.buyer_confirmed:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="您已经确认过该交易"
        )
    
    try:
        # 确认交易
        updated_transaction = crud.confirm_transaction(
            db=db,
            transaction=db_transaction,
            user_id=current_user.id
        )
        return updated_transaction
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

# =======================================================
# 接口 22：获取我的待确认交易列表
# =======================================================
@app.get("/api/transactions/my-pending",
         response_model=List[schemas.Transaction],
         tags=["Transactions"])
def get_my_pending_transactions(
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    获取当前用户的待确认交易列表
    """
    transactions = crud.get_pending_transactions_for_user(db=db, user_id=current_user.id)
    return transactions

# =======================================================
# 接口 23：获取与帖子有过联系的用户列表（用于选择买家）
# =======================================================
@app.get("/api/posts/{post_id}/contacted-users",
         response_model=List[schemas.User],
         tags=["Posts"])
def get_contacted_users_for_post(
    post_id: int,
    current_user: Annotated[models.User, Depends(get_current_user)],
    db: Session = Depends(get_db)
):
    """
    获取与该帖子有过私信联系的用户列表（用于卖家选择买家）
    """
    # 检查帖子是否存在
    db_post = crud.get_post_by_id(db, post_id=post_id)
    if db_post is None:
        raise HTTPException(status_code=404, detail="帖子未找到")
    
    # 检查是否是帖主
    if db_post.owner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="只有帖主可以查看联系人列表"
        )
    
    # 获取联系过的用户
    users = crud.get_users_who_contacted_post(
        db=db,
        post_id=post_id,
        owner_id=current_user.id
    )
    
    return users