// frontend/src/store/authSlice.js
import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  token: localStorage.getItem('token') || null, // 尝试从本地存储中恢复token
  isAuthenticated: !!localStorage.getItem('token'),
  user: null, // 将来可以存放解码后的用户信息
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginStart: (state) => {
      state.status = 'loading';
    },
    loginSuccess: (state, action) => {
      state.status = 'succeeded';
      state.isAuthenticated = true;
      state.token = action.payload.token;
      localStorage.setItem('token', action.payload.token); // 将token存入本地存储
    },
    loginFailed: (state, action) => {
      state.status = 'failed';
      state.error = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.isAuthenticated = false;
      state.user = null;
      localStorage.removeItem('token'); // 从本地存储中移除token
    },
  },
});

export const { loginStart, loginSuccess, loginFailed, logout } = authSlice.actions;
export default authSlice.reducer;