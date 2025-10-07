// frontend/src/components/TaskList.jsx
import React from 'react';
import { useSelector, useDispatch} from 'react-redux';
import { selectTask } from '../store/projectSlice';

function TaskList() {
  const {tasks, selectedTaskId} = useSelector((state) => state.project.present);
  const dispatch = useDispatch();

  const getRowClassName = (task) =>{
    let className = '';
    if(task.isCritical){
      className += ' critical-task';
    }
    if(task.id === selectedTaskId){
      className += ' selected-task';
    }
    return className;
  }


  return (
    <div>
      <h2>任务详情列表</h2>
      <table className="task-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>任务名称</th>
            <th>工期</th>
            <th>最早开始 (ES)</th>
            <th>最早完成 (EF)</th>
            <th>最晚开始 (LS)</th>
            <th>最晚完成 (LF)</th>
            <th>总时差 (Slack)</th>
          </tr>
        </thead>
        <tbody>
            
          {tasks.map((task) => (
            <tr 
            key={task.id} 
            className={getRowClassName(task)}
            onClick={() => dispatch(selectTask(task.id))}
            style={{ cursor: 'pointer' }} >
              <td>{task.id}</td>
              <td>{task.name}</td>
              <td>{task.duration}</td>
              <td>{task.ES}</td>
              <td>{task.EF}</td>
              <td>{task.LS}</td>
              <td>{task.LF}</td>
              <td>{task.slack.toFixed(2)}</td> {/* 保留两位小数 */}
            </tr>
          ))}
        </tbody>

      </table>
    </div>
  );
}

export default TaskList;