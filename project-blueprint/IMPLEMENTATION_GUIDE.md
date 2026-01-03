# 阶段1功能实施指南

> **当前进度**: 已完成数据层、Redux状态管理、验证器引擎
> **剩余工作**: UI组件、后端API、阶段切换、测试

---

## ✅ 已完成的工作

### 1. 数据文件
- ✅ `fronted/public/phase1-project.json` - 15任务项目数据
- ✅ `fronted/public/phase1-config.json` - 配置文件
- ✅ `fronted/public/phase2-project.json` - 重命名完成

### 2. Redux状态管理
- ✅ `fronted/src/store/gameSlice.js` - 阶段管理
- ✅ `fronted/src/store/phase1Slice.js` - 阶段1状态
- ✅ `fronted/src/store/store.js` - 集成完成

### 3. 验证器引擎
- ✅ `fronted/src/validators/dependencyValidator.js` - 依赖关系验证
- ✅ `fronted/src/validators/resourceValidator.js` - 资源冲突检测
- ✅ `fronted/src/validators/phase1Validator.js` - 综合验证

---

## 📋 待实施任务清单

### 任务A: 安装前端依赖包

阶段1需要Chart.js来绘制资源曲线图：

```bash
cd project-blueprint/fronted
npm install chart.js
```

---

### 任务B: 创建阶段1 UI组件

#### B1. 主容器组件

**文件**: `fronted/src/components/Phase1/Phase1Container.jsx`

```jsx
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPhase1Data } from '../../store/phase1Slice';
import Phase1Header from './Phase1Header';
import ResourceChart from './ResourceChart';
import Phase1Gantt from './Phase1Gantt';
import Phase1TaskList from './Phase1TaskList';
import './Phase1.css';

function Phase1Container() {
  const dispatch = useDispatch();
  const { projectName, tasks } = useSelector(state => state.phase1);

  useEffect(() => {
    // 加载阶段1数据
    const loadData = async () => {
      try {
        const [projectRes, configRes] = await Promise.all([
          fetch('/phase1-project.json'),
          fetch('/phase1-config.json')
        ]);
        const projectData = await projectRes.json();
        const config = await configRes.json();

        dispatch(loadPhase1Data({ projectData, config }));
      } catch (error) {
        console.error('加载阶段1数据失败:', error);
      }
    };
    loadData();
  }, [dispatch]);

  if (tasks.length === 0) {
    return <div className="loading">正在加载阶段1数据...</div>;
  }

  return (
    <div className="phase1-container">
      <Phase1Header />
      <ResourceChart />
      <div className="phase1-main">
        <Phase1Gantt />
        <Phase1TaskList />
      </div>
    </div>
  );
}

export default Phase1Container;
```

#### B2. 顶部工具栏

**文件**: `fronted/src/components/Phase1/Phase1Header.jsx`

```jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ValidationModal from './ValidationModal';

function Phase1Header() {
  const [showModal, setShowModal] = useState(false);
  const { projectName, unplacedTaskIds } = useSelector(state => state.phase1);

  return (
    <div className="phase1-header">
      <h1>{projectName}</h1>
      <div className="header-info">
        <span>阶段1: 手动排程训练</span>
        <span className="unplaced-count">
          待放置任务: {unplacedTaskIds.length}
        </span>
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="btn-submit-phase1"
      >
        提交阶段1
      </button>

      <ValidationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default Phase1Header;
```

#### B3. 甘特图组件

**文件**: `fronted/src/components/Phase1/Phase1Gantt.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { moveTask, placeTask } from '../../store/phase1Slice';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlx-gantt.css';

function Phase1Gantt() {
  const dispatch = useDispatch();
  const ganttContainer = useRef(null);
  const { tasks, validationErrors } = useSelector(state => state.phase1);

  useEffect(() => {
    // 配置gantt为可编辑模式
    gantt.config.readonly = false;
    gantt.config.drag_move = true;
    gantt.config.drag_links = false; // 不允许修改依赖关系
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.show_grid = true;

    // 自定义任务样式
    gantt.templates.task_class = (start, end, task) => {
      let classes = [];

      // 未放置的任务(堆叠在Day 0)
      if (!task.isPlaced) {
        classes.push('unplaced-task');
      }

      // 违反依赖的任务
      const hasDependencyError = validationErrors.dependencies
        .some(err => err.taskId === task.id);
      if (hasDependencyError) {
        classes.push('dependency-error');
      }

      return classes.join(' ');
    };

    // 拖拽结束事件
    gantt.attachEvent('onAfterTaskDrag', (id, mode) => {
      const task = gantt.getTask(id);
      const baseDate = new Date(2025, 0, 1);
      const newStartDay = Math.round(
        (task.start_date - baseDate) / (1000 * 60 * 60 * 24)
      );

      if (!task.isPlaced && newStartDay > 0) {
        // 首次从停车场拖出
        dispatch(placeTask({ taskId: id, startDay: newStartDay }));
      } else {
        // 调整已放置任务的位置
        dispatch(moveTask({ taskId: id, newStartDay }));
      }
    });

    gantt.init(ganttContainer.current);

    return () => {
      gantt.clearAll();
    };
  }, [dispatch, validationErrors.dependencies]);

  useEffect(() => {
    // 更新甘特图数据
    const baseDate = new Date(2025, 0, 1);

    const ganttData = {
      data: tasks.map(task => ({
        id: task.id,
        text: `${task.id}: ${task.name}`,
        start_date: new Date(baseDate.getTime() + task.startDay * 24 * 60 * 60 * 1000),
        duration: task.duration,
        progress: 0,
        isPlaced: task.isPlaced
      })),
      links: [] // 阶段1不显示依赖连线(避免提示)
    };

    gantt.clearAll();
    gantt.parse(ganttData);
  }, [tasks]);

  return (
    <div className="phase1-gantt-wrapper">
      <h3>项目甘特图 - 拖动任务到合适位置</h3>
      <div
        ref={ganttContainer}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
}

export default Phase1Gantt;
```

#### B4. 资源曲线图

**文件**: `fronted/src/components/Phase1/ResourceChart.jsx`

```jsx
import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { generateResourceTimeline } from '../../validators/resourceValidator';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function ResourceChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const { tasks, resourcePool } = useSelector(state => state.phase1);

  useEffect(() => {
    if (!chartRef.current) return;

    const { days, data, pool } = generateResourceTimeline(tasks, resourcePool);

    // 销毁旧图表
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 创建新图表
    const ctx = chartRef.current.getContext('2d');

    const datasets = Object.entries(data).map(([type, values]) => ({
      label: type,
      data: values,
      backgroundColor: values.map((v) =>
        v > pool[type] ? 'rgba(255, 99, 99, 0.6)' : 'rgba(99, 132, 255, 0.6)'
      ),
      borderColor: values.map((v) =>
        v > pool[type] ? 'rgb(255, 99, 99)' : 'rgb(99, 132, 255)'
      ),
      borderWidth: 1
    }));

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '资源数量' }
          },
          x: {
            title: { display: true, text: '天数' }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const type = context.dataset.label;
                const limit = pool[type];
                return `上限: ${limit}`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [tasks, resourcePool]);

  return (
    <div className="resource-chart">
      <h3>资源占用情况（红色=超限）</h3>
      <div style={{ height: '150px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default ResourceChart;
```

#### B5. 任务列表（简化版）

**文件**: `fronted/src/components/Phase1/Phase1TaskList.jsx`

```jsx
import React from 'react';
import { useSelector } from 'react-redux';

function Phase1TaskList() {
  const { tasks } = useSelector(state => state.phase1);

  return (
    <div className="phase1-task-list">
      <h3>任务列表</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>任务名称</th>
            <th>工期(天)</th>
            <th>前置任务</th>
            <th>开始时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.name}</td>
              <td>{task.duration}</td>
              <td>{task.predecessors.join(', ') || '无'}</td>
              <td>{task.isPlaced ? `第${task.startDay}天` : '-'}</td>
              <td>
                {task.isPlaced ? '✓ 已放置' : '待放置'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Phase1TaskList;
```

#### B6. 验证弹窗

**文件**: `fronted/src/components/Phase1/ValidationModal.jsx`

```jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validatePhase1Submission } from '../../validators/phase1Validator';
import { setValidationErrors, markPassed } from '../../store/phase1Slice';
import { setPhase1Result } from '../../store/gameSlice';
import axios from 'axios';

function ValidationModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { tasks, resourcePool, config, validationErrors } = useSelector(state => state.phase1);
  const { token } = useSelector(state => state.auth);

  const handleValidate = () => {
    const result = validatePhase1Submission(tasks, resourcePool, config);
    dispatch(setValidationErrors(result.errors));
  };

  const handleSubmit = async () => {
    // 先验证
    const result = validatePhase1Submission(tasks, resourcePool, config);
    dispatch(setValidationErrors(result.errors));

    if (!result.isValid) {
      return; // 显示错误信息
    }

    // 通过验证，提交到后端
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        '/api/phase1/submit',
        {
          finalDuration: result.errors.duration.current,
          taskPlacements: tasks.filter(t => t.isPlaced).map(t => ({
            taskId: t.id,
            startDay: t.startDay
          }))
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 更新状态并切换到阶段2
      dispatch(markPassed());
      dispatch(setPhase1Result({ score: response.data.score }));

      alert(config.validationMessages.pass);
      onClose();
      // 页面将自动切换到阶段2(通过App.jsx的逻辑)

    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请稍后重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const { duration, dependencies, resources, unplaced } = validationErrors;
  const hasErrors = !duration.isValid ||
                    dependencies.length > 0 ||
                    resources.length > 0 ||
                    unplaced.length > 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
        <h2>提交验证</h2>

        {hasErrors ? (
          <div className="validation-errors">
            <h3>❌ 提交失败，请修正以下问题：</h3>

            {/* 工期问题 */}
            {!duration.isValid && (
              <div className="error-section">
                <h4>📅 工期超限</h4>
                <p>当前总工期：{duration.current}天</p>
                <p>要求：≤ {duration.max}天</p>
              </div>
            )}

            {/* 未放置任务 */}
            {unplaced.length > 0 && (
              <div className="error-section">
                <h4>📋 未放置任务 ({unplaced.length}个)</h4>
                <ul>
                  {unplaced.map(err => (
                    <li key={err.taskId}>{err.taskId}: {err.taskName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 依赖问题 */}
            {dependencies.length > 0 && (
              <div className="error-section">
                <h4>⛓️ 前置依赖违规 ({dependencies.length}个)</h4>
                <ul>
                  {dependencies.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="error-item">
                      {err.message}
                    </li>
                  ))}
                  {dependencies.length > 5 && <li>...还有{dependencies.length - 5}个错误</li>}
                </ul>
              </div>
            )}

            {/* 资源冲突 */}
            {resources.length > 0 && (
              <div className="error-section">
                <h4>⚠️ 资源冲突 ({resources.length}个时段)</h4>
                <ul>
                  {resources.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="error-item">
                      第{err.day}天: {err.resourceType}
                      需求<span className="error-value">{err.required}</span>
                      &gt; 可用<span className="limit-value">{err.available}</span>
                      (超出{err.exceed})
                    </li>
                  ))}
                  {resources.length > 5 && <li>...还有{resources.length - 5}个冲突</li>}
                </ul>
              </div>
            )}

            <button onClick={onClose} className="btn-back">
              返回修改
            </button>
          </div>
        ) : (
          <div className="validation-success">
            <h3>✓ 验证通过！</h3>
            <p>总工期：{duration.current}天（≤ {duration.max}天）</p>
            <p>所有依赖关系满足 ✓</p>
            <p>无资源冲突 ✓</p>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? '提交中...' : '确认提交并进入阶段2'}
            </button>
            <button onClick={onClose} className="btn-cancel">
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationModal;
```

#### B7. CSS样式

**文件**: `fronted/src/components/Phase1/Phase1.css`

```css
/* 阶段1容器 */
.phase1-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f5f5;
}

/* 顶部工具栏 */
.phase1-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background: white;
  border-bottom: 2px solid #1976d2;
}

.phase1-header h1 {
  margin: 0;
  color: #1976d2;
}

.header-info {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.unplaced-count {
  font-weight: bold;
  color: #ff9800;
}

.btn-submit-phase1 {
  padding: 0.75rem 1.5rem;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-submit-phase1:hover {
  background: #45a049;
}

/* 资源曲线图 */
.resource-chart {
  padding: 1rem 2rem;
  background: white;
  border-bottom: 1px solid #ddd;
}

.resource-chart h3 {
  margin-top: 0;
}

/* 主内容区 */
.phase1-main {
  display: flex;
  flex: 1;
  overflow: hidden;
  gap: 1rem;
  padding: 1rem;
}

.phase1-gantt-wrapper {
  flex: 2;
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
}

.phase1-task-list {
  flex: 1;
  background: white;
  padding: 1rem;
  border-radius: 4px;
  overflow: auto;
}

.phase1-task-list table {
  width: 100%;
  border-collapse: collapse;
}

.phase1-task-list th,
.phase1-task-list td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.phase1-task-list th {
  background: #f0f0f0;
  font-weight: bold;
}

/* 甘特图自定义样式 */
.gantt_task.unplaced-task {
  opacity: 0.5;
  border: 2px dashed #999;
  background: #e0e0e0 !important;
}

.gantt_task.dependency-error {
  border: 3px solid #ff0000 !important;
  box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
}

/* 验证弹窗 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.validation-modal {
  background: white;
  padding: 2rem;
  border-radius: 8px;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.validation-modal h2 {
  margin-top: 0;
}

.validation-errors h3 {
  color: #d32f2f;
}

.error-section {
  margin: 1rem 0;
  padding: 1rem;
  background: #fff3f3;
  border-left: 4px solid #ff4444;
  border-radius: 4px;
}

.error-section h4 {
  margin-top: 0;
  color: #d32f2f;
}

.error-section ul {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.error-item {
  margin: 0.5rem 0;
  color: #d32f2f;
}

.error-value {
  font-weight: bold;
  color: #ff0000;
}

.limit-value {
  font-weight: bold;
  color: #666;
}

.validation-success {
  text-align: center;
}

.validation-success h3 {
  color: #4caf50;
  font-size: 1.5rem;
}

.validation-success p {
  margin: 0.5rem 0;
}

.btn-back,
.btn-submit,
.btn-cancel {
  padding: 0.75rem 1.5rem;
  margin: 0.5rem;
  border: none;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
}

.btn-back {
  background: #2196f3;
  color: white;
}

.btn-submit {
  background: #4caf50;
  color: white;
}

.btn-cancel {
  background: #757575;
  color: white;
}

.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #666;
}
```

---

### 任务C: 修改App.jsx实现阶段切换

**文件**: `fronted/src/App.jsx`

```jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeFromAuth } from './store/gameSlice';
import { setProjectData } from './store/projectSlice';
import Login from './components/Login';
import Phase1Container from './components/Phase1/Phase1Container';
// 注意：需要将现有的MainApp重命名或创建Phase2Container
import Dashboard from './components/Dashboard';
import GanttChart from './components/GanttChart';
import TaskList from './components/TaskList';
import InspectorPanel from './components/InspectorPanel';
import Leaderboard from './components/Leaderboard';
import './App.css';

// 阶段2容器（临时方案：直接在这里定义）
function Phase2Container() {
  return (
    <div className="app-container">
      <Dashboard />
      <GanttChart />
      <div className="main-view">
        <TaskList />
        <InspectorPanel />
      </div>
      <Leaderboard />
    </div>
  );
}

function App() {
  const dispatch = useDispatch();
  const { isAuthenticated, token } = useSelector(state => state.auth);
  const { currentPhase } = useSelector(state => state.game);
  const phase2Loaded = useSelector(state => state.project.present?.isLoaded);

  useEffect(() => {
    if (isAuthenticated && token) {
      // 从JWT token解析currentPhase
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        dispatch(initializeFromAuth({ currentPhase: payload.currentPhase || 1 }));
      } catch (err) {
        console.error('Token parse error:', err);
        // 默认进入阶段1
        dispatch(initializeFromAuth({ currentPhase: 1 }));
      }
    }
  }, [isAuthenticated, token, dispatch]);

  useEffect(() => {
    // 仅在阶段2且数据未加载时加载
    if (currentPhase === 2 && !phase2Loaded) {
      const loadPhase2Data = async () => {
        try {
          const response = await fetch('/phase2-project.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          dispatch(setProjectData(data));
        } catch (error) {
          console.error("加载阶段2数据失败:", error);
        }
      };
      loadPhase2Data();
    }
  }, [currentPhase, phase2Loaded, dispatch]);

  // 路由逻辑
  if (!isAuthenticated) {
    return <Login />;
  }

  if (currentPhase === 1) {
    return <Phase1Container />;
  }

  if (currentPhase === 2) {
    if (!phase2Loaded) {
      return <div className="loading">正在加载阶段2数据...</div>;
    }
    return <Phase2Container />;
  }

  return <div>Unknown phase</div>;
}

export default App;
```

---

### 任务D: 后端API扩展

#### D1. 创建数据库迁移脚本

**文件**: `backend/migrations/001_add_phase1_table.sql`

```sql
-- 阶段1成绩表
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

-- 为user_id创建索引
CREATE INDEX idx_phase1_user ON Phase1Results(user_id);
```

#### D2. 修改登录API

**文件**: `backend/server.js`（修改现有代码）

在登录API中添加阶段检查：

```javascript
app.post('/api/auth/login', async (req, res) => {
    const { name, studentId } = req.body;
    if (!name || !studentId) {
        return res.status(400).json({ error: 'Name and studentId are required.' });
    }

    try {
        // 1. 验证用户
        const userResult = await pool.query(
          'SELECT * FROM Users WHERE name = $1 AND student_id = $2',
          [name, studentId]
        );
        const user = userResult.rows[0];
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials.' });
        }

        // 2. 查询阶段1状态
        const phase1Result = await pool.query(
          'SELECT is_passed FROM Phase1Results WHERE user_id = $1',
          [user.id]
        );
        const phase1Passed = phase1Result.rows[0]?.is_passed || false;
        const currentPhase = phase1Passed ? 2 : 1;

        // 3. 生成JWT (包含currentPhase)
        const token = jwt.sign(
          {
            userId: user.id,
            name: user.name,
            studentId: user.student_id,
            currentPhase  // 关键！
          },
          JWT_SECRET,
          { expiresIn: '8h' }
        );

        res.json({
          message: 'Login successful!',
          token,
          currentPhase  // 返回给前端
        });

    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
});
```

#### D3. 新增阶段1提交API

在`server.js`中添加：

```javascript
// 提交阶段1成绩
app.post('/api/phase1/submit', authMiddleware, async (req, res) => {
    const userId = req.user.userId;
    const { finalDuration, taskPlacements } = req.body;

    if (!finalDuration) {
      return res.status(400).json({ error: 'Missing finalDuration' });
    }

    try {
      // 检查是否已通过
      const existingResult = await pool.query(
        'SELECT is_passed FROM Phase1Results WHERE user_id = $1',
        [userId]
      );

      if (existingResult.rows[0]?.is_passed) {
        return res.status(400).json({
          error: 'You have already passed Phase 1'
        });
      }

      // 插入或更新成绩
      const upsertQuery = `
        INSERT INTO Phase1Results (user_id, is_passed, score, final_duration, submit_attempts, passed_at)
        VALUES ($1, TRUE, 60, $2, COALESCE((SELECT submit_attempts FROM Phase1Results WHERE user_id = $1), 0) + 1, CURRENT_TIMESTAMP)
        ON CONFLICT (user_id)
        DO UPDATE SET
          is_passed = TRUE,
          score = 60,
          final_duration = EXCLUDED.final_duration,
          submit_attempts = Phase1Results.submit_attempts + 1,
          passed_at = CURRENT_TIMESTAMP;
      `;

      await pool.query(upsertQuery, [userId, finalDuration]);

      res.json({
        success: true,
        score: 60,
        message: '✓ 阶段1通过！'
      });

    } catch (err) {
      console.error('Phase1 submission error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
});
```

---

### 任务E: 数据库迁移

连接到PostgreSQL并执行：

```bash
# 1. 进入数据库
psql -h blueprint-db-postgresql.ns-3cnjew51.svc -U postgres

# 2. 执行迁移脚本
\i backend/migrations/001_add_phase1_table.sql

# 3. 验证
SELECT * FROM Phase1Results LIMIT 5;
```

---

## 🧪 测试步骤

### 1. 前端测试

```bash
cd project-blueprint/fronted
npm run dev
```

访问 `http://localhost:5173`

**测试流程**:
1. 使用现有账号登录 → 应进入阶段1
2. 拖拽任务到甘特图
3. 查看资源曲线图
4. 故意制造错误（依赖违规、资源冲突）
5. 提交验证 → 查看错误提示
6. 修正后提交 → 应自动进入阶段2

### 2. 后端测试

```bash
cd project-blueprint/backend
node server.js
```

使用Postman测试API：

**测试登录**:
```http
POST http://localhost:8080/api/auth/login
Content-Type: application/json

{
  "name": "测试学生",
  "studentId": "2021001"
}
```

应返回 `currentPhase: 1`

**测试提交**:
```http
POST http://localhost:8080/api/phase1/submit
Authorization: Bearer <your-token>
Content-Type: application/json

{
  "finalDuration": 115,
  "taskPlacements": [...]
}
```

---

## ⚠️ 常见问题

### 问题1: 甘特图拖拽不生效

**解决**: 检查dhtmlx-gantt版本和配置
```javascript
gantt.config.readonly = false; // 必须设为false
gantt.config.drag_move = true;
```

### 问题2: Chart.js报错

**解决**: 确保正确导入
```javascript
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);
```

### 问题3: 阶段切换不生效

**解决**: 检查JWT token是否包含currentPhase字段
```javascript
// 在浏览器控制台
const token = localStorage.getItem('token');
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload);
```

---

## 📚 下一步优化建议

1. **性能优化**: 资源验证添加防抖（拖拽时不要每次都计算）
2. **用户体验**: 添加拖拽辅助线、任务高亮动画
3. **错误处理**: 网络请求失败的友好提示
4. **数据导出**: 阶段1排程结果导出功能

---

**文档生成时间**: 2025-10-07
**作者**: Claude Code
**版本**: v1.0
