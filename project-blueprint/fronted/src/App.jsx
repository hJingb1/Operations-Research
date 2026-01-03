// frontend/src/App.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { initializeFromAuth } from './store/gameSlice';
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
      <div className="main-view">
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
        const payload = JSON.parse(atob(token.split('.')[1]));
        dispatch(initializeFromAuth({ currentPhase: payload.currentPhase || 1 }));
      } catch (err) {
        console.error('Token parse error:', err);
        // 默认进入阶段1
        dispatch(initializeFromAuth({ currentPhase: 1 }));
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