// frontend/src/App.jsx
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setProjectData } from './store/projectSlice';
import Leaderboard from './components/Leaderboard'; 
import './App.css';

import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import Login from './components/Login'; // 导入Login组件
import InspectorPanel from './components/InspectorPanel';
import GanttChart from './components/GanttChart';



// 一个简单的主界面组件，包含Dashboard和TaskList
function MainApp() {
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
  // 从 auth slice 中获取认证状态
  const { isAuthenticated } = useSelector((state) => state.auth);
  const projectIsLoaded = useSelector((state) => state.project.present.isLoaded);

  useEffect(() => {
    // 仅在用户已登录且项目数据未加载时，才加载项目数据
    if (isAuthenticated && !projectIsLoaded) {
      const loadProjectData = async () => {
        try {
          const response = await fetch('/initial-project.json');
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          const data = await response.json();
          dispatch(setProjectData(data));
        } catch (error) {
          console.error("加载项目数据失败:", error);
        }
      };
      loadProjectData();
    }
  }, [isAuthenticated, projectIsLoaded, dispatch]);

  // 核心逻辑：根据认证状态显示不同内容
  if (!isAuthenticated) {
    return <Login />;
  }

  // 如果已认证，但数据仍在加载中
  if (!projectIsLoaded) {
    return <div>正在加载项目数据...</div>;
  }
  
  // 如果已认证且数据已加载
  return <MainApp />;
}

export default App;