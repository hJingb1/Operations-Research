import React from 'react';
import { useSelector } from 'react-redux';

function Phase1TaskList() {
  const { tasks } = useSelector(state => state.phase1);

  return (
    <div className="phase1-task-list">
      <h3>任务列表</h3>
      <table>
        <thead>
          <tr>
            <th>ID</th>
            <th>任务名称</th>
            <th>工期(天)</th>
            <th>前置任务</th>
            <th>开始时间</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          {tasks.map(task => (
            <tr key={task.id}>
              <td>{task.id}</td>
              <td>{task.name}</td>
              <td>{task.duration}</td>
              <td>{task.predecessors.join(', ') || '无'}</td>
              <td>{task.isPlaced ? `第${task.startDay}天` : '-'}</td>
              <td>
                {task.isPlaced ? '✓ 已放置' : '待放置'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Phase1TaskList;