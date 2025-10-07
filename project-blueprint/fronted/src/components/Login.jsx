// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loginStart, loginSuccess, loginFailed } from '../store/authSlice';

function Login() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      // 注意：这里的URL可能需要根据您的开发环境调整
      // Vite的代理功能可以简化这个URL，但现在我们先用全路径
      const response = await axios.post('/api/auth/login', { name, studentId });
      dispatch(loginSuccess(response.data));
    } catch (err) {
      const errorMessage = err.response ? err.response.data.error : '登录失败，请检查网络';
      dispatch(loginFailed(errorMessage));
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <h2>项目管理模拟器登录</h2>
        <input
          type="text"
          placeholder="姓名"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="学号"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
        <button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? '登录中...' : '登录'}
        </button>
        {status === 'failed' && <p className="login-error">{error}</p>}
      </form>
    </div>
  );
}

export default Login;