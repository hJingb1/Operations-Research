# 综合排行榜配置说明

> **已实现**: 基准值偏差法综合排名
> **文件位置**: `backend/server.js` (第107-110行)

---

## 📐 评分公式

### 核心思想
计算每个提交**超出基准值的百分比**，然后加权求和。

### 计算公式
```
综合分数 = 工期权重 × 工期超出% + 成本权重 × 成本超出%

其中：
工期超出% = MAX(0, (实际工期 - 基准工期) / 基准工期 × 100)
成本超出% = MAX(0, (实际成本 - 基准成本) / 基准成本 × 100)
```

### 示例计算

**基准值**：工期120天，成本¥200,000

| 学生 | 工期 | 成本 | 工期超出% | 成本超出% | 综合分数 |
|------|------|------|-----------|-----------|----------|
| 张三 | 100天 | ¥180,000 | 0% | 0% | **0%** ✅ 最优 |
| 李四 | 130天 | ¥190,000 | 8.33% | 0% | **3.33%** |
| 王五 | 120天 | ¥220,000 | 0% | 10% | **6%** |
| 赵六 | 150天 | ¥240,000 | 25% | 20% | **22%** |

**计算过程**（以李四为例）：
```
工期超出% = (130 - 120) / 120 × 100 = 8.33%
成本超出% = (190000 - 200000) / 200000 × 100 = 0% (负值按0计算)
综合分数 = 0.4 × 8.33% + 0.6 × 0% = 3.33%
```

---

## 🔧 配置参数（如何调整）

### 在 `server.js` 中修改

找到第**107-110行**：

```javascript
const BASELINE_DURATION = 120;  // 基准工期：120天
const BASELINE_COST = 200000;    // 基准成本：200,000元
const DURATION_WEIGHT = 0.4;     // 工期权重：40%
const COST_WEIGHT = 0.6;         // 成本权重：60%
```

### 参数说明

#### 1. `BASELINE_DURATION` - 基准工期
- **含义**: 期望的项目完成时间（天）
- **推荐设置**: 比最优解略高10-20%
- **如何确定**:
  1. 运行CPM计算关键路径
  2. 取关键路径长度 × 1.1 作为基准
  3. 例如：关键路径110天 → 基准设为120天

#### 2. `BASELINE_COST` - 基准成本
- **含义**: 期望的项目总成本（元）
- **推荐设置**: 正常工期下的总成本
- **如何确定**:
  1. 计算不赶工时的总成本
  2. 总直接费用 + 总间接费用
  3. 例如：直接费150,000 + 间接费50,000 = 200,000

#### 3. `DURATION_WEIGHT` - 工期权重
- **含义**: 工期在综合评分中的重要性
- **范围**: 0.0 ~ 1.0
- **推荐值**:
  - **0.3-0.4**: 成本优先（商业项目）
  - **0.5**: 平衡型（教学推荐）
  - **0.6-0.7**: 工期优先（应急项目）

#### 4. `COST_WEIGHT` - 成本权重
- **含义**: 成本在综合评分中的重要性
- **约束**: `DURATION_WEIGHT + COST_WEIGHT = 1.0`
- **自动计算**: `1.0 - DURATION_WEIGHT`

---

## 🎯 不同场景的推荐配置

### 场景1: 教学环境（默认）
```javascript
const BASELINE_DURATION = 120;    // 关键路径110天 × 1.1
const BASELINE_COST = 200000;     // 正常总成本
const DURATION_WEIGHT = 0.4;
const COST_WEIGHT = 0.6;
```
**适用**: 常规教学，强调成本控制

---

### 场景2: 工期敏感项目
```javascript
const BASELINE_DURATION = 100;    // 较紧的工期要求
const BASELINE_COST = 220000;     // 允许赶工增加成本
const DURATION_WEIGHT = 0.7;      // 工期更重要
const COST_WEIGHT = 0.3;
```
**适用**: 模拟应急工程、赶工情境

---

### 场景3: 成本敏感项目
```javascript
const BASELINE_DURATION = 150;    // 宽裕的工期
const BASELINE_COST = 180000;     // 严格的成本上限
const DURATION_WEIGHT = 0.2;
const COST_WEIGHT = 0.8;          // 成本更重要
```
**适用**: 低价中标、预算有限的项目

---

### 场景4: 严格基准（挑战模式）
```javascript
const BASELINE_DURATION = 105;    // 接近理论最优
const BASELINE_COST = 190000;     // 压缩成本
const DURATION_WEIGHT = 0.5;
const COST_WEIGHT = 0.5;
```
**适用**: 高级学生挑战，鼓励极致优化

---

## 📊 基准值设定策略

### 方法1: 基于理论最优解
```
基准工期 = 关键路径最短时间 × 1.1
基准成本 = 最小总成本 × 1.05
```
**优点**: 有挑战性，鼓励优化
**缺点**: 可能导致大部分学生超标

### 方法2: 基于中位数
```
基准工期 = 历史提交工期的中位数
基准成本 = 历史提交成本的中位数
```
**优点**: 相对公平，符合正态分布
**缺点**: 需要积累历史数据

### 方法3: 基于正常方案
```
基准工期 = 不赶工时的总工期
基准成本 = 不赶工时的总成本
```
**优点**: 容易理解，符合直觉
**缺点**: 基准较宽松

---

## 🔄 动态调整流程

### 步骤1: 收集初始数据
```sql
-- 查看所有weighted赛道提交
SELECT
    MIN(project_duration) AS 最短工期,
    MAX(project_duration) AS 最长工期,
    AVG(project_duration) AS 平均工期,
    MIN(total_cost) AS 最低成本,
    MAX(total_cost) AS 最高成本,
    AVG(total_cost) AS 平均成本
FROM Submissions
WHERE track = 'weighted';
```

### 步骤2: 确定基准值
```
基准工期 = 平均工期 或 最短工期 × 1.15
基准成本 = 平均成本 或 最低成本 × 1.1
```

### 步骤3: 修改配置
编辑 `server.js` 第107-110行

### 步骤4: 重启后端
```bash
cd project-blueprint/backend
node server.js
```

### 步骤5: 验证效果
查看排行榜，确认分数分布合理

---

## ⚠️ 注意事项

### 1. 权重和必须为1
```javascript
// ✅ 正确
const DURATION_WEIGHT = 0.4;
const COST_WEIGHT = 0.6;  // 0.4 + 0.6 = 1.0

// ❌ 错误
const DURATION_WEIGHT = 0.5;
const COST_WEIGHT = 0.6;  // 0.5 + 0.6 = 1.1 ❌
```

### 2. 基准值不能为0
```javascript
// ❌ 错误 - 会导致除以0错误
const BASELINE_DURATION = 0;

// ✅ 正确
const BASELINE_DURATION = 120;
```

### 3. 低于基准值不扣分
如果学生表现优于基准（如工期100天 < 基准120天），超出%为0，不会负分。

### 4. 修改后需重启
修改 `server.js` 后，必须重启后端服务才能生效。

---

## 🧪 测试配置

### 测试数据插入
```sql
-- 插入测试提交（weighted赛道）
INSERT INTO Submissions (user_id, track, score, project_duration, total_cost, details)
VALUES
    (1, 'weighted', 0, 110, 190000, '{}'),  -- 优于基准
    (2, 'weighted', 0, 125, 205000, '{}'),  -- 略超基准
    (3, 'weighted', 0, 140, 230000, '{}'),  -- 明显超基准
    (4, 'weighted', 0, 100, 180000, '{}')   -- 全优
ON CONFLICT (user_id, track) DO NOTHING;
```

### 验证计算结果
```sql
-- 手动验证综合分数
SELECT
    u.name,
    s.project_duration,
    s.total_cost,
    -- 工期超出%
    CASE WHEN s.project_duration > 120 THEN
        ((s.project_duration - 120)::NUMERIC / 120) * 100
    ELSE 0 END AS duration_excess,
    -- 成本超出%
    CASE WHEN s.total_cost > 200000 THEN
        ((s.total_cost - 200000)::NUMERIC / 200000) * 100
    ELSE 0 END AS cost_excess
FROM Submissions s
JOIN Users u ON s.user_id = u.id
WHERE s.track = 'weighted';
```

---

## 📖 前端显示说明

修改前端提示信息：

在 `Leaderboard.jsx` 第**162行**，更新评分说明：

```javascript
<li>基准工期：120天 | 基准成本：¥200,000</li>
```

**修改建议**：
- 与后端配置保持一致
- 清晰说明基准值含义
- 可添加权重说明

---

## 🚀 快速修改示例

### 示例1: 调整为工期优先（60%）
```javascript
// server.js 第107-110行
const BASELINE_DURATION = 110;
const BASELINE_COST = 210000;
const DURATION_WEIGHT = 0.6;  // 改为60%
const COST_WEIGHT = 0.4;      // 改为40%
```

### 示例2: 提高基准要求（挑战模式）
```javascript
// server.js 第107-110行
const BASELINE_DURATION = 105;  // 降低10天
const BASELINE_COST = 190000;   // 降低1万元
const DURATION_WEIGHT = 0.4;
const COST_WEIGHT = 0.6;
```

### 示例3: 放宽基准（入门模式）
```javascript
// server.js 第107-110行
const BASELINE_DURATION = 150;  // 增加30天
const BASELINE_COST = 230000;   // 增加3万元
const DURATION_WEIGHT = 0.4;
const COST_WEIGHT = 0.6;
```

---

## ✅ 配置完成检查清单

- [ ] 确认基准工期合理（关键路径 × 1.1-1.2）
- [ ] 确认基准成本合理（正常方案总成本）
- [ ] 确认权重和为1.0
- [ ] 修改后重启后端服务
- [ ] 前端评分说明与后端一致
- [ ] 插入测试数据验证
- [ ] 查看排行榜确认正常

---

**需要帮助？**
- 不确定基准值如何设定 → 查看测试数据统计
- 排行榜显示异常 → 检查SQL查询日志
- 分数计算不符预期 → 手动验证SQL公式

**修改后记得**：
1. 重启后端：`Ctrl+C` → `node server.js`
2. 刷新前端排行榜
3. 验证前3名的分数是否合理
