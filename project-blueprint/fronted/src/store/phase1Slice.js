// fronted/src/store/phase1Slice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  projectName: '',
  resourcePool: {},
  tasks: [],
  unplacedTaskIds: [], // 停车场中的任务ID
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

      // 初始化任务：任务A固定在Day 1已放置，其余任务放在Day 0未放置
      state.tasks = projectData.tasks.map((t, index) => ({
        ...t,
        startDay: index === 0 ? 1 : 0, // 第一个任务(A)从Day 1开始
        isPlaced: index === 0 ? true : false, // 第一个任务已放置
        isLocked: index === 0 ? true : false // 第一个任务锁定不可移动
      }));
      state.unplacedTaskIds = projectData.tasks
        .slice(1) // 排除第一个任务
        .map(t => t.id);
    },

    placeTask: (state, action) => {
      const { taskId, startDay } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      if (task && !task.isPlaced) {
        task.startDay = startDay;
        task.isPlaced = true;
        state.unplacedTaskIds = state.unplacedTaskIds.filter(id => id !== taskId);
      }
    },

    moveTask: (state, action) => {
      const { taskId, newStartDay } = action.payload;
      const task = state.tasks.find(t => t.id === taskId);
      // 只允许移动未锁定的任务
      if (task && !task.isLocked) {
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
