# 运筹学项目管理模拟器 - 开发待办事项 (两阶段版)

> **项目状态**: 阶段2已完成，待实现阶段1核心功能
> **最后更新**: 2025-10-07
> **核心变更**: 项目采用两阶段独立训练模式

---

## 🎯 项目架构概述

### 两阶段教学模式

| 阶段 | 训练目标 | 项目内容 | 学生任务 | 评分 |
|------|---------|---------|---------|------|
| **阶段1** | 手动排程能力 | 项目A (15任务) | 从停车场拖拽任务到甘特图，满足依赖/资源/工期约束 | 通过=60分 (固定) |
| **阶段2** | 成本优化能力 | 项目B (10任务) | 压缩工序优化时间-成本平衡，三赛道排行榜 | 40-100分 (竞争) |

**关键设计**:
- ✅ 两个阶段使用**完全独立**的项目数据（任务数量、依赖关系、资源需求均不同）
- ✅ 必须通过阶段1才能进入阶段2（后端存储通过状态）
- ✅ 通过阶段1后，再次登录直接进入阶段2（不可回退）
- ✅ 阶段1不显示CPM数据（关键路径、ES/LS等）
- ✅ 阶段2延用现有完整功能（Dashboard、排行榜、成本优化）

---

## 📊 整体进度概览

### 现有功能 (阶段2已完成)
| 模块 | 完成度 | 状态 |
|------|--------|------|
| CPM计算引擎 | ✅ 100% | 完成 |
| 用户认证系统 | ✅ 100% | 完成 |
| 成本计算模型 | ✅ 100% | 完成 |
| Dashboard仪表盘 | ✅ 100% | 完成 |
| 任务压缩功能 | ✅ 100% | 完成 |
| 撤销/重做功能 | ✅ 100% | 完成 |
| 排行榜后端API | ✅ 100% | 完成 |
| 基础甘特图(只读) | ✅ 100% | 完成 |

### 待实现功能 (阶段1核心)
| 模块 | 完成度 | 优先级 | 预估工时 |
|------|--------|--------|----------|
| **阶段1数据层** | ❌ 0% | 🔥P0 | 0.5天 |
| **停车场+拖拽** | ❌ 0% | 🔥P0 | 2天 |
| **验证器引擎** | ❌ 0% | 🔥P0 | 1天 |
| **资源可视化** | ❌ 0% | 🔥P0 | 1天 |
| **阶段切换逻辑** | ❌ 0% | 🔥P0 | 1天 |
| **后端API扩展** | ❌ 0% | 🔥P0 | 1天 |
| **集成测试** | ❌ 0% | 🟠P1 | 1天 |
| 网络图视图 | ❌ 0% | 🟢P2 | 2-3天 |

**总预估工时**: 7.5-10天 (P0+P1任务)

---

## 🔥 P0级任务 (核心功能 - 必须完成)

---

### 任务1: 数据层准备与配置
**预估工时**: 0.5天
**依赖**: 无

#### 1.1 创建阶段1项目数据
- [ ] **新建文件**: `fronted/public/phase1-project.json`
  ```json
  {
    "projectName": "办公楼建设项目",
    "description": "阶段1: 手动排程训练",
    "resourcePool": {
      "worker": 80,
      "crane": 3,
      "excavator": 5
    },
    "tasks": [
      {
        "id": "A",
        "name": "地基准备",
        "duration": 5,
        "predecessors": [],
        "resources": { "worker": 20, "excavator": 2 }
      },
      {
        "id": "B",
        "name": "基础浇筑",
        "duration": 8,
        "predecessors": ["A"],
        "resources": { "worker": 30, "crane": 1 }
      }
      // ... 设计共15个任务
      // 要求:
      // - 依赖关系形成复杂网络(非简单串行)
      // - 资源分配确保必须合理并行才能通过
      // - 纯串行工期 > 阈值, 合理并行工期 < 阈值
    ]
  }
  ```

- [ ] **新建文件**: `fronted/public/phase1-config.json`
  ```json
  {
    "maxDuration": 150,
    "passScore": 60,
    "validationMessages": {
      "pass": "✓ 阶段1通过！您已掌握基础排程技能，可以进入成本优化阶段。",
      "failDuration": "工期超限：当前{current}天，要求≤{max}天",
      "failDependencies": "存在{count}个前置依赖违规",
      "failResources": "存在{count}个资源冲突时段",
      "failNotAllPlaced": "还有{count}个任务未放置"
    }
  }
  ```

- [ ] **重命名文件**: `initial-project.json` → `phase2-project.json`

- [ ] **示例资源数据设计** (临时使用，后续替换)
  - 设计原则:
    - 关键路径上的任务资源需求较高
    - 可并行任务的资源需求总和 > 资源池 (制造冲突)
    - 留有一定优化空间 (不是唯一解)

#### 1.2 验证数据完整性
- [ ] 检查依赖关系无环
- [ ] 检查所有前置任务ID存在
- [ ] 手动模拟排程验证阈值合理性

---

### 任务2: Redux状态管理重构
**预估工时**: 0.5天
**依赖**: 任务1完成

#### 2.1 创建阶段管理Slice
- [ ] **新建文件**: `fronted/src/store/gameSlice.js`
  ```javascript
  import { createSlice } from '@reduxjs/toolkit';

  const gameSlice = createSlice({
    name: 'game',
    initialState: {
      currentPhase: 1, // 从JWT token或localStorage读取
      phase1Passed: false,
      phase1Score: 0
    },
    reducers: {
      setCurrentPhase: (state, action) => {
        state.currentPhase = action.payload;
      },
      setPhase1Result: (state, action) => {
        state.phase1Passed = true;
        state.phase1Score = action.payload.score;
        state.currentPhase = 2;
      },
      initializeFromAuth: (state, action) => {
        // 从JWT token中读取currentPhase
        state.currentPhase = action.payload.currentPhase;
      }
    }
  });

  export const { setCurrentPhase, setPhase1Result, initializeFromAuth } = gameSlice.actions;
  export default gameSlice.reducer;
  ```

#### 2.2 创建阶段1状态Slice
- [ ] **新建文件**: `fronted/src/store/phase1Slice.js`
  ```javascript
  import { createSlice } from '@reduxjs/toolkit';

  const initialState = {
    projectName: '',
    resourcePool: {},
    tasks: [],
    unplacedTaskIds: [], // ["A", "B", "C", ...]
    config: {},
    validationErrors: {
      duration: { current: 0, max: 0, isValid: true },
      dependencies: [], // [{ taskId, predId, message }]
      resources: [], // [{ day, resourceType, required, available }]
      unplaced: []
    },
    isSubmitting: false,
    isPassed: false
  };

  const phase1Slice = createSlice({
    name: 'phase1',
    initialState,
    reducers: {
      loadPhase1Data: (state, action) => {
        const { projectData, config } = action.payload;
        state.projectName = projectData.projectName;
        state.resourcePool = projectData.resourcePool;
        state.config = config;

        // 初始化任务：全部放在Day 0，标记为未放置
        state.tasks = projectData.tasks.map(t => ({
          ...t,
          startDay: 0,
          isPlaced: false
        }));
        state.unplacedTaskIds = projectData.tasks.map(t => t.id);
      },

      placeTask: (state, action) => {
        const { taskId, startDay } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.startDay = startDay;
          task.isPlaced = true;
          state.unplacedTaskIds = state.unplacedTaskIds.filter(id => id !== taskId);
        }
      },

      moveTask: (state, action) => {
        const { taskId, newStartDay } = action.payload;
        const task = state.tasks.find(t => t.id === taskId);
        if (task) {
          task.startDay = newStartDay;
        }
      },

      setValidationErrors: (state, action) => {
        state.validationErrors = action.payload;
      },

      markPassed: (state) => {
        state.isPassed = true;
      },

      resetPhase1: (state) => {
        return { ...initialState };
      }
    }
  });

  export const {
    loadPhase1Data,
    placeTask,
    moveTask,
    setValidationErrors,
    markPassed,
    resetPhase1
  } = phase1Slice.actions;

  export default phase1Slice.reducer;
  ```

#### 2.3 集成到Store
- [ ] **修改文件**: `fronted/src/store/store.js`
  ```javascript
  import { configureStore } from '@reduxjs/toolkit';
  import authReducer from './authSlice';
  import gameReducer from './gameSlice';
  import phase1Reducer from './phase1Slice';
  import projectReducer from './projectSlice'; // 用于阶段2

  export const store = configureStore({
    reducer: {
      auth: authReducer,
      game: gameReducer,
      phase1: phase1Reducer,
      project: projectReducer // 保持现有结构(含redux-undo)
    }
  });
  ```

---

### 任务3: 验证器引擎开发
**预估工时**: 1天
**依赖**: 任务2完成

#### 3.1 依赖关系验证器
- [ ] **新建文件**: `fronted/src/validators/dependencyValidator.js`
  ```javascript
  /**
   * 验证所有任务的前置依赖关系
   * @param {Array} tasks - 任务数组
   * @returns {Array} 违规列表
   */
  export function validateDependencies(tasks) {
    const errors = [];

    tasks.forEach(task => {
      if (!task.isPlaced) return; // 未放置的任务不检查

      task.predecessors.forEach(predId => {
        const pred = tasks.find(t => t.id === predId);

        if (!pred) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            predId,
            message: `前置任务${predId}不存在`
          });
          return;
        }

        if (!pred.isPlaced) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            predId,
            predName: pred.name,
            message: `前置任务${pred.name}尚未放置`
          });
          return;
        }

        const predEndDay = pred.startDay + pred.duration;
        if (predEndDay > task.startDay) {
          errors.push({
            taskId: task.id,
            taskName: task.name,
            taskStartDay: task.startDay,
            predId,
            predName: pred.name,
            predEndDay,
            message: `${task.name}(第${task.startDay}天开始)早于前置任务${pred.name}(第${predEndDay}天完成)`
          });
        }
      });
    });

    return errors;
  }
  ```

#### 3.2 资源冲突验证器
- [ ] **新建文件**: `fronted/src/validators/resourceValidator.js`
  ```javascript
  /**
   * 检测资源超限时段
   * @param {Array} tasks - 任务数组
   * @param {Object} resourcePool - 资源池 {worker: 80, crane: 3}
   * @returns {Array} 冲突列表
   */
  export function detectResourceConflicts(tasks, resourcePool) {
    const placedTasks = tasks.filter(t => t.isPlaced);
    if (placedTasks.length === 0) return [];

    // 计算项目时间范围
    const maxDay = Math.max(
      ...placedTasks.map(t => t.startDay + t.duration)
    );

    // 按天累加资源需求
    const timeline = {};
    for (let day = 0; day <= maxDay; day++) {
      timeline[day] = {};
    }

    placedTasks.forEach(task => {
      for (let day = task.startDay; day < task.startDay + task.duration; day++) {
        if (task.resources) {
          Object.entries(task.resources).forEach(([type, amount]) => {
            timeline[day][type] = (timeline[day][type] || 0) + amount;
          });
        }
      }
    });

    // 检测超限
    const conflicts = [];
    Object.entries(timeline).forEach(([day, usage]) => {
      Object.entries(usage).forEach(([resourceType, required]) => {
        const available = resourcePool[resourceType] || 0;
        if (required > available) {
          conflicts.push({
            day: parseInt(day),
            resourceType,
            required,
            available,
            exceed: required - available,
            message: `第${day}天${resourceType}需求${required} > 可用${available}`
          });
        }
      });
    });

    return conflicts;
  }

  /**
   * 生成资源使用时间轴数据(用于图表绘制)
   */
  export function generateResourceTimeline(tasks, resourcePool) {
    const placedTasks = tasks.filter(t => t.isPlaced);
    if (placedTasks.length === 0) return { days: [], data: {} };

    const maxDay = Math.max(...placedTasks.map(t => t.startDay + t.duration));
    const days = Array.from({ length: maxDay + 1 }, (_, i) => i);
    const data = {};

    // 初始化每种资源的数组
    Object.keys(resourcePool).forEach(type => {
      data[type] = new Array(maxDay + 1).fill(0);
    });

    placedTasks.forEach(task => {
      for (let day = task.startDay; day < task.startDay + task.duration; day++) {
        if (task.resources) {
          Object.entries(task.resources).forEach(([type, amount]) => {
            if (data[type]) {
              data[type][day] += amount;
            }
          });
        }
      }
    });

    return { days, data, pool: resourcePool };
  }
  ```

#### 3.3 综合验证函数
- [ ] **新建文件**: `fronted/src/validators/phase1Validator.js`
  ```javascript
  import { validateDependencies } from './dependencyValidator';
  import { detectResourceConflicts } from './resourceValidator';

  /**
   * 阶段1完整验证
   * @returns {Object} { isValid: boolean, errors: {...} }
   */
  export function validatePhase1Submission(tasks, resourcePool, config) {
    const errors = {
      duration: { current: 0, max: config.maxDuration, isValid: true },
      dependencies: [],
      resources: [],
      unplaced: []
    };

    // 1. 检查是否所有任务已放置
    const unplacedTasks = tasks.filter(t => !t.isPlaced);
    if (unplacedTasks.length > 0) {
      errors.unplaced = unplacedTasks.map(t => ({
        taskId: t.id,
        taskName: t.name
      }));
    }

    // 2. 计算总工期
    const placedTasks = tasks.filter(t => t.isPlaced);
    if (placedTasks.length > 0) {
      const totalDuration = Math.max(
        ...placedTasks.map(t => t.startDay + t.duration)
      );
      errors.duration.current = totalDuration;
      errors.duration.isValid = totalDuration <= config.maxDuration;
    }

    // 3. 验证依赖关系
    errors.dependencies = validateDependencies(tasks);

    // 4. 验证资源冲突
    errors.resources = detectResourceConflicts(tasks, resourcePool);

    // 判断整体是否通过
    const isValid =
      errors.unplaced.length === 0 &&
      errors.duration.isValid &&
      errors.dependencies.length === 0 &&
      errors.resources.length === 0;

    return { isValid, errors };
  }
  ```

#### 3.4 单元测试
- [ ] 编写测试用例验证各种场景
  - 正常通过
  - 工期超限
  - 依赖违规
  - 资源冲突
  - 混合错误

---

### 任务4: 阶段1 UI组件开发
**预估工时**: 2天
**依赖**: 任务2, 任务3完成

#### 4.1 组件目录结构
- [ ] **创建目录**: `fronted/src/components/Phase1/`
  - `Phase1Container.jsx` - 主容器
  - `ParkingLot.jsx` - 停车场(任务卡片列表)
  - `Phase1Gantt.jsx` - 可拖拽甘特图
  - `Phase1TaskList.jsx` - 简化任务列表
  - `ResourceChart.jsx` - 资源占用曲线图
  - `ValidationModal.jsx` - 提交验证弹窗
  - `Phase1Header.jsx` - 顶部工具栏

#### 4.2 主容器组件
- [ ] **新建文件**: `Phase1Container.jsx`
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
        const [projectRes, configRes] = await Promise.all([
          fetch('/phase1-project.json'),
          fetch('/phase1-config.json')
        ]);
        const projectData = await projectRes.json();
        const config = await configRes.json();

        dispatch(loadPhase1Data({ projectData, config }));
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

#### 4.3 停车场组件(集成到甘特图内)
- [ ] **Phase1Gantt.jsx** - 核心拖拽逻辑
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
      gantt.attachEvent('onAfterTaskDrag', (id, mode, e) => {
        const task = gantt.getTask(id);
        const newStartDay = Math.round(
          (task.start_date - gantt.config.start_date) / (1000 * 60 * 60 * 24)
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
    }, []);

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
    }, [tasks, validationErrors]);

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

#### 4.4 资源曲线图
- [ ] **ResourceChart.jsx**
  ```jsx
  import React, { useEffect, useRef } from 'react';
  import { useSelector } from 'react-redux';
  import { generateResourceTimeline } from '../../validators/resourceValidator';
  import Chart from 'chart.js/auto';

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
      chartInstance.current = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: days,
          datasets: Object.entries(data).map(([type, values]) => ({
            label: type,
            data: values,
            backgroundColor: values.map((v, i) =>
              v > pool[type] ? 'rgba(255, 99, 99, 0.6)' : 'rgba(99, 132, 255, 0.6)'
            ),
            borderColor: values.map((v, i) =>
              v > pool[type] ? 'rgb(255, 99, 99)' : 'rgb(99, 132, 255)'
            ),
            borderWidth: 1
          }))
        },
        options: {
          responsive: true,
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
            annotation: {
              annotations: Object.entries(pool).map(([type, limit]) => ({
                type: 'line',
                yMin: limit,
                yMax: limit,
                borderColor: 'red',
                borderWidth: 2,
                borderDash: [5, 5],
                label: {
                  content: `${type}上限: ${limit}`,
                  enabled: true
                }
              }))
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
        <canvas ref={chartRef} height="100"></canvas>
      </div>
    );
  }

  export default ResourceChart;
  ```

#### 4.5 简化任务列表
- [ ] **Phase1TaskList.jsx** (不显示CPM数据)
  ```jsx
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
  ```

#### 4.6 验证弹窗(组合方案A+B)
- [ ] **ValidationModal.jsx**
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

    const handleSubmit = async () => {
      setIsSubmitting(true);

      // 执行验证
      const result = validatePhase1Submission(tasks, resourcePool, config);
      dispatch(setValidationErrors(result.errors));

      if (!result.isValid) {
        setIsSubmitting(false);
        return; // 显示错误信息
      }

      // 通过验证，提交到后端
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
      <div className="modal-overlay">
        <div className="validation-modal">
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
                    {dependencies.map((err, idx) => (
                      <li key={idx} className="error-item">
                        {err.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 资源冲突 */}
              {resources.length > 0 && (
                <div className="error-section">
                  <h4>⚠️ 资源冲突 ({resources.length}个时段)</h4>
                  <ul>
                    {resources.map((err, idx) => (
                      <li key={idx} className="error-item">
                        第{err.day}天: {err.resourceType}
                        需求<span className="error-value">{err.required}</span>
                        &gt; 可用<span className="limit-value">{err.available}</span>
                        (超出{err.exceed})
                      </li>
                    ))}
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

#### 4.7 顶部工具栏
- [ ] **Phase1Header.jsx**
  ```jsx
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
  ```

#### 4.8 CSS样式
- [ ] **新建文件**: `Phase1.css`
  ```css
  /* 未放置任务样式 */
  .gantt_task.unplaced-task {
    opacity: 0.5;
    border: 2px dashed #999;
  }

  /* 依赖错误任务样式 */
  .gantt_task.dependency-error {
    border: 3px solid #ff0000;
    box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
  }

  /* 资源曲线图 */
  .resource-chart {
    padding: 1rem;
    background: #f5f5f5;
    border-bottom: 1px solid #ddd;
  }

  /* 验证弹窗 */
  .validation-modal {
    max-width: 600px;
    max-height: 80vh;
    overflow-y: auto;
    background: white;
    padding: 2rem;
    border-radius: 8px;
  }

  .error-section {
    margin: 1rem 0;
    padding: 1rem;
    background: #fff3f3;
    border-left: 4px solid #ff4444;
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
  ```

---

### 任务5: 后端API扩展
**预估工时**: 1天
**依赖**: 无

#### 5.1 数据库迁移
- [ ] **修改文件**: `backend/database-schema.sql` (新建)
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

- [ ] 执行数据库迁移脚本

#### 5.2 修改登录API
- [ ] **修改文件**: `backend/server.js`
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

#### 5.3 新增阶段1提交API
- [ ] **修改文件**: `backend/server.js`
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

#### 5.4 查询阶段状态API(可选)
- [ ] **新增**: `GET /api/user/phase-status`
  ```javascript
  app.get('/api/user/phase-status', authMiddleware, async (req, res) => {
    const userId = req.user.userId;

    try {
      const result = await pool.query(
        'SELECT is_passed, score, submit_attempts FROM Phase1Results WHERE user_id = $1',
        [userId]
      );

      const phase1Data = result.rows[0] || {
        is_passed: false,
        score: 0,
        submit_attempts: 0
      };

      res.json({
        currentPhase: phase1Data.is_passed ? 2 : 1,
        phase1: phase1Data
      });

    } catch (err) {
      console.error('Phase status query error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  ```

---

### 任务6: 阶段切换与路由集成
**预估工时**: 1天
**依赖**: 任务2, 任务4完成

#### 6.1 修改App.jsx主路由
- [ ] **修改文件**: `fronted/src/App.jsx`
  ```jsx
  import { useEffect } from 'react';
  import { useDispatch, useSelector } from 'react-redux';
  import { initializeFromAuth } from './store/gameSlice';
  import { setProjectData } from './store/projectSlice';
  import Login from './components/Login';
  import Phase1Container from './components/Phase1/Phase1Container';
  import Phase2Container from './components/Phase2/Phase2Container'; // 重命名MainApp

  function App() {
    const dispatch = useDispatch();
    const { isAuthenticated, token } = useSelector(state => state.auth);
    const { currentPhase } = useSelector(state => state.game);
    const phase2Loaded = useSelector(state => state.project.present.isLoaded);

    useEffect(() => {
      if (isAuthenticated && token) {
        // 从JWT token解析currentPhase
        try {
          const payload = JSON.parse(atob(token.split('.')[1]));
          dispatch(initializeFromAuth({ currentPhase: payload.currentPhase }));
        } catch (err) {
          console.error('Token parse error:', err);
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

#### 6.2 创建阶段2容器组件
- [ ] **新建目录**: `fronted/src/components/Phase2/`
- [ ] **移动文件**: 将现有组件移入Phase2目录
  - Dashboard.jsx
  - GanttChart.jsx
  - GanttWrapper.jsx
  - TaskList.jsx
  - InspectorPanel.jsx
  - Leaderboard.jsx
  - SubmissionModal.jsx
  - UndoRedo.jsx

- [ ] **新建文件**: `Phase2Container.jsx`
  ```jsx
  import Dashboard from './Dashboard';
  import GanttChart from './GanttChart';
  import TaskList from './TaskList';
  import InspectorPanel from './InspectorPanel';
  import Leaderboard from './Leaderboard';
  import './Phase2.css';

  function Phase2Container() {
    return (
      <div className="phase2-container app-container">
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

  export default Phase2Container;
  ```

#### 6.3 更新导入路径
- [ ] 批量更新所有移动组件的import路径
- [ ] 测试确保阶段2功能完整无损

---

## 🟠 P1级任务 (重要但可后续迭代)

### 任务7: 集成测试与优化
**预估工时**: 1天

#### 7.1 功能测试
- [ ] **阶段1完整流程**
  - 登录 → 看到阶段1界面
  - 拖拽任务到甘特图
  - 触发各种验证错误
  - 修正后成功提交
  - 自动切换到阶段2

- [ ] **阶段2功能验证**
  - 确认现有功能正常
  - Dashboard显示正确
  - 压缩工序生效
  - 排行榜提交成功

- [ ] **重复登录测试**
  - 未通过阶段1: 进入阶段1
  - 已通过阶段1: 直接进入阶段2

#### 7.2 边界情况测试
- [ ] 所有任务堆叠在Day 0(初始状态)
- [ ] 刷新页面(状态丢失，需重新登录)
- [ ] Token过期处理
- [ ] 网络错误处理
- [ ] 后端验证与前端验证的一致性

#### 7.3 性能优化
- [ ] 资源验证防抖(拖拽时不要每次都计算)
- [ ] 甘特图渲染优化(任务数>30时)
- [ ] Redux状态更新优化

#### 7.4 用户体验优化
- [ ] 添加加载动画
- [ ] 拖拽时显示辅助网格线
- [ ] 验证错误高亮甘特图(B方案)
- [ ] 添加操作提示(首次进入时)

---

## 🟢 P2级任务 (锦上添花)

### 任务8: 网络图视图 (阶段2可选)
**预估工时**: 2-3天
**优先级**: 低（阶段2增强功能）

- [ ] 技术选型: D3.js / vis.js
- [ ] 创建 `NetworkDiagram.jsx` 组件
- [ ] 实现AON图布局
- [ ] 高亮关键路径
- [ ] 与TaskList/GanttChart联动

### 任务9: 数据完善
**预估工时**: 1-2天

- [ ] 设计25个任务的阶段2项目
- [ ] 优化阶段1项目的难度曲线
- [ ] 准备多个阶段1项目(不同难度)
- [ ] 调整资源池和阈值平衡性

### 任务10: 高级功能
- [ ] 阶段1"自动修复"按钮(修正依赖违规)
- [ ] 阶段1"查看提示"功能(显示建议放置位置)
- [ ] 导出阶段1排程结果(PDF)
- [ ] 练习/挑战模式切换(隐藏关键路径)

---

## 📋 里程碑规划

### Sprint 1: 核心功能开发 (4天)
**目标**: 阶段1基础功能可运行

- [x] 阶段2现有功能 (已完成)
- [ ] 任务1: 数据层准备 (0.5天)
- [ ] 任务2: Redux重构 (0.5天)
- [ ] 任务3: 验证器引擎 (1天)
- [ ] 任务4: 阶段1 UI (2天)

**验收标准**:
- ✅ 可以拖拽任务到甘特图
- ✅ 资源曲线图正确显示
- ✅ 验证弹窗显示所有错误

### Sprint 2: 后端集成与阶段切换 (2天)
**目标**: 完整流程打通

- [ ] 任务5: 后端API扩展 (1天)
- [ ] 任务6: 阶段切换路由 (1天)

**验收标准**:
- ✅ 登录后正确进入对应阶段
- ✅ 阶段1通过后自动切换
- ✅ 后端存储成绩

### Sprint 3: 测试与优化 (1.5天)
**目标**: 稳定可发布

- [ ] 任务7: 集成测试 (1天)
- [ ] Bug修复与优化 (0.5天)

**验收标准**:
- ✅ 无关键Bug
- ✅ 性能可接受
- ✅ 用户体验流畅

### Sprint 4: 扩展功能 (可选, 3-5天)
- [ ] 任务8: 网络图视图
- [ ] 任务9: 数据完善
- [ ] 任务10: 高级功能

---

## ⚠️ 风险与注意事项

### 技术风险
1. **dhtmlx-gantt拖拽限制**
   - 风险: 默认行为可能修改任务层级
   - 缓解: 使用 `onBeforeTaskDrag` 拦截并限制

2. **实时验证性能**
   - 风险: 15个任务×150天的资源计算可能卡顿
   - 缓解: 防抖优化 + Web Worker(可选)

3. **状态同步问题**
   - 风险: Redux状态与gantt实例不同步
   - 缓解: 单向数据流(Redux → Gantt)

### 用户体验风险
1. **学习曲线陡峭**
   - 风险: 新手不理解规则
   - 缓解: 依赖PDF教程 + 清晰的错误提示

2. **挫败感**
   - 风险: 多次提交失败
   - 缓解: 详细的错误定位 + 甘特图高亮

### 数据设计风险
1. **阈值设置不合理**
   - 风险: 太容易(失去挑战) / 太难(通过率低)
   - 缓解: 内部测试调整参数

2. **资源分配冲突**
   - 风险: 无解或唯一解
   - 缓解: 设计多种可行方案

---

## 📝 开发规范

### 代码规范
- 所有新组件使用函数式组件 + Hooks
- Redux状态更新必须通过dispatch actions
- 验证逻辑与UI逻辑分离
- 关键函数添加JSDoc注释

### 测试要求
- 验证器必须有单元测试
- 关键用户流程必须手动测试
- 提交前检查console.error

### Git提交规范
```
feat: 添加阶段1停车场组件
fix: 修复资源验证bug
refactor: 重构Redux状态结构
test: 添加依赖验证器测试
docs: 更新TODO文档
```

---

## 📌 附录

### 关键设计决策记录

#### 决策1: 两阶段独立项目
**背景**: 原计划阶段2复用阶段1排程结果
**变更**: 两阶段使用完全独立的项目数据
**原因**:
- 简化实现(无需状态传递)
- 阶段1可多次尝试不影响阶段2
- 学生可对比"我的方案 vs 算法方案"

#### 决策2: 停车场方案B(堆叠Day 0)
**对比方案**: 独立停车场区域 vs Day 0堆叠
**选择**: Day 0堆叠
**原因**:
- 实现简单(dhtmlx原生支持)
- 减少UI复杂度
- 满足"拖拽分散"需求

#### 决策3: 验证方案A+B组合
**对比方案**: 仅弹窗 vs 仅高亮 vs 组合
**选择**: 组合方案
**原因**:
- 弹窗提供详细文字说明
- 甘特图高亮提供视觉定位
- 两者互补提升体验

#### 决策4: 阶段1不显示CPM数据
**背景**: 是否显示关键路径、ES/LS等
**选择**: 完全不显示
**原因**:
- 避免学生直接抄答案
- 强调手动排程体验
- 阶段1重点是依赖+资源,不是优化

### 数据文件清单

| 文件路径 | 用途 | 负责人 | 状态 |
|---------|------|--------|------|
| `phase1-project.json` | 阶段1项目数据(15任务) | 先用AI生成,你后续替换 | 待创建 |
| `phase1-config.json` | 阶段1配置(阈值/提示语) | 你提供阈值 | 待创建 |
| `phase2-project.json` | 阶段2项目数据(10任务) | 已存在(改名) | 完成 |
| `phase2-config.json` | 阶段2配置(可选) | 可选 | - |

### 示例JWT Token结构
```json
{
  "userId": 123,
  "name": "张三",
  "studentId": "2021001",
  "currentPhase": 1,  // 关键字段
  "iat": 1696752000,
  "exp": 1696780800
}
```

---

**文档维护者**: Claude Code
**项目路径**: `d:\1_AAA_HJB\Operations Research\project-blueprint`
**最后同步**: 2025-10-07 23:45
