// frontend/src/App.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeFromAuth } from './store/gameSlice';
import { logout } from './store/authSlice';
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
      <div className="main-view phase2-main">
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
        console.log('🔍 解析Token...');
        console.log('📝 Token原始值:', token);

        // 验证token格式
        const parts = token.split('.');
        if (parts.length !== 3) {
          throw new Error('Token格式错误：应该包含3个部分');
        }

        // 解析payload（Base64URL解码）
        const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        const payload = JSON.parse(jsonPayload);
        console.log('📦 Token payload:', payload);
        console.log('🎯 currentPhase from token:', payload.currentPhase);

        dispatch(initializeFromAuth({ currentPhase: payload.currentPhase || 1 }));

        console.log('✅ 已设置currentPhase为:', payload.currentPhase || 1);
      } catch (err) {
        console.error('❌ Token parse error:', err);
        console.error('❌ Token值:', token);
        // Token解析失败，清除登录状态
        alert('Token解析失败，请重新登录');
        dispatch(logout());
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
  console.log('🔄 App渲染 - isAuthenticated:', isAuthenticated, 'currentPhase:', currentPhase, 'phase2Loaded:', phase2Loaded);

  if (!isAuthenticated) {
    console.log('➡️ 显示登录页面');
    return <Login />;
  }

  if (currentPhase === 1) {
    console.log('➡️ 显示阶段1');
    return <Phase1Container />;
  }

  if (currentPhase === 2) {
    console.log('➡️ 进入阶段2，phase2Loaded:', phase2Loaded);
    if (!phase2Loaded) {
      console.log('⏳ 正在加载阶段2数据...');
      return <div className="loading">正在加载阶段2数据...</div>;
    }
    console.log('✅ 显示阶段2界面');
    return <Phase2Container />;
  }

  console.log('❓ Unknown phase:', currentPhase);
  return <div>Unknown phase</div>;
}

export default App;