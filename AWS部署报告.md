# 校园交易平台 AWS 部署报告

## 📋 项目概述

**项目名称**: Campus Trade（校园交易平台）  
**技术栈**: 
- 前端：React 18 + TypeScript + Vite + Ant Design
- 后端：FastAPI + Python 3.11 + SQLAlchemy
- 数据库：MySQL 8.0
- 部署平台：AWS (EC2 + RDS + S3)

**部署日期**: 2025年11月4日-5日  
**部署区域**: AWS 东京区域 (ap-northeast-1)

---

## 🏗️ 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────────┐
│                          用户浏览器                               │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ├─────────────────────────────────────┐
                         │                                     │
                         ▼                                     ▼
        ┌────────────────────────────┐         ┌──────────────────────────┐
        │   S3 静态网站托管 (前端)     │         │   EC2 实例 (后端服务)      │
        │                            │         │                          │
        │  React + TypeScript        │         │  FastAPI + Nginx         │
        │  Bucket: campus-trade-     │         │  IP: 13.159.19.120       │
        │  frontend-1762266094       │         │  实例类型: t2.micro       │
        │                            │         │                          │
        │  访问 URL:                  │         │  端口配置:                │
        │  http://campus-trade-      │         │  - 80 (Nginx)            │
        │  frontend-1762266094.      │         │  - 8000 (FastAPI)        │
        │  s3-website-ap-northeast-  │         │  - 22 (SSH)              │
        │  1.amazonaws.com           │         │                          │
        └────────────────────────────┘         └──────────┬───────────────┘
                                                          │
                                                          ▼
                                               ┌──────────────────────────┐
                                               │   RDS MySQL 数据库        │
                                               │                          │
                                               │  引擎: MySQL 8.0         │
                                               │  实例类型: db.t3.micro    │
                                               │  存储: 20GB SSD          │
                                               │  区域: ap-northeast-1    │
                                               └──────────────────────────┘
```

### 请求流程

```
1. 用户访问 S3 网站 URL
   ↓
2. S3 返回前端静态文件 (HTML/CSS/JS)
   ↓
3. 前端 JavaScript 向 EC2 后端发起 API 请求
   http://13.159.19.120/api/xxx
   ↓
4. Nginx 接收请求 (端口 80)
   ↓
5. Nginx 反向代理到 FastAPI (端口 8000)
   ↓
6. FastAPI 处理业务逻辑
   ↓
7. FastAPI 查询/更新 RDS MySQL 数据库
   ↓
8. 返回 JSON 响应给前端
   ↓
9. 前端渲染数据展示给用户
```

---

## 🚀 部署步骤详解

### 第一阶段：数据库部署 (RDS)

#### 1.1 创建 RDS MySQL 实例

**配置参数**:
- 引擎：MySQL 8.0
- 模板：免费套餐
- 实例标识符：`campus-trade-db`
- 主用户名：`admin`
- 实例类型：`db.t3.micro`
- 存储：20GB 通用型 SSD
- 公开访问：是（用于开发调试）
- VPC 安全组：创建新安全组，开放端口 3306

**AWS CLI 命令**:
```bash
aws rds create-db-instance \
  --db-instance-identifier campus-trade-db \
  --db-instance-class db.t3.micro \
  --engine mysql \
  --engine-version 8.0 \
  --master-username admin \
  --master-user-password <your-password> \
  --allocated-storage 20 \
  --publicly-accessible \
  --region ap-northeast-1
```

#### 1.2 配置安全组

允许来自以下来源的 MySQL 连接 (端口 3306)：
- EC2 实例的安全组
- 本地开发机器的 IP（可选）

#### 1.3 获取数据库连接信息

```bash
aws rds describe-db-instances \
  --db-instance-identifier campus-trade-db \
  --query 'DBInstances[0].Endpoint.Address' \
  --output text
```

记录下数据库端点地址，格式如：
```
campus-trade-db.xxxxxxxxx.ap-northeast-1.rds.amazonaws.com
```

---

### 第二阶段：后端部署 (EC2)

#### 2.1 创建 EC2 实例

**配置参数**:
- AMI：Amazon Linux 2023
- 实例类型：t2.micro
- 密钥对：创建新密钥对并下载 `.pem` 文件
- 安全组配置：
  - SSH (22): 仅你的 IP
  - HTTP (80): 所有来源 (0.0.0.0/0)
  - 自定义 TCP (8000): 所有来源（用于直接访问 API）

**AWS CLI 命令**:
```bash
# 创建密钥对
aws ec2 create-key-pair \
  --key-name campus-trade-key \
  --query 'KeyMaterial' \
  --output text > campus-trade-key.pem

chmod 400 campus-trade-key.pem

# 创建安全组
aws ec2 create-security-group \
  --group-name campus-trade-sg \
  --description "Security group for Campus Trade" \
  --region ap-northeast-1

# 添加入站规则
aws ec2 authorize-security-group-ingress \
  --group-name campus-trade-sg \
  --protocol tcp --port 22 --cidr <your-ip>/32

aws ec2 authorize-security-group-ingress \
  --group-name campus-trade-sg \
  --protocol tcp --port 80 --cidr 0.0.0.0/0

aws ec2 authorize-security-group-ingress \
  --group-name campus-trade-sg \
  --protocol tcp --port 8000 --cidr 0.0.0.0/0
```

#### 2.2 连接到 EC2 实例

```bash
ssh -i campus-trade-key.pem ec2-user@<EC2-公网-IP>
```

#### 2.3 安装系统依赖

```bash
# 更新系统
sudo dnf update -y

# 安装 Python 3.11
sudo dnf install python3.11 python3.11-pip -y

# 安装 Git
sudo dnf install git -y

# 安装 Nginx
sudo dnf install nginx -y

# 安装开发工具
sudo dnf install gcc python3.11-devel -y
```

#### 2.4 部署后端代码

```bash
# 克隆代码仓库
cd /home/ec2-user
git clone https://github.com/<your-username>/campus_trade.git
cd campus_trade

# 创建 Python 虚拟环境
python3.11 -m venv venv
source venv/bin/activate

# 安装 Python 依赖
pip install --upgrade pip
pip install -r requirements.txt

# 注意：需要安装特定版本的 bcrypt 以确保兼容性
pip install 'bcrypt==4.0.1' --force-reinstall
```

#### 2.5 配置环境变量

创建 `.env` 文件：

```bash
nano /home/ec2-user/campus_trade/.env
```

填入以下内容：

```env
DATABASE_URL=mysql+pymysql://admin:<your-password>@<rds-endpoint>:3306/campus_trade
SECRET_KEY=<生成一个安全的随机密钥，至少32字符>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=43200
```

生成安全密钥的方法：
```bash
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
```

#### 2.6 初始化数据库

```bash
# 激活虚拟环境
source /home/ec2-user/campus_trade/venv/bin/activate

# 进入 Python 交互式环境
python3

# 执行数据库初始化
>>> from backend.database import engine, Base
>>> from backend import models
>>> Base.metadata.create_all(bind=engine)
>>> exit()
```

#### 2.7 配置 Systemd 服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/campus_trade.service
```

内容：

```ini
[Unit]
Description=Campus Trade FastAPI Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/home/ec2-user/campus_trade
Environment="PATH=/home/ec2-user/campus_trade/venv/bin"
ExecStart=/home/ec2-user/campus_trade/venv/bin/uvicorn backend.main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=3

[Install]
WantedBy=multi-user.target
```

启动服务：

```bash
# 重新加载 systemd
sudo systemctl daemon-reload

# 启用服务（开机自启）
sudo systemctl enable campus_trade

# 启动服务
sudo systemctl start campus_trade

# 检查状态
sudo systemctl status campus_trade
```

#### 2.8 配置 Nginx 反向代理

创建 Nginx 配置文件：

```bash
sudo nano /etc/nginx/conf.d/campus_trade.conf
```

内容：

```nginx
server {
    listen 80;
    server_name <EC2-公网-IP>;

    # 增加请求体大小限制（用于图片上传）
    client_max_body_size 20M;

    # API 请求代理到后端
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # 超时设置
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # 静态文件（图片、头像等）
    location /static/ {
        alias /home/ec2-user/campus_trade/backend/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 健康检查
    location / {
        proxy_pass http://127.0.0.1:8000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

测试并启动 Nginx：

```bash
# 测试配置
sudo nginx -t

# 启动 Nginx
sudo systemctl start nginx

# 设置开机自启
sudo systemctl enable nginx

# 检查状态
sudo systemctl status nginx
```

#### 2.9 验证后端部署

```bash
# 本地测试
curl http://localhost:8000/

# 外部测试
curl http://<EC2-公网-IP>/
```

---

### 第三阶段：前端部署 (S3)

#### 3.1 创建 S3 存储桶

```bash
# 创建存储桶（注意：存储桶名称必须全局唯一）
aws s3 mb s3://campus-trade-frontend-<随机数字> --region ap-northeast-1

# 例如：
aws s3 mb s3://campus-trade-frontend-1762266094 --region ap-northeast-1
```

#### 3.2 配置存储桶为静态网站

```bash
# 启用静态网站托管
aws s3 website s3://campus-trade-frontend-1762266094/ \
  --index-document index.html \
  --error-document 404.html
```

#### 3.3 设置存储桶策略（公开访问）

创建策略文件 `bucket-policy.json`:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::campus-trade-frontend-1762266094/*"
    }
  ]
}
```

应用策略：

```bash
aws s3api put-bucket-policy \
  --bucket campus-trade-frontend-1762266094 \
  --policy file://bucket-policy.json
```

#### 3.4 配置前端代码

修改 `frontend/src/api/apiService.ts`:

```typescript
export const API_BASE_URL = 'http://<EC2-公网-IP>';  // 例如：http://13.159.19.120
```

修改后端 CORS 配置 `backend/main.py`:

```python
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com",
]
```

**重要**：更新后端 CORS 配置后，需要重启后端服务：

```bash
# 在 EC2 上执行
sudo systemctl restart campus_trade
```

#### 3.5 构建前端

在本地机器上：

```bash
cd frontend

# 安装依赖（如果还没安装）
npm install

# 构建生产版本
npm run build
```

#### 3.6 创建 SPA 路由支持文件

创建 `frontend/public/404.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // SPA 重定向脚本
    // 将路径存储到 sessionStorage，然后重定向到首页
    sessionStorage.setItem('redirectPath', location.pathname);
    location.replace('/');
  </script>
</head>
<body>
  <p>Redirecting...</p>
</body>
</html>
```

修改 `frontend/index.html`，在 `<head>` 中添加：

```html
<script>
  (function() {
    const redirect = sessionStorage.getItem('redirectPath');
    if (redirect && redirect !== '/') {
      sessionStorage.removeItem('redirectPath');
      history.replaceState(null, '', redirect);
    }
  })();
</script>
```

重新构建：

```bash
npm run build
```

#### 3.7 部署到 S3

```bash
# 复制 404.html 到 dist 目录
cp public/404.html dist/

# 上传到 S3
aws s3 sync dist/ s3://campus-trade-frontend-1762266094/ --delete
```

#### 3.8 配置 S3 错误文档

```bash
aws s3api put-bucket-website \
  --bucket campus-trade-frontend-1762266094 \
  --website-configuration '{
    "IndexDocument": {"Suffix": "index.html"},
    "ErrorDocument": {"Key": "404.html"}
  }'
```

#### 3.9 获取网站 URL

```bash
echo "http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com"
```

---

## 🔐 安全配置

### 1. 环境变量管理

**敏感信息**（如数据库密码、密钥）存储在：
- EC2: `/home/ec2-user/campus_trade/.env` 文件
- 权限设置：`chmod 600 .env`
- 不提交到 Git 仓库（已在 `.gitignore` 中）

### 2. 数据库安全

- 使用强密码
- 仅允许 EC2 安全组访问
- 启用自动备份（RDS 默认启用）
- 定期更新 MySQL 版本

### 3. API 安全

- JWT Token 认证
- CORS 限制仅允许特定来源
- 密码使用 bcrypt 加密存储
- Token 过期时间：30天

### 4. 网络安全

**EC2 安全组规则**:
- SSH (22): 仅特定 IP
- HTTP (80): 所有来源（公开服务）
- FastAPI (8000): 所有来源（可选，用于调试）

**RDS 安全组规则**:
- MySQL (3306): 仅 EC2 安全组

---

## 📊 资源配置总结

### AWS 资源清单

| 服务 | 资源 | 配置 | 费用估算 |
|------|------|------|---------|
| EC2 | t2.micro 实例 | 1 vCPU, 1GB RAM | $8.35/月 |
| RDS | db.t3.micro MySQL | 2 vCPU, 1GB RAM, 20GB 存储 | $15.33/月 |
| S3 | 静态网站托管 | 存储 + 请求费用 | $0.50/月 |
| **总计** | | | **约 $24/月** |

*注：费用为东京区域估算，实际费用可能有所不同*

### 关键配置参数

**后端 (EC2)**:
- 工作目录：`/home/ec2-user/campus_trade`
- Python 版本：3.11
- FastAPI 端口：8000
- Nginx 端口：80
- 虚拟环境：`/home/ec2-user/campus_trade/venv`

**前端 (S3)**:
- 存储桶名：`campus-trade-frontend-1762266094`
- 区域：`ap-northeast-1`
- 访问类型：公开读取
- 静态网站托管：已启用

**数据库 (RDS)**:
- 引擎：MySQL 8.0
- 端口：3306
- 字符集：utf8mb4
- 时区：Asia/Tokyo

---

## 🔄 日常运维

### 更新后端代码

```bash
# SSH 到 EC2
ssh -i campus-trade-key.pem ec2-user@<EC2-IP>

# 拉取最新代码
cd /home/ec2-user/campus_trade
git pull

# 如果有依赖更新
source venv/bin/activate
pip install -r requirements.txt

# 重启服务
sudo systemctl restart campus_trade

# 查看日志
sudo journalctl -u campus_trade -f
```

### 更新前端代码

```bash
# 在本地机器上
cd frontend

# 拉取最新代码
git pull

# 重新构建
npm run build

# 复制 404.html
cp public/404.html dist/

# 上传到 S3
aws s3 sync dist/ s3://campus-trade-frontend-1762266094/ --delete
```

### 查看后端日志

```bash
# 查看实时日志
sudo journalctl -u campus_trade -f

# 查看最近 50 行
sudo journalctl -u campus_trade -n 50

# 查看错误日志
sudo journalctl -u campus_trade -p err
```

### 查看 Nginx 日志

```bash
# 访问日志
sudo tail -f /var/log/nginx/access.log

# 错误日志
sudo tail -f /var/log/nginx/error.log
```

### 数据库备份

```bash
# 创建手动快照
aws rds create-db-snapshot \
  --db-instance-identifier campus-trade-db \
  --db-snapshot-identifier campus-trade-backup-$(date +%Y%m%d)
```

### 监控服务状态

```bash
# 检查后端服务
sudo systemctl status campus_trade

# 检查 Nginx
sudo systemctl status nginx

# 检查端口占用
sudo ss -tlnp | grep -E '80|8000'

# 检查磁盘空间
df -h

# 检查内存使用
free -h
```

---

## 🐛 故障排查指南

### 1. 后端服务无法启动

**检查步骤**:
```bash
# 查看详细错误
sudo journalctl -u campus_trade -n 50

# 检查虚拟环境
ls -la /home/ec2-user/campus_trade/venv/bin/uvicorn

# 手动启动测试
cd /home/ec2-user/campus_trade
source venv/bin/activate
uvicorn backend.main:app --host 0.0.0.0 --port 8000
```

**常见问题**:
- `.env` 文件缺失或配置错误
- 数据库连接失败
- 依赖包版本不兼容（特别是 bcrypt）

### 2. 前端无法访问后端

**检查步骤**:
```bash
# 测试后端健康
curl http://<EC2-IP>/

# 检查 CORS 配置
grep -A 5 "origins = " /home/ec2-user/campus_trade/backend/main.py

# 检查 Nginx 配置
sudo nginx -t
```

**常见问题**:
- CORS 未配置 S3 URL
- Nginx 配置错误
- 安全组未开放 80 端口

### 3. 图片无法加载

**检查步骤**:
```bash
# 检查静态文件目录权限
ls -la /home/ec2-user/campus_trade/backend/static/

# 检查 Nginx 静态文件配置
sudo cat /etc/nginx/conf.d/campus_trade.conf | grep -A 3 "location /static"

# 测试图片访问
curl -I http://<EC2-IP>/static/images/test.jpg
```

### 4. 数据库连接问题

**检查步骤**:
```bash
# 测试数据库连接
cd /home/ec2-user/campus_trade
source venv/bin/activate
python3 -c "
from backend.database import engine
from sqlalchemy import text
with engine.connect() as conn:
    result = conn.execute(text('SELECT 1'))
    print('数据库连接成功')
"
```

**常见问题**:
- `.env` 中的数据库 URL 错误
- RDS 安全组未允许 EC2 访问
- 网络连接问题

---

## 📈 性能优化建议

### 1. 数据库优化

- 为常用查询字段添加索引
- 使用连接池（SQLAlchemy 默认启用）
- 定期分析慢查询日志
- 考虑升级实例类型（如需要）

### 2. 后端优化

- 使用 Uvicorn workers：`--workers 4`
- 启用 Gzip 压缩
- 实现 API 响应缓存
- 添加 CDN 加速静态资源

### 3. 前端优化

- 代码分割（dynamic import）
- 图片懒加载
- 使用 CloudFront CDN
- 启用浏览器缓存

### 4. 成本优化

- 使用 Reserved Instances（预留实例）
- 配置 S3 生命周期策略
- 监控并优化数据传输
- 定期清理未使用的快照

---

## 🎯 后续改进方向

### 短期 (1-2周)

- [ ] 配置 CloudFront CDN 加速前端访问
- [ ] 启用 HTTPS（使用 Let's Encrypt）
- [ ] 添加监控告警（CloudWatch）
- [ ] 实现自动化部署脚本

### 中期 (1-2月)

- [ ] 使用 ECS/EKS 容器化部署
- [ ] 实现 CI/CD 流水线（GitHub Actions）
- [ ] 添加日志聚合系统（ELK）
- [ ] 配置自动扩缩容

### 长期 (3-6月)

- [ ] 多可用区部署（高可用）
- [ ] 实现数据备份和灾难恢复
- [ ] 性能测试和压力测试
- [ ] 迁移到自定义域名

---

## 📚 相关文档和资源

### AWS 官方文档

- [EC2 用户指南](https://docs.aws.amazon.com/ec2/)
- [RDS MySQL 文档](https://docs.aws.amazon.com/rds/)
- [S3 静态网站托管](https://docs.aws.amazon.com/s3/static-website/)

### 技术栈文档

- [FastAPI 文档](https://fastapi.tiangolo.com/)
- [React 官方文档](https://react.dev/)
- [SQLAlchemy ORM](https://www.sqlalchemy.org/)
- [Nginx 文档](https://nginx.org/en/docs/)

### 工具和命令

- [AWS CLI 参考](https://awscli.amazonaws.com/v2/documentation/api/latest/index.html)
- [systemd 服务管理](https://www.freedesktop.org/software/systemd/man/systemd.service.html)

---

## 📝 总结

本次部署成功将校园交易平台部署到 AWS 云平台，实现了：

✅ **前后端分离架构** - 前端托管在 S3，后端运行在 EC2  
✅ **数据持久化** - 使用 RDS MySQL 托管数据库  
✅ **生产级配置** - Nginx 反向代理、systemd 服务管理  
✅ **安全性保障** - JWT 认证、CORS 配置、安全组隔离  
✅ **可扩展性** - 云原生架构，易于水平扩展

**关键成果**:
- 前端访问 URL: `http://campus-trade-frontend-1762266094.s3-website-ap-northeast-1.amazonaws.com`
- 后端 API: `http://13.159.19.120`
- 数据库: RDS MySQL 8.0 (私有网络访问)

**部署特点**:
- 成本控制：使用免费套餐和低成本实例
- 稳定可靠：24/7 运行，自动重启
- 易于维护：完整的日志和监控
- 快速迭代：支持代码热更新

---

**编写日期**: 2025年11月5日  
**版本**: v1.0  
**作者**: Campus Trade 团队
