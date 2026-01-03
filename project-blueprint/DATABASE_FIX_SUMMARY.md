# 数据库SQL初始化语句检查报告

## ✅ 检查结果：发现并修复了3个问题

---

## 问题1：排行榜重复计算间接费用（已修复）

### 问题描述
**严重程度**: 🔴 严重

server.js 的排行榜API在查询时重复计算了间接费用：
```javascript
// ❌ 错误代码（已修复）
const DAILY_INDIRECT_COST = 1000;  // 错误的费用标准
const query = `
    SELECT (s.total_cost + (s.project_duration * $1))::NUMERIC AS lifecycle_cost
    ...
`;
```

**问题**：
1. `total_cost` 字段已经包含了间接费用（前端提交时计算）
2. 后端又加了一次间接费用，导致重复计算
3. 使用的费用标准还是错误的1,000元/天（应该是12,000元/天）

### 修复方案
**文件**: `backend/server.js` 第103-131行

```javascript
// ✅ 修复后代码
const query = `
    SELECT
        u.name,
        s.project_duration,
        s.direct_cost,  -- 直接成本
        s.total_cost AS lifecycle_cost,  -- total_cost就是全生命周期总成本
        s.submitted_at
    FROM Submissions s
    JOIN Users u ON s.user_id = u.id
    WHERE s.track = 'weighted'
    ORDER BY s.total_cost ASC  -- 直接按total_cost排序
    LIMIT 20;
`;
```

---

## 问题2：Submissions表缺少direct_cost字段（已修复）

### 问题描述
**严重程度**: 🟡 中等

原始表结构：
```sql
CREATE TABLE Submissions (
    ...
    project_duration INTEGER NOT NULL,
    total_cost NUMERIC NOT NULL,  -- 只有全生命周期总成本
    ...
);
```

**问题**：
- 排行榜需要显示"直接成本"，但表中没有存储
- 只能通过反推计算（`total_cost - project_duration * 12000`），但这样：
  1. 性能较差
  2. 如果间接费用标准变化，历史数据无法准确显示

### 修复方案

#### 1. 更新 `init-database.sql`
**文件**: `backend/init-database.sql` 第24-36行

```sql
CREATE TABLE IF NOT EXISTS Submissions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES Users(id),
    track VARCHAR(20) NOT NULL CHECK (track IN ('cost', 'time', 'weighted')),
    score NUMERIC NOT NULL,  -- 排名分数（等于total_cost）
    project_duration INTEGER NOT NULL,  -- 项目总工期（天）
    direct_cost NUMERIC NOT NULL,  -- ⭐ 新增：直接成本
    total_cost NUMERIC NOT NULL,  -- 全生命周期总成本 = direct_cost + (工期 × 12000元/天)
    details JSONB,
    submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, track)
);
```

#### 2. 创建迁移脚本
**文件**: `backend/migrations/002_add_direct_cost_to_submissions.sql`（新建）

```sql
-- 为现有数据库添加direct_cost字段
ALTER TABLE Submissions
ADD COLUMN IF NOT EXISTS direct_cost NUMERIC;

-- 更新现有数据（假设日均间接费用为12000元/天）
UPDATE Submissions
SET direct_cost = total_cost - (project_duration * 12000)
WHERE direct_cost IS NULL;

-- 设置为NOT NULL
ALTER TABLE Submissions
ALTER COLUMN direct_cost SET NOT NULL;
```

#### 3. 更新前端提交逻辑
**文件**: `fronted/src/components/SubmissionModal.jsx` 第20-30行

```javascript
const submissionData = {
    track: 'weighted',
    score: lifecycleCost,
    projectDuration: totalDuration,
    directCost: totalDirectCost,  // ⭐ 新增
    totalCost: totalCost,
    details: { ... }
};
```

#### 4. 更新后端API
**文件**: `backend/server.js` 第182-223行

```javascript
// 接收directCost参数
const { track, score, projectDuration, directCost, totalCost, details } = req.body;

// 数据验证
if (!track || score == null || projectDuration == null || directCost == null || totalCost == null) {
    return res.status(400).json({ error: 'Missing required submission data.' });
}

// INSERT语句添加direct_cost字段
INSERT INTO Submissions (user_id, track, score, project_duration, direct_cost, total_cost, details)
VALUES ($1, $2, $3, $4, $5, $6, $7)
...
```

#### 5. 更新排行榜查询
**文件**: `backend/server.js` 第113-125行

```javascript
const query = `
    SELECT
        u.name,
        s.project_duration,
        s.direct_cost,  -- ⭐ 返回直接成本
        s.total_cost AS lifecycle_cost,
        s.submitted_at
    FROM Submissions s
    ...
`;
```

#### 6. 更新前端排行榜显示
**文件**: `fronted/src/components/Leaderboard.jsx` 第86行

```jsx
{/* ⭐ 使用direct_cost字段 */}
<td style={{textAlign: 'center'}}>¥{Math.round(row.direct_cost).toLocaleString()}</td>
```

---

## 问题3：字段命名容易混淆（已改进）

### 问题描述
**严重程度**: 🟢 轻微（已通过注释改进）

`total_cost` 这个命名容易让人误解：
- ❌ 可能理解为"直接成本总和"
- ✅ 实际是"全生命周期总成本"

### 改进方案
在 `init-database.sql` 中添加了详细的注释：

```sql
score NUMERIC NOT NULL,  -- 排名分数（等于total_cost）
project_duration INTEGER NOT NULL,  -- 项目总工期（天）
direct_cost NUMERIC NOT NULL,  -- 直接成本（所有任务成本之和）
total_cost NUMERIC NOT NULL,  -- 全生命周期总成本 = direct_cost + (工期 × 12000元/天)
```

**为什么不直接改名**：
- 改字段名需要修改大量代码（前端+后端）
- 通过注释明确说明更安全

---

## 📊 修复后的数据流程

### 1. 前端计算（Redux Store）
```javascript
// projectSlice.js
const totalDirectCost = tasks.reduce((sum, task) => sum + task.currentCost, 0);
const totalIndirectCost = totalDuration * 12000;  // 12,000元/天
const totalCost = totalDirectCost + totalIndirectCost;
```

### 2. 前端提交
```javascript
// SubmissionModal.jsx
const submissionData = {
    score: totalCost,  // 全生命周期总成本
    projectDuration: totalDuration,
    directCost: totalDirectCost,  // 直接成本
    totalCost: totalCost,  // 全生命周期总成本
    details: { ... }
};
```

### 3. 后端存储
```sql
INSERT INTO Submissions
    (user_id, track, score, project_duration, direct_cost, total_cost, details)
VALUES
    (1, 'weighted', 1000000, 50, 400000, 1000000, {...});
-- score = total_cost = 400000 + (50 × 12000) = 1000000
```

### 4. 排行榜查询
```sql
SELECT
    u.name,
    s.project_duration,  -- 50天
    s.direct_cost,       -- ¥400,000（直接成本）
    s.total_cost AS lifecycle_cost,  -- ¥1,000,000（全生命周期总成本）
    s.submitted_at
FROM Submissions s
ORDER BY s.total_cost ASC;  -- 按全生命周期总成本升序
```

### 5. 前端显示
| 排名 | 姓名 | 全生命周期总成本 | 工期 | 直接成本 | 提交时间 |
|------|------|-----------------|------|----------|----------|
| 🥇 | 张三 | ¥1,000,000 | 50天 | ¥400,000 | 2025-01-03 |

---

## 🔧 部署步骤

### 对于新数据库（首次初始化）
```bash
# 直接使用修复后的init-database.sql
psql -U postgres -d operations_research -f backend/init-database.sql
```

### 对于现有数据库（已有数据）
```bash
# 1. 先运行迁移脚本添加direct_cost字段
psql -U postgres -d operations_research -f backend/migrations/002_add_direct_cost_to_submissions.sql

# 2. 重启后端服务
cd backend
npm start
```

---

## ✅ 验证测试

### 1. 检查表结构
```sql
\d Submissions

-- 应该看到：
-- direct_cost | numeric | not null
```

### 2. 测试提交
```sql
-- 提交后查询数据
SELECT
    u.name,
    s.direct_cost,
    s.project_duration,
    s.total_cost,
    s.total_cost - (s.project_duration * 12000) AS calculated_direct_cost
FROM Submissions s
JOIN Users u ON s.user_id = u.id;

-- 验证：total_cost应该 = direct_cost + (project_duration × 12000)
```

### 3. 测试排行榜API
```bash
curl http://localhost:8080/api/leaderboard?track=weighted

# 返回的JSON应该包含direct_cost字段：
# {
#   "name": "张三",
#   "project_duration": 50,
#   "direct_cost": 400000,
#   "lifecycle_cost": 1000000,
#   "submitted_at": "2025-01-03T..."
# }
```

---

## 📝 总结

| 问题 | 严重程度 | 状态 | 影响范围 |
|------|---------|------|---------|
| 排行榜重复计算间接费用 | 🔴 严重 | ✅ 已修复 | backend/server.js |
| 缺少direct_cost字段 | 🟡 中等 | ✅ 已修复 | 数据库表结构 + 前后端 |
| 字段命名混淆 | 🟢 轻微 | ✅ 已改进 | 添加注释说明 |

**修改的文件**：
1. ✅ `backend/init-database.sql` - 添加direct_cost字段和注释
2. ✅ `backend/migrations/002_add_direct_cost_to_submissions.sql` - 新建迁移脚本
3. ✅ `backend/server.js` - 修复排行榜查询 + 更新提交API
4. ✅ `fronted/src/components/SubmissionModal.jsx` - 添加directCost提交
5. ✅ `fronted/src/components/Leaderboard.jsx` - 使用direct_cost显示

**核心修复逻辑**：
- ✅ 统一间接费用标准为 **12,000元/天**
- ✅ 删除排行榜中的重复计算
- ✅ 数据库同时存储直接成本和全生命周期总成本
- ✅ 前端计算一次，后端直接存储和查询

所有问题已完全修复！🎉
