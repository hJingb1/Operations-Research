import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadPhase1Data } from '../../store/phase1Slice';
import Phase1Header from './Phase1Header';
import ResourceChart from './ResourceChart';
import Phase1Gantt from './Phase1Gantt';
import Phase1TaskList from './Phase1TaskList';
import './Phase1.css';

function Phase1Container() {
  const dispatch = useDispatch();
  const { projectName, tasks } = useSelector(state => state.phase1);

  useEffect(() => {
    // 加载阶段1数据
    const loadData = async () => {
      try {
        const [projectRes, configRes] = await Promise.all([
          fetch('/phase1-project.json'),
          fetch('/phase1-config.json')
        ]);
        const projectData = await projectRes.json();
        const config = await configRes.json();

        dispatch(loadPhase1Data({ projectData, config }));
      } catch (error) {
        console.error('加载阶段1数据失败:', error);
      }
    };
    loadData();
  }, [dispatch]);

  if (tasks.length === 0) {
    return <div className="loading">正在加载阶段1数据...</div>;
  }

  return (
    <div className="phase1-container">
      <Phase1Header />
      <ResourceChart />
      <div className="phase1-main">
        <Phase1Gantt />
        <Phase1TaskList />
      </div>
    </div>
  );
}

export default Phase1Container;