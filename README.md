# 校园二手交易平台 🛒

一个基于 FastAPI + React + TypeScript 的现代化校园二手商品交易平台，已部署在 AWS 云端。

## 🌐 在线访问

- **前端地址**: [http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com](http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com)
- **后端 API**: http://13.159.19.120
- **API 文档**: http://13.159.19.120/docs

## ✨ 功能特性

- 🔐 用户注册/登录（JWT Token 认证）
- 📝 商品发布与管理（支持多图上传）
- 💬 即时消息聊天系统
- ⭐ 收藏功能
- 💰 交易管理与订单跟踪
- 👤 个人主页与资料编辑
- 🔍 商品搜索与分类筛选
- 📊 举报管理系统
- 🖼️ 图片上传与展示

## 🛠️ 技术栈

### 后端
- **框架**: FastAPI (Python 3.11)
- **ORM**: SQLAlchemy
- **数据库**: MySQL 8.0 (AWS RDS)
- **认证**: JWT (python-jose)
- **密码加密**: Bcrypt 4.0.1 + Passlib
- **Web 服务器**: Nginx + Uvicorn
- **进程管理**: Systemd

### 前端
- **框架**: React 18
- **语言**: TypeScript
- **构建工具**: Vite
- **UI 组件**: Ant Design
- **路由**: React Router v6
- **HTTP 客户端**: Axios
- **状态管理**: React Context API
- **样式**: CSS3 + CSS Modules

### 部署架构
- **云服务**: AWS (ap-northeast-1 东京区域)
- **计算**: EC2 (Amazon Linux 2023)
- **数据库**: RDS MySQL
- **存储**: S3 (静态网站托管)
- **反向代理**: Nginx

## 📁 项目结构

```
campus_trade/
├── backend/              # 后端代码
│   ├── main.py          # FastAPI 应用入口
│   ├── models.py        # SQLAlchemy 数据库模型
│   ├── schemas.py       # Pydantic 数据验证模型
│   ├── crud.py          # 数据库 CRUD 操作
│   ├── security.py      # JWT 认证与加密
│   ├── database.py      # 数据库连接配置
│   ├── config.py        # 应用配置
│   └── static/          # 静态文件存储
│       ├── avatars/     # 用户头像
│       └── images/      # 商品图片
├── frontend/            # 前端代码
│   ├── src/
│   │   ├── api/         # API 服务封装
│   │   │   ├── apiService.ts      # Axios 配置
│   │   │   ├── userService.ts     # 用户 API
│   │   │   ├── postService.ts     # 商品 API
│   │   │   ├── messageService.ts  # 消息 API
│   │   │   ├── transactionService.ts  # 交易 API
│   │   │   └── reportService.ts   # 举报 API
│   │   ├── components/  # React 组件
│   │   │   ├── Layout/          # 布局组件
│   │   │   └── PostCard/        # 商品卡片组件
│   │   ├── pages/       # 页面组件
│   │   │   ├── HomePage.tsx           # 首页
│   │   │   ├── LoginPage.tsx          # 登录页
│   │   │   ├── RegisterPage.tsx       # 注册页
│   │   │   ├── PostDetailPage.tsx     # 商品详情
│   │   │   ├── CreatePostPage.tsx     # 发布商品
│   │   │   ├── EditPostPage.tsx       # 编辑商品
│   │   │   ├── ProfilePage.tsx        # 个人主页
│   │   │   ├── UserProfilePage.tsx    # 用户主页
│   │   │   ├── FavoritesPage.tsx      # 收藏列表
│   │   │   ├── InboxPage.tsx          # 收件箱
│   │   │   ├── ConversationPage.tsx   # 对话页
│   │   │   └── TransactionsPage.tsx   # 交易记录
│   │   ├── context/     # React Context
│   │   │   └── AuthContext.tsx  # 认证上下文
│   │   ├── hooks/       # 自定义 Hooks
│   │   │   └── useAuth.ts       # 认证 Hook
│   │   ├── router/      # 路由配置
│   │   │   └── AppRouter.tsx
│   │   ├── types/       # TypeScript 类型定义
│   │   └── utils/       # 工具函数
│   │       └── cache.ts         # 缓存工具
│   └── public/          # 公共资源
├── AWS部署报告.md       # AWS 部署文档
├── 需求文档.md          # 项目需求文档
└── README.md           # 项目说明文档
```

## 🚀 快速开始

### 环境要求

- **Python**: 3.11+
- **Node.js**: 16+
- **MySQL**: 8.0+
- **包管理器**: npm 或 yarn

### 本地开发环境

#### 1️⃣ 后端设置

```bash
# 进入后端目录
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install fastapi uvicorn sqlalchemy pymysql python-multipart python-jose[cryptography] passlib[bcrypt] python-dotenv cryptography 'bcrypt==4.0.1'

# 创建 .env 配置文件
cat > .env << EOF
DATABASE_URL=mysql+pymysql://username:password@localhost:3306/campus_trade
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
EOF

# 启动后端服务
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

后端服务将运行在 http://localhost:8000

#### 2️⃣ 前端设置

```bash
# 进入前端目录
cd frontend

# 安装依赖
npm install

# 配置 API 地址（开发环境）
# 编辑 src/api/apiService.ts，修改 API_BASE_URL

# 启动开发服务器
npm run dev
```

前端服务将运行在 http://localhost:5173

### 生产环境部署

详细的 AWS 部署指南请参考 [AWS部署报告.md](./AWS部署报告.md)，包含：

- **基础设施配置**: RDS、EC2、S3 配置步骤
- **后端部署**: Systemd + Nginx 配置
- **前端部署**: S3 静态网站托管
- **安全配置**: 安全组、CORS、密钥管理
- **运维指南**: 日志查看、服务管理、数据备份
- **故障排查**: 常见问题解决方案

## 📚 API 文档

启动后端服务后，访问以下地址查看 API 文档：

- **Swagger UI**: http://localhost:8000/docs (本地) / http://13.159.19.120/docs (生产)
- **ReDoc**: http://localhost:8000/redoc (本地) / http://13.159.19.120/redoc (生产)

### 主要 API 端点

#### 认证相关
- `POST /api/register` - 用户注册
- `POST /api/login` - 用户登录
- `GET /api/users/me` - 获取当前用户信息

#### 商品相关
- `GET /api/posts` - 获取商品列表（支持分页、筛选）
- `POST /api/posts` - 发布商品
- `GET /api/posts/{post_id}` - 获取商品详情
- `PUT /api/posts/{post_id}` - 更新商品信息
- `DELETE /api/posts/{post_id}` - 删除商品

#### 消息相关
- `GET /api/messages/inbox` - 获取收件箱
- `GET /api/messages/conversation/{other_user_id}` - 获取对话
- `POST /api/messages` - 发送消息

#### 交易相关
- `GET /api/transactions/me` - 获取我的交易
- `POST /api/transactions` - 创建交易
- `PUT /api/transactions/{transaction_id}/confirm` - 确认收货

## 🎯 主要功能

### 用户功能
- ✅ 用户注册与登录（JWT Token 认证）
- ✅ 个人信息编辑（用户名、电话、学号等）
- ✅ 头像上传与更新
- ✅ 查看个人主页与发布历史
- ✅ 查看其他用户主页

### 商品功能
- ✅ 发布商品（支持多图上传，最多 5 张）
- ✅ 编辑商品信息（标题、价格、描述等）
- ✅ 删除商品
- ✅ 标记商品已售出
- ✅ 商品搜索（关键词搜索）
- ✅ 商品分类筛选（电子产品、书籍、服装等）
- ✅ 收藏/取消收藏商品
- ✅ 查看收藏列表
- ✅ 商品图片轮播展示

### 消息功能
- ✅ 实时聊天系统
- ✅ 查看收件箱（显示最新对话）
- ✅ 查看完整对话历史
- ✅ 发送消息给卖家
- ✅ 未读消息标识

### 交易功能
- ✅ 创建交易订单
- ✅ 确认收货
- ✅ 查看我的购买记录
- ✅ 查看我的销售记录
- ✅ 交易状态跟踪

### 举报功能
- ✅ 举报商品
- ✅ 举报用户
- ✅ 举报消息
- ✅ 查看举报记录

## 💻 开发说明

### 后端开发

#### 技术要点
- 使用 **SQLAlchemy ORM** 进行数据库操作
- **JWT Token** 进行身份认证，Token 有效期 30 分钟
- 支持图片上传功能（头像、商品图片）
- **CORS** 已配置允许跨域请求
- 使用 **Pydantic** 进行数据验证
- **Bcrypt 4.0.1** 进行密码加密（注意版本兼容性）

#### 关键配置
```python
# database.py - 数据库连接
SQLALCHEMY_DATABASE_URL = "mysql+pymysql://user:pass@host:3306/db"

# security.py - JWT 配置
SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# main.py - CORS 配置
origins = [
    "http://localhost:5173",  # 本地开发
    "http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com"  # 生产环境
]
```

#### 数据库模型
- **User**: 用户表（用户名、密码、头像等）
- **Post**: 商品表（标题、价格、描述、图片等）
- **Message**: 消息表（发送者、接收者、内容等）
- **Transaction**: 交易表（买家、卖家、商品、状态等）
- **Favorite**: 收藏表（用户、商品关联）
- **Report**: 举报表（举报者、被举报对象、原因等）

### 前端开发

#### 技术要点
- 使用 **TypeScript** 进行静态类型检查
- **React Context API** 管理全局用户状态
- **localStorage** 缓存用户认证信息
- **Axios** 拦截器处理请求认证和错误
- 响应式设计，适配桌面和移动端
- **SPA 路由**，支持前端路由刷新

#### 核心配置
```typescript
// apiService.ts - API 配置
export const API_BASE_URL = 'http://13.159.19.120';  // 生产环境
// export const API_BASE_URL = 'http://localhost:8000';  // 本地开发

// 图片 URL 处理（兼容相对路径和完整 URL）
const imageUrl = url.startsWith('http') ? url : API_BASE_URL + url;
```

#### 状态管理
- **AuthContext**: 全局用户认证状态
- **localStorage**: 持久化 Token 和用户信息
- **useAuth Hook**: 封装认证逻辑

#### 路由保护
```typescript
// 受保护的路由需要登录才能访问
<Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />
```

## 🚢 部署

### AWS 云端部署

本项目已成功部署在 AWS 云平台，完整部署文档请参考 [AWS部署报告.md](./AWS部署报告.md)

#### 部署架构
```
┌─────────────────────────────────────────────────────────┐
│                    用户浏览器                              │
└────────────┬────────────────────────────┬────────────────┘
             │                            │
             ↓                            ↓
┌────────────────────────┐    ┌──────────────────────────┐
│   S3 静态网站托管       │    │   EC2 (Nginx + FastAPI)  │
│  React 前端应用         │───→│   后端 API 服务           │
└────────────────────────┘    └───────────┬──────────────┘
                                          │
                                          ↓
                              ┌───────────────────────┐
                              │   RDS MySQL 8.0       │
                              │   数据库服务           │
                              └───────────────────────┘
```

#### 部署步骤概览

1. **数据库层**: RDS MySQL 配置
2. **后端层**: EC2 + Systemd + Nginx
3. **前端层**: S3 静态网站托管
4. **安全配置**: 安全组、CORS、密钥管理

#### 快速部署命令

**后端部署**（在 EC2 上）：
```bash
# 安装依赖
pip install -r requirements.txt

# 配置环境变量
echo "DATABASE_URL=mysql+pymysql://..." > .env

# 配置 Systemd 服务
sudo systemctl start campus_trade
sudo systemctl enable campus_trade

# 配置 Nginx
sudo systemctl restart nginx
```

**前端部署**：
```bash
# 构建生产版本
cd frontend
npm run build

# 上传到 S3
aws s3 sync dist/ s3://campus-trade-frontend-1762266094/ --delete
```

#### 监控与维护

```bash
# 查看后端日志
sudo journalctl -u campus_trade -f

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 重启服务
sudo systemctl restart campus_trade
sudo systemctl restart nginx
```

## ⚠️ 注意事项

### 安全相关
- ⚠️ 生产环境必须修改 `.env` 中的 `SECRET_KEY`（建议使用随机生成的 64 位字符串）
- ⚠️ 不要将 `.env` 文件提交到版本控制系统
- ⚠️ 生产环境建议配置 HTTPS（可使用 AWS Certificate Manager + CloudFront）
- ⚠️ RDS 数据库应配置在私有子网，只允许 EC2 访问
- ⚠️ EC2 安全组仅开放必要端口（80, 443, 22）

### 数据库相关
- 💡 开发环境可使用 SQLite，生产环境建议使用 MySQL 或 PostgreSQL
- 💡 定期备份数据库（RDS 支持自动备份）
- 💡 建议为数据库配置读写分离以提高性能

### 文件上传相关
- 💡 当前图片存储在 EC2 本地（`backend/static/`）
- 💡 生产环境建议使用对象存储服务（AWS S3）存储图片
- 💡 限制上传文件大小（当前限制 5MB）
- 💡 限制上传文件类型（仅允许图片格式）

### 性能优化
- 💡 前端建议配置 CDN（CloudFront）加速访问
- 💡 后端 API 可添加 Redis 缓存层
- 💡 数据库查询建议添加索引优化
- 💡 图片建议压缩和使用 WebP 格式

### 依赖版本
- ⚠️ **重要**: 必须使用 `bcrypt==4.0.1`，更高版本与 `passlib` 不兼容
- 💡 定期更新依赖包以修复安全漏洞
- 💡 Python 版本建议使用 3.11+（类型提示支持更好）

### 开发建议
- 💡 使用虚拟环境隔离 Python 依赖
- 💡 前端开发时建议使用 ESLint 和 Prettier
- 💡 提交代码前运行类型检查和代码格式化
- 💡 建议编写单元测试和集成测试

## 📖 相关文档

- [AWS部署报告.md](./AWS部署报告.md) - 完整的 AWS 云端部署指南
- [需求文档.md](./需求文档.md) - 项目需求和功能规格说明
- [backend_dev_report.md](./backend_dev_report.md) - 后端开发报告
- [frontend_dev_report.md](./frontend_dev_report.md) - 前端开发报告

## 🔧 常见问题

### Q1: 登录时提示 500 错误？
**A**: 检查 bcrypt 版本，必须使用 4.0.1 版本：
```bash
pip install 'bcrypt==4.0.1' --force-reinstall
```

### Q2: 图片上传后无法显示？
**A**: 检查图片 URL 拼接逻辑，确保正确处理相对路径和完整 URL：
```typescript
const imageUrl = url.startsWith('http') ? url : API_BASE_URL + url;
```

### Q3: 前端刷新页面后 404？
**A**: S3 静态网站需要配置错误文档重定向到 `index.html`

### Q4: CORS 错误？
**A**: 检查后端 `main.py` 的 CORS 配置，确保包含前端域名

### Q5: 数据库连接失败？
**A**: 检查：
- RDS 安全组是否允许 EC2 访问
- 数据库连接字符串是否正确
- 数据库用户名密码是否正确

## 🎓 学习资源

- [FastAPI 官方文档](https://fastapi.tiangolo.com/)
- [React 官方文档](https://react.dev/)
- [TypeScript 官方文档](https://www.typescriptlang.org/)
- [AWS 官方文档](https://docs.aws.amazon.com/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)

## 📊 项目统计

- **后端代码**: ~2000 行 Python
- **前端代码**: ~3000 行 TypeScript/React
- **API 端点**: 30+ 个
- **页面数量**: 12 个主要页面
- **组件数量**: 15+ 个可复用组件

## 🗺️ 未来规划

- [ ] 添加 HTTPS 支持（CloudFront + ACM）
- [ ] 实现 WebSocket 实时消息推送
- [ ] 添加图片 CDN 加速
- [ ] 实现 Redis 缓存层
- [ ] 添加 Elasticsearch 全文搜索
- [ ] 实现 CI/CD 自动化部署
- [ ] 添加单元测试和集成测试
- [ ] 实现移动端 App（React Native）
- [ ] 添加支付功能集成
- [ ] 实现商品推荐算法

## 📄 License

MIT License - 详见 [LICENSE](./LICENSE) 文件

## 👨‍💻 作者

开发者：cty-ut

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

### 贡献指南

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📞 联系方式

如有问题或建议，欢迎通过 GitHub Issues 联系。

---

⭐ 如果这个项目对你有帮助，欢迎 Star！
