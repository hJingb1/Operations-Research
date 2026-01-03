// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './projectSlice';
import authReducer from './authSlice';
import gameReducer from './gameSlice';
import phase1Reducer from './phase1Slice';

export const store = configureStore({
  reducer: {
    project: projectReducer, // 阶段2使用
    auth: authReducer,
    game: gameReducer, // 阶段管理
    phase1: phase1Reducer, // 阶段1使用
  },
});