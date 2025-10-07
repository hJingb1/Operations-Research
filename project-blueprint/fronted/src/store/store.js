// frontend/src/store/store.js
import { configureStore } from '@reduxjs/toolkit';
import projectReducer from './projectSlice';
import authReducer from './authSlice'; // 1. 导入新的 reducer

export const store = configureStore({
  reducer: {
    project: projectReducer,
    auth: authReducer, // 2. 添加到 reducer 列表中
  },
});