# 综合排行榜设计方案

> **目标**: 创建工期和成本的综合排名系统
> **项目**: 运筹学项目管理模拟器 - 阶段2

---

## 📊 方案概述

### 推荐方案：标准化加权法（Min-Max归一化）

**核心思想**: 将工期和成本标准化到[0,100]区间，然后加权求和

**公式**:
```
综合分数 = α × 工期标准分 + β × 成本标准分

其中：
- 工期标准分 = (工期 - 最小工期) / (最大工期 - 最小工期) × 100
- 成本标准分 = (成本 - 最小成本) / (最大成本 - 最小成本) × 100
- α + β = 1 (权重和为1)
- 推荐默认权重: α = 0.4 (工期), β = 0.6 (成本)
```

**优点**:
- ✅ 公平：消除量纲影响
- ✅ 灵活：可调整权重偏好
- ✅ 直观：分数越低越好
- ✅ 教学价值：体现多目标优化思想

---

## 🎯 推荐的三种权重配置

### 配置1: 成本优先（推荐作为默认）
```javascript
α (工期权重) = 0.4
β (成本权重) = 0.6
```
**适用**: 大多数工程项目，成本控制更重要

### 配置2: 工期优先
```javascript
α (工期权重) = 0.6
β (成本权重) = 0.4
```
**适用**: 时间敏感型项目（如应急工程）

### 配置3: 平衡型
```javascript
α (工期权重) = 0.5
β (成本权重) = 0.5
```
**适用**: 教学演示，体现均衡优化

---

## 💻 实现方案

### 方案A: 后端计算（推荐✅）

**优点**:
- 性能好（SQL计算）
- 数据一致性强
- 前端轻量

**实现步骤**:

#### 1. 修改后端API

在 `server.js` 中添加新的排行榜查询逻辑：

```javascript
// 后端：server.js
app.get('/api/leaderboard', async (req, res) => {
    const { track } = req.query;
    if (!['cost', 'time', 'weighted'].includes(track)) {
        return res.status(400).json({ error: 'Invalid track specified.' });
    }

    try {
        if (track === 'weighted') {
            // 综合排行榜：标准化加权
            const query = `
                WITH stats AS (
                    -- 计算所有提交的最小/最大值
                    SELECT
                        MIN(project_duration) AS min_duration,
                        MAX(project_duration) AS max_duration,
                        MIN(total_cost) AS min_cost,
                        MAX(total_cost) AS max_cost
                    FROM Submissions
                    WHERE track = 'weighted'
                ),
                normalized AS (
                    -- 标准化并计算综合分数
                    SELECT
                        s.user_id,
                        s.project_duration,
                        s.total_cost,
                        s.submitted_at,
                        -- 工期标准化 (0-100)
                        CASE
                            WHEN st.max_duration = st.min_duration THEN 0
                            ELSE ((s.project_duration - st.min_duration)::NUMERIC /
                                  (st.max_duration - st.min_duration)) * 100
                        END AS duration_score,
                        -- 成本标准化 (0-100)
                        CASE
                            WHEN st.max_cost = st.min_cost THEN 0
                            ELSE ((s.total_cost - st.min_cost)::NUMERIC /
                                  (st.max_cost - st.min_cost)) * 100
                        END AS cost_score
                    FROM Submissions s, stats st
                    WHERE s.track = 'weighted'
                )
                SELECT
                    u.name,
                    n.project_duration,
                    n.total_cost,
                    n.duration_score,
                    n.cost_score,
                    -- 综合分数 (工期40% + 成本60%)
                    (0.4 * n.duration_score + 0.6 * n.cost_score) AS weighted_score,
                    n.submitted_at
                FROM normalized n
                JOIN Users u ON n.user_id = u.id
                ORDER BY weighted_score ASC
                LIMIT 20;
            `;
            const result = await pool.query(query);
            res.json(result.rows);

        } else {
            // 原有的cost/time排行榜
            const query = `
                SELECT u.name, s.score, s.project_duration, s.total_cost, s.submitted_at
                FROM Submissions s JOIN Users u ON s.user_id = u.id
                WHERE s.track = $1 ORDER BY s.score ASC LIMIT 20;
            `;
            const result = await pool.query(query, [track]);
            res.json(result.rows);
        }
    } catch (err) {
        console.error('Leaderboard fetch error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

#### 2. 更新前端Leaderboard组件

```javascript
// 前端：Leaderboard.jsx
function Leaderboard() {
  const [track, setTrack] = useState('cost');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const response = await axios.get(`/api/leaderboard?track=${track}`);
        setData(response.data);
      } catch (error) {
        console.error("获取排行榜数据失败:", error);
        setData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [track]);

  return (
    <div>
      <h2>排行榜</h2>
      <div style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => setTrack('cost')}
          disabled={track === 'cost'}
          style={{
            background: track === 'cost' ? '#1976d2' : '#e0e0e0',
            color: track === 'cost' ? 'white' : 'black',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          💰 成本最小
        </button>
        <button
          onClick={() => setTrack('time')}
          disabled={track === 'time'}
          style={{
            background: track === 'time' ? '#1976d2' : '#e0e0e0',
            color: track === 'time' ? 'white' : 'black',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginRight: '0.5rem'
          }}
        >
          ⏱️ 工期最短
        </button>
        <button
          onClick={() => setTrack('weighted')}
          disabled={track === 'weighted'}
          style={{
            background: track === 'weighted' ? '#4caf50' : '#e0e0e0',
            color: track === 'weighted' ? 'white' : 'black',
            padding: '0.5rem 1rem',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          🏆 综合排名
        </button>
      </div>

      {loading ? (
        <p>正在加载排行榜...</p>
      ) : (
        <table className="task-table">
          <thead>
            <tr>
              <th>排名</th>
              <th>姓名</th>
              {track === 'weighted' ? (
                <>
                  <th>综合分数</th>
                  <th>工期(天)</th>
                  <th>成本(元)</th>
                </>
              ) : (
                <>
                  <th>{track === 'cost' ? '总成本' : '总工期'}</th>
                </>
              )}
              <th>提交时间</th>
            </tr>
          </thead>
          <tbody>
            {data.length === 0 ? (
              <tr>
                <td colSpan={track === 'weighted' ? 6 : 4} style={{ textAlign: 'center' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              data.map((row, index) => (
                <tr key={index}>
                  <td>
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && (index + 1)}
                  </td>
                  <td>{row.name}</td>
                  {track === 'weighted' ? (
                    <>
                      <td style={{ fontWeight: 'bold', color: '#4caf50' }}>
                        {row.weighted_score?.toFixed(2)}
                      </td>
                      <td>{row.project_duration} 天</td>
                      <td>¥{Math.round(row.total_cost).toLocaleString()}</td>
                    </>
                  ) : (
                    <td>
                      {track === 'cost'
                        ? `¥${Math.round(row.score).toLocaleString()}`
                        : `${row.score} 天`}
                    </td>
                  )}
                  <td>{new Date(row.submitted_at).toLocaleString('zh-CN')}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
```

---

### 方案B: 前端计算

**优点**:
- 无需修改后端
- 权重可动态调整

**实现**:

```javascript
// 前端计算标准化分数
const calculateWeightedScore = (data, durationWeight = 0.4, costWeight = 0.6) => {
  if (data.length === 0) return [];

  // 找到最小/最大值
  const durations = data.map(d => d.project_duration);
  const costs = data.map(d => d.total_cost);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const minCost = Math.min(...costs);
  const maxCost = Math.max(...costs);

  // 计算标准化分数
  return data.map(item => {
    const durationScore = maxDuration === minDuration ? 0 :
      ((item.project_duration - minDuration) / (maxDuration - minDuration)) * 100;

    const costScore = maxCost === minCost ? 0 :
      ((item.total_cost - minCost) / (maxCost - minCost)) * 100;

    const weightedScore = durationWeight * durationScore + costWeight * costScore;

    return {
      ...item,
      durationScore,
      costScore,
      weightedScore
    };
  }).sort((a, b) => a.weightedScore - b.weightedScore);
};
```

---

## 🎨 进阶功能建议

### 1. 权重配置界面

让教师可以动态调整权重：

```javascript
const [durationWeight, setDurationWeight] = useState(0.4);
const costWeight = 1 - durationWeight;

// 添加滑块组件
<div>
  <label>工期权重: {(durationWeight * 100).toFixed(0)}%</label>
  <input
    type="range"
    min="0"
    max="100"
    value={durationWeight * 100}
    onChange={(e) => setDurationWeight(e.target.value / 100)}
  />
  <label>成本权重: {(costWeight * 100).toFixed(0)}%</label>
</div>
```

### 2. 可视化对比

添加雷达图展示前3名的多维度对比：

```javascript
import { Radar } from 'react-chartjs-2';

const radarData = {
  labels: ['工期', '成本', '综合'],
  datasets: [
    {
      label: '第1名',
      data: [/* 标准化后的数据 */],
      backgroundColor: 'rgba(255, 215, 0, 0.2)',
    },
    // ... 第2名、第3名
  ]
};
```

### 3. 分数详情卡片

点击排行榜条目显示详细信息：

```javascript
<Modal>
  <h3>{user.name} 的方案详情</h3>
  <p>工期: {duration} 天 → 标准分: {durationScore.toFixed(2)}</p>
  <p>成本: ¥{cost} → 标准分: {costScore.toFixed(2)}</p>
  <p>综合分数: {weightedScore.toFixed(2)}</p>
  <p>工期排名: #{durationRank} / 成本排名: #{costRank}</p>
</Modal>
```

---

## 📐 权重选择建议

### 场景1: 教学环境（推荐）
```
工期: 40%, 成本: 60%
理由: 强调成本控制，符合大多数工程实践
```

### 场景2: 时间紧急项目
```
工期: 70%, 成本: 30%
理由: 如应急救援、赶工期工程
```

### 场景3: 成本敏感项目
```
工期: 20%, 成本: 80%
理由: 如低价中标项目
```

### 场景4: 学生自由探索
```
让学生自己设定权重，提交时记录
理由: 培养多目标决策思维
```

---

## 🧪 测试数据示例

假设有3个提交：

| 学生 | 工期(天) | 成本(元) |
|------|---------|---------|
| 张三 | 45      | 95,000  |
| 李四 | 50      | 90,000  |
| 王五 | 40      | 100,000 |

**标准化计算**:
```
工期范围: [40, 50]
成本范围: [90,000, 100,000]

张三:
  工期标准分 = (45-40)/(50-40) × 100 = 50
  成本标准分 = (95000-90000)/(100000-90000) × 100 = 50
  综合分数 = 0.4×50 + 0.6×50 = 50

李四:
  工期标准分 = (50-40)/(50-40) × 100 = 100
  成本标准分 = (90000-90000)/(100000-90000) × 100 = 0
  综合分数 = 0.4×100 + 0.6×0 = 40 ✅ 最优

王五:
  工期标准分 = (40-40)/(50-40) × 100 = 0
  成本标准分 = (100000-90000)/(100000-90000) × 100 = 100
  综合分数 = 0.4×0 + 0.6×100 = 60
```

**排名**: 李四(40) > 张三(50) > 王五(60)

---

## 📋 实施检查清单

### 后端修改
- [ ] 修改 `/api/leaderboard` 支持 `weighted` 赛道
- [ ] 测试SQL查询性能
- [ ] 验证边界情况（只有1条数据）

### 前端修改
- [ ] 添加"综合排名"按钮
- [ ] 更新表格列显示逻辑
- [ ] 添加分数格式化
- [ ] 测试切换赛道功能

### 测试
- [ ] 插入测试数据
- [ ] 验证排名正确性
- [ ] 测试极端情况（相同分数）
- [ ] 前后端联调

---

## ❓ 常见问题

### Q1: 如果只有1条提交怎么办？
A: SQL中已处理，当 max=min 时，标准分为0

### Q2: 权重可以让学生自定义吗？
A: 可以！提交时让学生选择权重配置，记录到 `details` 字段

### Q3: 是否需要缓存计算结果？
A: 提交量<1000条时不需要，SQL性能足够

### Q4: 可以用其他标准化方法吗？
A: 可以！如Z-score标准化，但Min-Max更直观

---

## 🚀 推荐实施步骤

1. **第1步**: 使用方案A修改后端（15分钟）
2. **第2步**: 更新前端组件（10分钟）
3. **第3步**: 测试功能（5分钟）
4. **第4步**（可选）: 添加权重配置界面（20分钟）

**总耗时**: ~30-50分钟

---

需要我帮你实现具体代码吗？
