from passlib.context import CryptContext
from .config import settings
from datetime import datetime, timedelta
from jose import JWTError, jwt


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

SECRET_KEY = settings.SECRET_KEY      # 秘密密钥 
ALGORITHM = "HS256"                 # 加密算法
ACCESS_TOKEN_EXPIRE_MINUTES = 2440    # Token 有效期 

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    """
    创建 JWT Access Token (制造身份证)
    
    参数:
    data: 要存在 Token 里的数据。我们会传入 {"sub": "user@email.com"}
    """
    to_encode = data.copy()
    
    # 设置过期时间
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        # 默认使用 30 分钟
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # 把过期时间也加入到 Token 内容中
    to_encode.update({"exp": expire})
    
    # --- 制造 Token ---
    # 使用 秘密密钥(公章) 和 算法 来“签名”
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    
    return encoded_jwt

def decode_access_token(token: str) -> str | None:
    """
    (这个函数我们下一个任务B会用到)
    解码 Access Token, 提取用户名 (email)
    """
    try:
        # 使用 秘密密钥(公章) 来验证“签名”并解码
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # 提取 "sub" (subject)，也就是我们的 email
        username: str = payload.get("sub")
        if username is None:
            return None # Token 格式不对
        return username
    except JWTError:
        # 如果 Token 签名不对 或 已过期，jwt.decode 会抛出错误
        return None