# 本地PostgreSQL数据库配置指南

> **当前状态**: 代码连接到远程K8s数据库
> **目标**: 切换到本地PostgreSQL数据库

---

## 📌 当前数据库连接

```javascript
// backend/server.js 第18行
const dbConnectionString = 'postgresql://postgres:2q257fhj@blueprint-db-postgresql.ns-3cnjew51.svc:5432';
```

这是一个Kubernetes集群内的数据库，你无法从本地访问。

---

## 🔧 本地PostgreSQL配置步骤

### 第1步：确认PostgreSQL安装

打开命令行（CMD或PowerShell），输入：

```bash
psql --version
```

应该显示类似：`psql (PostgreSQL) 16.x`

如果没有安装，下载安装：https://www.postgresql.org/download/windows/

---

### 第2步：创建数据库和用户

#### 方案A：使用pgAdmin图形界面（推荐）

1. 打开pgAdmin（安装PostgreSQL时自动安装）
2. 连接到本地服务器（localhost）
3. 右键 `Databases` → `Create` → `Database...`
   - Database name: `operations_research`
   - Owner: `postgres`
   - 点击 `Save`

#### 方案B：使用命令行

```bash
# 1. 以postgres用户登录
psql -U postgres

# 2. 创建数据库
CREATE DATABASE operations_research;

# 3. 连接到新数据库
\c operations_research

# 4. 退出
\q
```

---

### 第3步：创建数据表结构

创建SQL脚本文件：

**文件**: `backend/init-database.sql`

```sql
-- 切换到operations_research数据库
\c operations_research;

-- 1. 创建用户表
CREATE TABLE IF NOT EXISTS Users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    student_id VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 创建阶段1成绩表
CREATE TABLE IF NOT EXISTS Phase1Results (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES Users(id) UNIQUE,
    is_passed BOOLEAN DEFAULT FALSE,
    score INTEGER DEFAULT 0,
    final_duration INTEGER,
    submit_attempts INTEGER DEFAULT 0,
    passed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 创建阶段2提交表
CREATE TABLE IF NOT EXISTS Submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    track VARCHAR(20) NOT NULL CHECK (track IN ('cost', 'time', 'weighted')),
    score NUMERIC NOT NULL,
    project_duration INTEGER NOT NULL,
    total_cost NUMERIC NOT NULL,
    details JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, track)
);

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_phase1_user ON Phase1Results(user_id);
CREATE INDEX IF NOT EXISTS idx_submissions_track ON Submissions(track, score);

-- 5. 插入测试用户数据
INSERT INTO Users (name, student_id) VALUES
    ('张三', '2021001'),
    ('李四', '2021002'),
    ('王五', '2021003'),
    ('赵六', '2021004'),
    ('钱七', '2021005')
ON CONFLICT (student_id) DO NOTHING;

-- 6. 验证数据
SELECT * FROM Users;
SELECT * FROM Phase1Results;
SELECT * FROM Submissions;
```

---

### 第4步：执行SQL脚本

#### 方案A：使用pgAdmin

1. 在pgAdmin中，右键 `operations_research` 数据库
2. 选择 `Query Tool`
3. 复制 `init-database.sql` 的内容
4. 点击 `Execute` (F5)

#### 方案B：使用命令行

```bash
# 进入backend目录
cd project-blueprint/backend

# 执行SQL脚本
psql -U postgres -d operations_research -f init-database.sql
```

**预期输出**:
```
CREATE TABLE
CREATE TABLE
CREATE TABLE
CREATE INDEX
INSERT 0 5
```

---

### 第5步：修改backend连接字符串

#### 修改 `backend/server.js`

找到第18-19行，替换为：

```javascript
// --- 数据库连接池 ---
// 旧代码（注释掉）：
// const dbConnectionString = 'postgresql://postgres:2q257fhj@blueprint-db-postgresql.ns-3cnjew51.svc:5432';

// 新代码（本地数据库）：
const dbConnectionString = process.env.DATABASE_URL ||
  'postgresql://postgres:你的密码@localhost:5432/operations_research';

const pool = new Pool({ connectionString: dbConnectionString });
```

**替换你的密码**：将 `你的密码` 改为你安装PostgreSQL时设置的密码。

#### 使用环境变量（推荐方式）

创建文件 `backend/.env`：

```env
DATABASE_URL=postgresql://postgres:你的密码@localhost:5432/operations_research
JWT_SECRET=your-super-secret-key-for-dev
PORT=8080
```

然后修改 `server.js`：

```javascript
require('dotenv').config(); // 在文件顶部添加

const PORT = process.env.PORT || 8080;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key-for-dev';
const dbConnectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString: dbConnectionString });
```

---

### 第6步：测试数据库连接

在 `server.js` 启动代码中添加连接测试：

找到文件末尾的 `server.listen` 部分，替换为：

```javascript
// --- 启动服务器 ---
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`Server running at http://0.0.0.0:${PORT}/`);

  // 测试数据库连接
  try {
    const result = await pool.query('SELECT NOW()');
    console.log('✅ 数据库连接成功！当前时间:', result.rows[0].now);

    const userCount = await pool.query('SELECT COUNT(*) FROM Users');
    console.log(`📊 当前用户数: ${userCount.rows[0].count}`);
  } catch (err) {
    console.error('❌ 数据库连接失败:', err.message);
    console.error('请检查:');
    console.error('1. PostgreSQL服务是否启动');
    console.error('2. 数据库连接字符串是否正确');
    console.error('3. 数据库和表是否已创建');
  }
});
```

---

### 第7步：启动后端服务

```bash
cd project-blueprint/backend
node server.js
```

**成功输出示例**:
```
Server running at http://0.0.0.0:8080/
✅ 数据库连接成功！当前时间: 2025-10-07 23:45:00.123+08
📊 当前用户数: 5
```

**失败示例**（需要排查）:
```
❌ 数据库连接失败: password authentication failed for user "postgres"
```

---

## 🧪 验证数据库设置

### 测试1：查看所有表

```bash
psql -U postgres -d operations_research
```

```sql
-- 列出所有表
\dt

-- 应该显示:
--  public | users          | table | postgres
--  public | phase1results  | table | postgres
--  public | submissions    | table | postgres
```

### 测试2：查看用户数据

```sql
SELECT * FROM Users;
```

应该显示5个测试用户。

### 测试3：测试登录API

使用Postman或浏览器：

```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "name": "张三",
  "studentId": "2021001"
}
```

**成功响应**:
```json
{
  "message": "Login successful!",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "currentPhase": 1
}
```

---

## ⚠️ 常见问题

### 问题1: 找不到psql命令

**原因**: PostgreSQL的bin目录未添加到PATH

**解决**:
1. 找到PostgreSQL安装目录（通常是 `C:\Program Files\PostgreSQL\16\bin`）
2. 右键 `此电脑` → `属性` → `高级系统设置` → `环境变量`
3. 编辑 `Path`，添加bin目录路径
4. 重启命令行

### 问题2: 密码认证失败

**原因**: PostgreSQL密码不正确

**解决**:
1. 重置postgres用户密码：
```bash
psql -U postgres
ALTER USER postgres PASSWORD '新密码';
```

2. 或修改 `pg_hba.conf`，将认证方式改为 `trust`（仅本地开发）:
```
# 找到这一行
host    all             all             127.0.0.1/32            md5

# 改为
host    all             all             127.0.0.1/32            trust
```

3. 重启PostgreSQL服务：
```bash
# Windows服务管理器中重启 postgresql-x64-16
```

### 问题3: 连接被拒绝

**原因**: PostgreSQL服务未启动

**解决**:
1. 打开 `服务` (Win+R → `services.msc`)
2. 找到 `postgresql-x64-16`
3. 右键 → `启动`

### 问题4: 数据库不存在

**错误**: `database "operations_research" does not exist`

**解决**: 回到第2步重新创建数据库

---

## 📋 完整配置检查清单

- [ ] PostgreSQL已安装并启动
- [ ] 数据库 `operations_research` 已创建
- [ ] 表结构已执行（Users, Phase1Results, Submissions）
- [ ] 测试用户已插入
- [ ] `backend/server.js` 连接字符串已修改
- [ ] `backend/.env` 文件已创建（推荐）
- [ ] 后端服务启动成功并显示数据库连接成功
- [ ] 登录API测试通过

---

## 🎯 快速配置脚本（Windows PowerShell）

如果你想一键完成，创建并运行这个脚本：

**文件**: `backend/setup-local-db.ps1`

```powershell
# 检查PostgreSQL
if (!(Get-Command psql -ErrorAction SilentlyContinue)) {
    Write-Host "❌ PostgreSQL未安装或未添加到PATH" -ForegroundColor Red
    exit 1
}

Write-Host "✅ PostgreSQL已安装" -ForegroundColor Green

# 创建数据库
Write-Host "创建数据库..." -ForegroundColor Yellow
psql -U postgres -c "CREATE DATABASE operations_research;" 2>$null

# 执行SQL脚本
Write-Host "初始化数据表..." -ForegroundColor Yellow
psql -U postgres -d operations_research -f init-database.sql

Write-Host "✅ 数据库配置完成！" -ForegroundColor Green
Write-Host "请修改 server.js 中的数据库连接字符串" -ForegroundColor Cyan
```

运行：
```powershell
cd project-blueprint/backend
.\setup-local-db.ps1
```

---

**下一步**: 完成数据库配置后，继续按照 `IMPLEMENTATION_GUIDE.md` 创建前端组件。

**需要帮助?** 告诉我你遇到的具体错误信息！
