// frontend/src/components/GanttChart.jsx
import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { selectTask } from '../store/projectSlice';
import GanttWrapper from './GanttWrapper';

// 辅助函数：将日期对象格式化为 "YYYY-MM-DD" 字符串
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function GanttChart() {
  const dispatch = useDispatch();
  const tasks = useSelector((state) => state.project.present.tasks);

  // --- 核心数据转换逻辑 ---
  const ganttData = {
    // 1. 转换任务数据 (Tasks)
    data: tasks.map(task => {
      const baseDate = new Date(); // 使用一个基准日期
      // 必须为每个任务创建一个新的Date对象来计算，避免引用同一个对象
      const startDate = new Date(baseDate.setDate(baseDate.getDate() + task.ES));

      return {
        id: task.id,
        text: `${task.id}: ${task.name}`, // 在任务条上显示ID和名称
        start_date: formatDate(startDate), // 使用格式化后的日期字符串
        duration: task.duration,
        progress: 1,
        color: task.isCritical ? '#d32f2f' : '#1976d2', // 关键路径颜色
        textColor: '#ffffff' // 文字颜色
      };
    }),
    // 2. 生成依赖连线数据 (Links)
    links: tasks.flatMap(task => 
      task.predecessors.map(predId => ({
        id: `${predId}-${task.id}`, // 创建唯一ID
        source: predId,           // 源任务ID
        target: task.id,           // 目标任务ID
        type: '0'                  // '0' 代表 Finish to Start
      }))
    )
  };

  const handleTaskClick = (taskId) => {
    dispatch(selectTask(taskId));
  };

  return (
    <div>
      <h2 className="gantt-title">项目甘特图</h2>
      {tasks.length > 0 ? (
        <GanttWrapper data={ganttData} onTaskClick={handleTaskClick} />
      ) : (
        <p>正在加载甘特图数据...</p>
      )}
    </div>
  );
}

export default GanttChart;