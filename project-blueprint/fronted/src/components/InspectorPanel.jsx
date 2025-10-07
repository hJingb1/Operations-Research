// frontend/src/components/InspectorPanel.jsx
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { compressTask } from '../store/projectSlice';

function InspectorPanel() {
  const dispatch = useDispatch();
  const { tasks, selectedTaskId } = useSelector((state) => state.project.present);
  const selectedTask = tasks.find(task => task.id === selectedTaskId);
  
  const [newDuration, setNewDuration] = useState('');

  // 当选中的任务变化时，更新输入框的值以反映当前工期
  useEffect(() => {
    if (selectedTask) {
      setNewDuration(selectedTask.duration);
    }
  }, [selectedTask]);

  const handleCompress = () => {
    const durationValue = parseInt(newDuration, 10);
    // 输入验证
    if (isNaN(durationValue) || durationValue < selectedTask.timeCrash || durationValue > selectedTask.timeNormal) {
      alert(`请输入 ${selectedTask.timeCrash} 到 ${selectedTask.timeNormal} 之间的有效工期。`);
      return;
    }
    dispatch(compressTask({ taskId: selectedTask.id, newDuration: durationValue }));
  };

  if (!selectedTask) {
    return (
      <div className="inspector-panel">
        <h3>任务详情</h3>
        <p>请从左侧列表中选择一个任务以查看其详细信息。</p>
      </div>
    );
  }

  return (
    <div className="inspector-panel">
      <h3>{selectedTask.name}</h3>
      <p><strong>标准工期:</strong> {selectedTask.timeNormal} 天</p>
      <p><strong>应急工期:</strong> {selectedTask.timeCrash} 天</p>
      <p><strong>标准成本:</strong> ¥{selectedTask.costNormal.toLocaleString()}</p>
      <p><strong>应急成本:</strong> ¥{selectedTask.costCrash.toLocaleString()}</p>
      <p><strong>是否关键:</strong> {selectedTask.isCritical ? '是' : '否'}</p>
      <hr/>
      {selectedTask.compressible ? (
        <div>
          <h4>压缩工期</h4>
          <input 
            type="number"
            value={newDuration}
            onChange={(e) => setNewDuration(e.target.value)}
          />
          <button onClick={handleCompress} style={{ marginLeft: '10px' }}>
            应用变更
          </button>
        </div>
      ) : (
        <p><i>此任务不可压缩。</i></p>
      )}
    </div>
  );
}
export default InspectorPanel;