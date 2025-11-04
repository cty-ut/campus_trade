# 校园二手交易平台

一个基于 FastAPI + React + TypeScript 的校园二手商品交易平台。

## 功能特性

- 🔐 用户注册/登录
- 📝 商品发布与管理
- 💬 即时消息聊天
- ⭐ 收藏功能
- 💰 交易管理
- 👤 个人主页
- 🔍 商品搜索与筛选
- 📊 举报管理

## 技术栈

### 后端
- FastAPI - Python Web 框架
- SQLAlchemy - ORM
- SQLite - 数据库
- JWT - 身份认证
- Bcrypt - 密码加密

### 前端
- React 18
- TypeScript
- Vite - 构建工具
- React Router - 路由管理
- CSS3 - 样式

## 项目结构

```
├── backend/           # 后端代码
│   ├── main.py       # FastAPI 应用入口
│   ├── models.py     # 数据库模型
│   ├── schemas.py    # Pydantic 模型
│   ├── crud.py       # 数据库操作
│   ├── security.py   # 安全相关
│   ├── config.py     # 配置文件
│   └── static/       # 静态文件（图片、头像）
├── frontend/         # 前端代码
│   ├── src/
│   │   ├── api/      # API 服务
│   │   ├── components/ # 组件
│   │   ├── pages/    # 页面
│   │   ├── context/  # Context
│   │   ├── hooks/    # 自定义 Hooks
│   │   ├── router/   # 路由配置
│   │   ├── types/    # TypeScript 类型
│   │   └── utils/    # 工具函数
│   └── public/       # 公共资源
└── deploy/           # 部署脚本
```

## 快速开始

### 环境要求

- Python 3.8+
- Node.js 16+
- npm 或 yarn

### 后端设置

1. 进入后端目录：
```bash
cd backend
```

2. 创建虚拟环境：
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
```

3. 安装依赖：
```bash
pip install fastapi uvicorn sqlalchemy python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv
```

4. 创建 `.env` 配置文件：
```bash
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
```

5. 启动后端服务：
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将运行在 http://localhost:8000

### 前端设置

1. 进入前端目录：
```bash
cd frontend
```

2. 安装依赖：
```bash
npm install
```

3. 启动开发服务器：
```bash
npm run dev
```

前端服务将运行在 http://localhost:5173

## API 文档

启动后端服务后，访问以下地址查看 API 文档：
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## 主要功能

### 用户功能
- 注册/登录/退出
- 个人信息编辑
- 头像上传
- 查看个人主页

### 商品功能
- 发布商品
- 编辑商品
- 删除商品
- 标记已售出
- 搜索商品
- 按类别筛选
- 收藏商品

### 消息功能
- 实时聊天
- 查看收件箱
- 查看对话历史

### 交易功能
- 创建交易
- 确认收货
- 查看交易记录

## 开发说明

### 后端开发
- 使用 SQLAlchemy ORM 进行数据库操作
- JWT Token 进行身份认证
- 支持图片上传功能
- CORS 已配置允许跨域请求

### 前端开发
- 使用 TypeScript 进行类型检查
- React Context 管理用户状态
- localStorage 缓存用户数据
- 响应式设计适配移动端

## 部署

查看 `deploy/deploy.sh` 脚本了解部署流程。

## 注意事项

- 生产环境请修改 `.env` 中的 `SECRET_KEY`
- 建议使用 PostgreSQL 或 MySQL 替换 SQLite
- 图片上传建议使用对象存储服务（如 OSS）
- 生产环境需配置 HTTPS

## License

MIT

## 作者

[你的名字]

## 贡献

欢迎提交 Issue 和 Pull Request！
