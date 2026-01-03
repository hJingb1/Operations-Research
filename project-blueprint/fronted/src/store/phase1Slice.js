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
      if (task && !task.isPlaced) {
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
