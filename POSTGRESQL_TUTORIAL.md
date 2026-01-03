# PostgreSQL数据库操作教程

> **专为本项目定制** - 运筹学项目管理模拟器
> **工具**: pgAdmin 4
> **数据库**: operations_research

---

## 📚 目录

1. [基础概念](#1-基础概念)
2. [连接数据库](#2-连接数据库)
3. [查看数据](#3-查看数据-select)
4. [插入数据](#4-插入数据-insert)
5. [更新数据](#5-更新数据-update)
6. [删除数据](#6-删除数据-delete)
7. [常用查询示例](#7-常用查询示例)
8. [项目实战场景](#8-项目实战场景)
9. [故障排查](#9-故障排查)

---

## 1. 基础概念

### 1.1 表结构说明

本项目有3个核心表：

#### **Users（用户表）**
```sql
+-------------+------------------+
| 列名        | 说明             |
+-------------+------------------+
| id          | 用户ID（自动生成）|
| name        | 姓名             |
| student_id  | 学号（唯一）      |
| created_at  | 创建时间         |
+-------------+------------------+
```

#### **Phase1Results（阶段1成绩表）**
```sql
+------------------+------------------------+
| 列名             | 说明                   |
+------------------+------------------------+
| id               | 记录ID（自动生成）      |
| user_id          | 用户ID（关联Users表）   |
| is_passed        | 是否通过（TRUE/FALSE）  |
| score            | 分数                   |
| final_duration   | 最终工期               |
| submit_attempts  | 提交次数               |
| passed_at        | 通过时间               |
| created_at       | 创建时间               |
+------------------+------------------------+
```

#### **Submissions（阶段2提交表）**
```sql
+------------------+------------------------+
| 列名             | 说明                   |
+------------------+------------------------+
| id               | 提交ID（自动生成）      |
| user_id          | 用户ID（关联Users表）   |
| track            | 赛道（cost/time/weighted）|
| score            | 分数                   |
| project_duration | 项目工期               |
| total_cost       | 总成本                 |
| details          | 详细数据（JSON格式）    |
| submitted_at     | 提交时间               |
+------------------+------------------------+
```

---

## 2. 连接数据库

### 2.1 在pgAdmin中打开Query Tool

1. 打开 **pgAdmin 4**
2. 展开左侧树形菜单：
   ```
   Servers
     └─ PostgreSQL 16
          └─ Databases
               └─ operations_research  ← 右键点击
   ```
3. 选择 **"Query Tool"**（查询工具）

### 2.2 执行SQL语句

- **运行单条语句**: 选中SQL → 点击 ▶️ 按钮（或按F5）
- **运行全部**: 直接点击 ▶️ 按钮
- **查看结果**: 底部会显示"Data Output"（数据输出）

---

## 3. 查看数据 (SELECT)

### 3.1 查看所有用户

```sql
-- 查看Users表的所有数据
SELECT * FROM Users;
```

**预期结果**:
```
 id |   name   | student_id |       created_at
----+----------+------------+-------------------------
  1 | 张三     | 2021001    | 2025-12-02 10:30:00
  2 | 李四     | 2021002    | 2025-12-02 10:30:00
  3 | 王五     | 2021003    | 2025-12-02 10:30:00
```

### 3.2 查询特定用户

```sql
-- 根据学号查询用户
SELECT * FROM Users WHERE student_id = '2021001';

-- 根据姓名查询用户
SELECT * FROM Users WHERE name = '张三';
```

### 3.3 查看阶段1成绩

```sql
-- 查看所有阶段1成绩
SELECT * FROM Phase1Results;

-- 查看某个用户的阶段1成绩
SELECT * FROM Phase1Results WHERE user_id = 1;

-- 查看通过阶段1的用户
SELECT * FROM Phase1Results WHERE is_passed = TRUE;
```

### 3.4 联表查询（显示用户名）

```sql
-- 查看阶段1成绩 + 用户名
SELECT
    u.name AS 姓名,
    u.student_id AS 学号,
    p.is_passed AS 是否通过,
    p.score AS 分数,
    p.final_duration AS 最终工期,
    p.passed_at AS 通过时间
FROM Phase1Results p
JOIN Users u ON p.user_id = u.id;
```

**结果示例**:
```
 姓名 |  学号   | 是否通过 | 分数 | 最终工期 |     通过时间
------+---------+----------+------+----------+--------------------
 张三 | 2021001 | t        | 60   | 54       | 2025-12-02 11:00:00
```

### 3.5 查看阶段2提交

```sql
-- 查看所有提交记录
SELECT * FROM Submissions;

-- 查看cost赛道的排行榜（成本最小）
SELECT
    u.name AS 姓名,
    s.score AS 分数,
    s.total_cost AS 总成本,
    s.project_duration AS 工期,
    s.submitted_at AS 提交时间
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE s.track = 'cost'
ORDER BY s.score ASC
LIMIT 10;
```

---

## 4. 插入数据 (INSERT)

### 4.1 添加新用户

```sql
-- 插入单个用户
INSERT INTO Users (name, student_id)
VALUES ('新学生', '2021999');

-- 插入多个用户
INSERT INTO Users (name, student_id) VALUES
    ('学生A', '2021100'),
    ('学生B', '2021101'),
    ('学生C', '2021102');
```

**注意事项**:
- ✅ `id` 和 `created_at` 会自动生成，不需要指定
- ⚠️ `student_id` 必须唯一，重复会报错
- ✅ 使用单引号 `'` 包裹文本

### 4.2 检查是否插入成功

```sql
-- 查看刚插入的用户
SELECT * FROM Users WHERE student_id = '2021999';
```

### 4.3 避免重复插入

```sql
-- 如果学号已存在，则忽略插入
INSERT INTO Users (name, student_id)
VALUES ('新学生', '2021999')
ON CONFLICT (student_id) DO NOTHING;
```

---

## 5. 更新数据 (UPDATE)

### 5.1 更新用户信息

```sql
-- 修改用户姓名
UPDATE Users
SET name = '张三（已修改）'
WHERE student_id = '2021001';

-- 修改多个字段
UPDATE Users
SET
    name = '新姓名',
    student_id = '2021888'
WHERE id = 1;
```

### 5.2 更新阶段1成绩

```sql
-- 手动标记用户通过阶段1
UPDATE Phase1Results
SET
    is_passed = TRUE,
    score = 60,
    passed_at = CURRENT_TIMESTAMP
WHERE user_id = 3;
```

### 5.3 清除用户的阶段1记录（重置）

```sql
-- 重置某用户的阶段1状态（让他重新挑战）
UPDATE Phase1Results
SET
    is_passed = FALSE,
    score = 0,
    passed_at = NULL
WHERE user_id = 1;
```

---

## 6. 删除数据 (DELETE)

### 6.1 删除用户

```sql
-- ⚠️ 危险操作！删除特定用户
DELETE FROM Users WHERE student_id = '2021999';

-- 删除多个用户
DELETE FROM Users WHERE student_id IN ('2021100', '2021101');
```

**警告**:
- ⚠️ 如果该用户有阶段1成绩或提交记录，会报错（外键约束）
- ✅ 需要先删除关联数据

### 6.2 正确删除用户的流程

```sql
-- 1. 先删除阶段1成绩
DELETE FROM Phase1Results WHERE user_id = 5;

-- 2. 再删除阶段2提交
DELETE FROM Submissions WHERE user_id = 5;

-- 3. 最后删除用户
DELETE FROM Users WHERE id = 5;
```

### 6.3 清空整个表（慎用！）

```sql
-- ⚠️⚠️⚠️ 删除表中所有数据
TRUNCATE TABLE Phase1Results;
TRUNCATE TABLE Submissions;
TRUNCATE TABLE Users CASCADE;  -- CASCADE会同时清空关联表
```

---

## 7. 常用查询示例

### 7.1 统计数据

```sql
-- 统计用户总数
SELECT COUNT(*) AS 用户总数 FROM Users;

-- 统计通过阶段1的人数
SELECT COUNT(*) AS 通过人数
FROM Phase1Results
WHERE is_passed = TRUE;

-- 统计每个赛道的提交数
SELECT
    track AS 赛道,
    COUNT(*) AS 提交数
FROM Submissions
GROUP BY track;
```

### 7.2 查找特定条件的数据

```sql
-- 查找工期小于50天的阶段1成绩
SELECT
    u.name,
    p.final_duration
FROM Phase1Results p
JOIN Users u ON p.user_id = u.id
WHERE p.final_duration < 50;

-- 查找总成本低于100000的提交
SELECT
    u.name,
    s.total_cost,
    s.track
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE s.total_cost < 100000;
```

### 7.3 排序查询

```sql
-- 按分数从高到低排序
SELECT
    u.name,
    s.score
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE s.track = 'cost'
ORDER BY s.score ASC;  -- ASC升序, DESC降序

-- 查看最近的10条提交
SELECT * FROM Submissions
ORDER BY submitted_at DESC
LIMIT 10;
```

### 7.4 模糊搜索

```sql
-- 查找姓名包含"张"的用户
SELECT * FROM Users WHERE name LIKE '%张%';

-- 查找学号以"2021"开头的用户
SELECT * FROM Users WHERE student_id LIKE '2021%';
```

---

## 8. 项目实战场景

### 场景1: 添加新班级学生

```sql
-- 批量导入学生名单
INSERT INTO Users (name, student_id) VALUES
    ('新生1', '2025001'),
    ('新生2', '2025002'),
    ('新生3', '2025003'),
    ('新生4', '2025004'),
    ('新生5', '2025005')
ON CONFLICT (student_id) DO NOTHING;

-- 验证导入
SELECT * FROM Users WHERE student_id LIKE '2025%';
```

### 场景2: 查看某学生的完整记录

```sql
-- 一条SQL查询学生的所有信息
SELECT
    u.name AS 姓名,
    u.student_id AS 学号,
    u.created_at AS 注册时间,
    p.is_passed AS 阶段1通过,
    p.score AS 阶段1分数,
    p.final_duration AS 阶段1工期,
    (SELECT COUNT(*) FROM Submissions WHERE user_id = u.id) AS 阶段2提交次数
FROM Users u
LEFT JOIN Phase1Results p ON u.id = p.user_id
WHERE u.student_id = '2021001';
```

### 场景3: 生成阶段1排行榜

```sql
-- 按工期从短到长排序（工期越短越好）
SELECT
    u.name AS 姓名,
    p.final_duration AS 工期,
    p.passed_at AS 通过时间
FROM Phase1Results p
JOIN Users u ON p.user_id = u.id
WHERE p.is_passed = TRUE
ORDER BY p.final_duration ASC
LIMIT 20;
```

### 场景4: 生成阶段2成本赛道排行榜

```sql
-- Cost赛道排行榜（总成本最低）
SELECT
    ROW_NUMBER() OVER (ORDER BY s.score ASC) AS 排名,
    u.name AS 姓名,
    s.total_cost AS 总成本,
    s.project_duration AS 工期,
    s.submitted_at AS 提交时间
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE s.track = 'cost'
ORDER BY s.score ASC
LIMIT 20;
```

### 场景5: 重置某学生的数据（让他重新挑战）

```sql
-- 开始事务（确保原子性）
BEGIN;

-- 1. 删除阶段1成绩
DELETE FROM Phase1Results WHERE user_id = (
    SELECT id FROM Users WHERE student_id = '2021001'
);

-- 2. 删除阶段2提交
DELETE FROM Submissions WHERE user_id = (
    SELECT id FROM Users WHERE student_id = '2021001'
);

-- 3. 确认无误后提交
COMMIT;

-- 如果发现错误，可以回滚
-- ROLLBACK;
```

### 场景6: 导出数据到CSV

```sql
-- 在pgAdmin中右键查询结果 → "Export" → 选择CSV格式
SELECT
    u.name,
    u.student_id,
    p.score,
    p.final_duration,
    p.passed_at
FROM Users u
LEFT JOIN Phase1Results p ON u.id = p.user_id;
```

---

## 9. 故障排查

### 9.1 常见错误

#### ❌ 错误1: `column "xxx" does not exist`
```sql
-- 错误示例
SELECT name FROM users;  -- ❌ 表名大小写错误
```

**解决**: PostgreSQL区分大小写，使用双引号或正确大小写
```sql
SELECT name FROM Users;  -- ✅ 正确
SELECT name FROM "Users";  -- ✅ 也可以
```

#### ❌ 错误2: `duplicate key value violates unique constraint`
```sql
-- 尝试插入重复学号
INSERT INTO Users (name, student_id) VALUES ('测试', '2021001');
-- ❌ 错误：student_id已存在
```

**解决**: 使用 `ON CONFLICT`
```sql
INSERT INTO Users (name, student_id) VALUES ('测试', '2021001')
ON CONFLICT (student_id) DO NOTHING;  -- ✅ 忽略重复
```

#### ❌ 错误3: `relation "xxx" does not exist`
```sql
SELECT * FROM phase1results;  -- ❌ 表名不存在
```

**解决**: 检查表名是否正确
```sql
-- 查看所有表
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public';

-- 正确的表名
SELECT * FROM Phase1Results;  -- ✅
```

### 9.2 查看表结构

```sql
-- 查看Users表的结构
\d Users

-- 或者使用
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'Users';
```

### 9.3 查看索引

```sql
-- 查看所有索引
SELECT * FROM pg_indexes
WHERE tablename IN ('Users', 'Phase1Results', 'Submissions');
```

### 9.4 检查外键关系

```sql
-- 查看Phase1Results的外键
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_name = 'Phase1Results';
```

---

## 10. pgAdmin快捷操作

### 10.1 快速查看表数据

1. 展开 `operations_research` → `Schemas` → `public` → `Tables`
2. 右键点击表（如 `Users`）
3. 选择 **"View/Edit Data"** → **"All Rows"**
4. 可以直接在表格中编辑数据（类似Excel）

### 10.2 保存常用查询

1. 在Query Tool中写好SQL
2. 点击 **"File"** → **"Save"**
3. 保存为 `.sql` 文件
4. 下次可以直接打开

### 10.3 格式化SQL

1. 选中SQL代码
2. 点击工具栏的 **"Beautify SQL"** 按钮
3. 自动格式化

### 10.4 查看执行计划

```sql
-- 查看查询性能
EXPLAIN ANALYZE
SELECT * FROM Users WHERE student_id = '2021001';
```

---

## 11. 实用SQL片段（复制即用）

### 11.1 查看系统信息

```sql
-- 查看当前时间
SELECT NOW();

-- 查看PostgreSQL版本
SELECT version();

-- 查看所有数据库
SELECT datname FROM pg_database;
```

### 11.2 备份与恢复（使用pgAdmin）

**备份**:
1. 右键 `operations_research` 数据库
2. 选择 **"Backup..."**
3. 选择保存位置（如 `backup_2025-12-02.backup`）
4. 点击 **"Backup"**

**恢复**:
1. 右键数据库
2. 选择 **"Restore..."**
3. 选择备份文件
4. 点击 **"Restore"**

### 11.3 快速清空测试数据

```sql
-- ⚠️ 慎用！清空所有数据（保留表结构）
TRUNCATE TABLE Submissions, Phase1Results, Users CASCADE;

-- 重新插入测试用户
INSERT INTO Users (name, student_id) VALUES
    ('张三', '2021001'),
    ('李四', '2021002'),
    ('王五', '2021003')
ON CONFLICT (student_id) DO NOTHING;
```

---

## 12. 练习题

### 初级练习

1. 查询所有用户的姓名和学号
2. 统计Users表中有多少条记录
3. 查找学号为"2021002"的用户信息
4. 插入一个新用户：姓名"测试学生"，学号"2021999"

<details>
<summary>点击查看答案</summary>

```sql
-- 1
SELECT name, student_id FROM Users;

-- 2
SELECT COUNT(*) FROM Users;

-- 3
SELECT * FROM Users WHERE student_id = '2021002';

-- 4
INSERT INTO Users (name, student_id) VALUES ('测试学生', '2021999');
```
</details>

### 中级练习

1. 查询所有通过阶段1的用户姓名
2. 查找工期最短的阶段1成绩
3. 统计每个赛道的提交数量
4. 查询姓"张"的用户的所有阶段2提交

<details>
<summary>点击查看答案</summary>

```sql
-- 1
SELECT u.name
FROM Users u
JOIN Phase1Results p ON u.id = p.user_id
WHERE p.is_passed = TRUE;

-- 2
SELECT u.name, p.final_duration
FROM Phase1Results p
JOIN Users u ON p.user_id = u.id
WHERE p.is_passed = TRUE
ORDER BY p.final_duration ASC
LIMIT 1;

-- 3
SELECT track, COUNT(*) AS count
FROM Submissions
GROUP BY track;

-- 4
SELECT s.*
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE u.name LIKE '张%';
```
</details>

---

## 13. 常用命令速查表

| 操作 | SQL语句 |
|------|---------|
| 查询所有 | `SELECT * FROM 表名;` |
| 条件查询 | `SELECT * FROM 表名 WHERE 列名 = '值';` |
| 插入数据 | `INSERT INTO 表名 (列1, 列2) VALUES (值1, 值2);` |
| 更新数据 | `UPDATE 表名 SET 列名 = '新值' WHERE 条件;` |
| 删除数据 | `DELETE FROM 表名 WHERE 条件;` |
| 统计数量 | `SELECT COUNT(*) FROM 表名;` |
| 排序 | `SELECT * FROM 表名 ORDER BY 列名 ASC/DESC;` |
| 限制结果 | `SELECT * FROM 表名 LIMIT 10;` |
| 联表查询 | `SELECT * FROM 表1 JOIN 表2 ON 表1.id = 表2.外键;` |
| 模糊搜索 | `SELECT * FROM 表名 WHERE 列名 LIKE '%关键词%';` |

---

## 14. 下一步学习

- 📖 [PostgreSQL官方文档](https://www.postgresql.org/docs/)
- 🎓 [pgAdmin使用指南](https://www.pgadmin.org/docs/)
- 💡 [SQL练习网站](https://sqlzoo.net/)

---

**最后提醒**:
- ✅ 开发阶段随意尝试，不怕出错
- ⚠️ 生产环境操作前务必备份
- 📝 养成写注释的好习惯

如有疑问，随时提问！ 🎉
