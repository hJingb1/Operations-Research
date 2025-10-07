// frontend/src/store/projectSlice.js
import { createSlice } from '@reduxjs/toolkit';
import { calculateProjectSchedule } from '../simulation-engine/cpm';
import undoable from 'redux-undo';

const initialState = {
  // ... (其他 state 属性)
  projectName: '',
  tasks: [],
  totalDuration: 0,
  criticalPath: [],
  isLoaded: false,
  selectedTaskId: null,
  indirectCostPerDay: 0, // 【新增】
  totalDirectCost: 0,    // 【新增】
  totalIndirectCost: 0,  // 【新增】
  totalCost: 0,          // 【新增】
};

// 一个辅助函数，用于计算所有成本
const calculateAllCosts = (tasks, totalDuration, indirectCostPerDay) => {
  const totalDirectCost = tasks.reduce((sum, task) => {
    // 根据当前工期，通过线性插值计算当前直接成本
    const durationRange = task.timeNormal - task.timeCrash;
    // 如果任务不可压缩，durationRange为0，避免除以0的错误
    const durationRatio = durationRange === 0 ? 0 : (task.timeNormal - task.duration) / durationRange;
    const currentCost = task.costNormal + (task.costCrash - task.costNormal) * durationRatio;
    // 如果计算结果不是数字(例如不可压缩任务)，则使用其正常成本
    return sum + (isNaN(currentCost) ? task.costNormal : currentCost);
  }, 0);
  const totalIndirectCost = totalDuration * indirectCostPerDay;
  const totalCost = totalDirectCost + totalIndirectCost;
  return { totalDirectCost, totalIndirectCost, totalCost };
};

const projectSlice = createSlice({
  name: 'project',
  initialState,
  reducers: {
    setProjectData: (state, action) => {
      const rawData = action.payload;
      state.projectName = rawData.projectName;
      state.indirectCostPerDay = rawData.indirectCostPerDay;

      // 为每个任务添加一个可变的 'duration' 属性，初始值为 'timeNormal'
      const tasksWithDuration = rawData.tasks.map(t => ({ ...t, duration: t.timeNormal }));

      // 运行CPM计算
      const result = calculateProjectSchedule(tasksWithDuration);
      
      state.tasks = result.tasks;
      state.totalDuration = result.totalDuration;
      state.criticalPath = result.criticalPath;
      
      // 计算初始成本
      const costs = calculateAllCosts(state.tasks, state.totalDuration, state.indirectCostPerDay);
      state.totalDirectCost = costs.totalDirectCost;
      state.totalIndirectCost = costs.totalIndirectCost;
      state.totalCost = costs.totalCost;

      state.isLoaded = true;
    },
    selectTask: (state, action) => {
      state.selectedTaskId = action.payload;
    },
    // 【新增的 Reducer】
    compressTask: (state, action) => {
      const { taskId, newDuration } = action.payload;
      const taskToUpdate = state.tasks.find(t => t.id === taskId);

      if (taskToUpdate) {
        taskToUpdate.duration = newDuration;

        // 重新计算整个项目
        const result = calculateProjectSchedule(state.tasks);
        state.tasks = result.tasks;
        state.totalDuration = result.totalDuration;
        state.criticalPath = result.criticalPath;
        
        // 重新计算所有成本
        const costs = calculateAllCosts(state.tasks, state.totalDuration, state.indirectCostPerDay);
        state.totalDirectCost = costs.totalDirectCost;
        state.totalIndirectCost = costs.totalIndirectCost;
        state.totalCost = costs.totalCost;

        // 保持任务选中状态
        state.selectedTaskId = taskId;
      }
    },
  },
});

export const { setProjectData, selectTask, compressTask } = projectSlice.actions;

const undoableProjectReducer = undoable(projectSlice.reducer, {
    limit: 20, // 设置历史记录的最大长度
    filter: (action) => action.type ===compressTask.type // 只对 compressTask 操作启用撤销功能
});

export default undoableProjectReducer;
//