// frontend/src/components/Login.jsx
import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import axios from 'axios';
import { loginStart, loginSuccess, loginFailed } from '../store/authSlice';

// 全角转半角函数
const toHalfWidth = (str) => {
  return str.replace(/[\uff01-\uff5e]/g, (ch) => {
    return String.fromCharCode(ch.charCodeAt(0) - 0xfee0);
  }).replace(/\u3000/g, ' '); // 全角空格转半角空格
};

function Login() {
  const [name, setName] = useState('');
  const [studentId, setStudentId] = useState('');
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      // 提交前转换为半角
      const response = await axios.post('/api/auth/login', {
        name: toHalfWidth(name.trim()),
        studentId: toHalfWidth(studentId.trim())
      });
      dispatch(loginSuccess(response.data));
    } catch (err) {
      const errorMessage = err.response ? err.response.data.error : '登录失败，请检查网络';
      dispatch(loginFailed(errorMessage));
    }
  };

  return (
    <div className="login-container">
      <form onSubmit={handleSubmit} className="login-form">
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">运</div>
          </div>
          <h2 className="login-title">运筹学项目管理模拟器</h2>
          <p className="login-subtitle">Operations Research Project Simulator</p>
        </div>

        <div className="login-inputs">
          <div className="input-group">
            <label htmlFor="name">姓名</label>
            <input
              id="name"
              type="text"
              placeholder="请输入姓名"
              value={name}
              onChange={(e) => setName(toHalfWidth(e.target.value))}
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="studentId">学号</label>
            <input
              id="studentId"
              type="text"
              placeholder="请输入学号"
              value={studentId}
              onChange={(e) => setStudentId(toHalfWidth(e.target.value))}
              required
            />
          </div>
        </div>

        <button type="submit" disabled={status === 'loading'} className="login-button">
          {status === 'loading' ? (
            <>
              <span className="loading-spinner-inline"></span>
              登录中...
            </>
          ) : (
            '登录'
          )}
        </button>

        {status === 'failed' && (
          <div className="login-error">
            <span className="error-icon">⚠️</span>
            {error}
          </div>
        )}
      </form>
    </div>
  );
}

export default Login;