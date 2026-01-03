# 阶段1完成后无法进入阶段2 - 排查指南

> **问题描述**: 用户完成阶段1后，重新登录仍然进入阶段1而非阶段2

---

## 🔍 排查步骤

### 步骤1: 检查数据库中的阶段1记录

**在pgAdmin中执行**：

```sql
-- 查看所有阶段1成绩
SELECT
    u.name,
    u.student_id,
    p.is_passed,
    p.score,
    p.final_duration,
    p.passed_at
FROM Phase1Results p
JOIN Users u ON p.user_id = u.id;
```

**预期结果**:
- 应该能看到提交过阶段1的用户
- `is_passed` 应该为 `TRUE` 或 `t`
- `passed_at` 应该有时间戳

**如果表是空的**：
- 说明提交失败，数据没有写入数据库
- 跳到步骤4检查后端日志

---

### 步骤2: 检查特定用户的阶段1状态

```sql
-- 替换 '你的学号' 为实际学号（如 '2021001'）
SELECT
    u.id AS user_id,
    u.name,
    u.student_id,
    p.is_passed,
    p.score,
    p.passed_at
FROM Users u
LEFT JOIN Phase1Results p ON u.id = p.user_id
WHERE u.student_id = '你的学号';  -- 👈 改成实际学号
```

**预期结果**:
```
 user_id | name | student_id | is_passed | score | passed_at
---------+------+------------+-----------+-------+-----------
    1    | 张三  | 2021001    | t         | 60    | 2025-12-02...
```

**如果 `is_passed` 是 `NULL` 或 `f`**：
- 说明该用户没有通过阶段1
- 或者提交时出错

**如果整行是 `NULL`（除了user信息）**：
- 说明Phase1Results表中没有该用户的记录
- 提交失败

---

### 步骤3: 手动标记用户通过阶段1（测试用）

如果确认是数据库问题，可以手动插入记录：

```sql
-- 手动标记用户通过阶段1
-- 先查询用户ID
SELECT id, name, student_id FROM Users WHERE student_id = '2021001';

-- 假设用户ID是1，插入阶段1成绩
INSERT INTO Phase1Results (user_id, is_passed, score, final_duration, passed_at)
VALUES (1, TRUE, 60, 54, CURRENT_TIMESTAMP)
ON CONFLICT (user_id) DO UPDATE SET
    is_passed = TRUE,
    score = 60,
    passed_at = CURRENT_TIMESTAMP;
```

**然后重新登录测试**。

---

### 步骤4: 检查后端日志

**在后端terminal查看**：

1. **提交阶段1时的日志**：
   ```
   提交阶段1，Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   提交成功: { success: true, score: 60, message: '✓ 阶段1通过！' }
   ```

2. **重新登录时的日志**：
   ```
   Login successful for user: 张三
   Phase1 passed: true
   Current phase: 2
   ```

**如果没有看到这些日志**：
- 说明请求没有到达后端
- 检查前端是否正确调用API

---

### 步骤5: 检查前端请求

**打开浏览器开发者工具**（F12）：

#### 5.1 提交阶段1时

**Network标签** → 找到 `phase1/submit` 请求：

- **Status**: 应该是 `200 OK`
- **Response**:
  ```json
  {
    "success": true,
    "score": 60,
    "message": "✓ 阶段1通过！"
  }
  ```

**如果是 401/403**：
- Token过期或无效
- 检查localStorage中的token

**如果是 400**：
- 可能是重复提交（已通过阶段1）
- 查看Response中的error信息

#### 5.2 重新登录时

**Network标签** → 找到 `auth/login` 请求：

- **Request Payload**:
  ```json
  {
    "name": "张三",
    "studentId": "2021001"
  }
  ```

- **Response** (关键！):
  ```json
  {
    "message": "Login successful!",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "currentPhase": 2  // 👈 应该是2！
  }
  ```

**如果 `currentPhase` 是 1**：
- 说明后端查询到的 `is_passed` 为 `false`
- 回到步骤1检查数据库

---

### 步骤6: 解析JWT Token检查currentPhase

**在浏览器Console中执行**：

```javascript
// 获取token
const token = localStorage.getItem('token');
console.log('Token:', token);

// 解析token
const payload = JSON.parse(atob(token.split('.')[1]));
console.log('Token payload:', payload);
console.log('currentPhase:', payload.currentPhase);
```

**预期输出**:
```javascript
{
  userId: 1,
  name: "张三",
  studentId: "2021001",
  currentPhase: 2,  // 👈 应该是2！
  iat: 1701518400,
  exp: 1701547200
}
```

**如果 `currentPhase` 是 1**：
- 说明后端返回的token包含错误的currentPhase
- 检查后端逻辑（步骤7）

---

### 步骤7: 检查后端登录逻辑

**查看 `server.js` 第65-71行**：

```javascript
// 2. 查询阶段1状态
const phase1Result = await pool.query(
  'SELECT is_passed FROM Phase1Results WHERE user_id = $1',
  [user.id]
);
const phase1Passed = phase1Result.rows[0]?.is_passed || false;
const currentPhase = phase1Passed ? 2 : 1;
```

**添加调试日志**（临时）：

```javascript
// 2. 查询阶段1状态
const phase1Result = await pool.query(
  'SELECT is_passed FROM Phase1Results WHERE user_id = $1',
  [user.id]
);
console.log('Phase1 query result:', phase1Result.rows);  // 👈 添加
const phase1Passed = phase1Result.rows[0]?.is_passed || false;
console.log('Phase1 passed:', phase1Passed);  // 👈 添加
const currentPhase = phase1Passed ? 2 : 1;
console.log('Current phase:', currentPhase);  // 👈 添加
```

**重启后端并重新登录**，查看日志输出。

---

## 🛠️ 常见问题与解决方案

### 问题1: 数据库中没有Phase1Results记录

**原因**: 提交API失败

**解决**:
1. 检查后端是否运行
2. 检查网络请求是否成功
3. 查看后端日志的错误信息

### 问题2: `is_passed` 是 `false`

**原因**: 提交时写入失败或被覆盖

**解决**:
```sql
-- 手动更新
UPDATE Phase1Results
SET is_passed = TRUE, score = 60, passed_at = CURRENT_TIMESTAMP
WHERE user_id = (SELECT id FROM Users WHERE student_id = '2021001');
```

### 问题3: JWT token中 `currentPhase` 是1

**原因**: 数据库查询返回了错误结果

**解决**:
1. 确认数据库中 `is_passed = TRUE`
2. 检查后端SQL查询是否正确
3. 添加日志查看查询结果

### 问题4: 前端一直显示"正在加载阶段2数据..."

**原因**: 阶段2数据加载失败

**解决**:
1. 检查 `phase2-project.json` 文件是否存在于 `public/` 目录
2. 打开浏览器Network标签，查看是否有404错误
3. 检查JSON文件格式是否正确

---

## 🧪 完整测试流程

### 1. 准备测试用户

```sql
-- 确保用户存在
INSERT INTO Users (name, student_id)
VALUES ('测试学生', '9999999')
ON CONFLICT (student_id) DO NOTHING;
```

### 2. 清空该用户的阶段1记录

```sql
DELETE FROM Phase1Results
WHERE user_id = (SELECT id FROM Users WHERE student_id = '9999999');
```

### 3. 登录阶段1

- 姓名: `测试学生`
- 学号: `9999999`
- 应该进入阶段1

### 4. 完成阶段1任务

- 拖拽任务到合适位置
- 满足所有约束
- 点击"提交阶段1"

### 5. 验证数据库

```sql
SELECT * FROM Phase1Results
WHERE user_id = (SELECT id FROM Users WHERE student_id = '9999999');
```

应该看到 `is_passed = TRUE`

### 6. 重新登录

- 使用相同账号登录
- **应该进入阶段2**

### 7. 检查JWT

```javascript
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload.currentPhase);  // 应该是 2
```

---

## 📝 调试检查清单

**数据库层面**:
- [ ] Phase1Results表存在
- [ ] 用户提交后有记录
- [ ] `is_passed` 字段为 `TRUE`

**后端层面**:
- [ ] 提交API返回成功
- [ ] 登录时查询到 `is_passed = TRUE`
- [ ] JWT包含 `currentPhase: 2`

**前端层面**:
- [ ] 提交后收到成功响应
- [ ] 重新登录收到 `currentPhase: 2`
- [ ] Redux store中 `currentPhase` 更新为2
- [ ] App.jsx渲染Phase2Container

---

## 🚑 快速修复（临时方案）

如果急需让特定用户进入阶段2，执行：

```sql
-- 强制标记用户通过阶段1
INSERT INTO Phase1Results (user_id, is_passed, score, final_duration, passed_at)
VALUES (
    (SELECT id FROM Users WHERE student_id = '你的学号'),
    TRUE,
    60,
    54,
    CURRENT_TIMESTAMP
)
ON CONFLICT (user_id) DO UPDATE SET
    is_passed = TRUE,
    score = 60,
    passed_at = CURRENT_TIMESTAMP;

-- 验证
SELECT u.name, p.is_passed
FROM Users u
JOIN Phase1Results p ON u.id = p.user_id
WHERE u.student_id = '你的学号';
```

然后重新登录。

---

## 📞 需要帮助时提供以下信息

1. **数据库查询结果**（步骤2的SQL结果）
2. **后端日志**（提交和登录时的输出）
3. **浏览器Network截图**（login和submit的Request/Response）
4. **JWT token内容**（步骤6的输出）

这样我可以更准确地定位问题！
