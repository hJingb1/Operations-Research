// frontend/src/components/SubmissionModal.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

function SubmissionModal({ onClose }) {
  const [selectedTrack, setSelectedTrack] = useState('cost'); // 默认选中 'cost'
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', error: false });

  const { totalCost, totalDuration, tasks } = useSelector((state) => state.project.present);
  const token = useSelector((state) => state.auth.token);
  
  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus({ message: '', error: false });

    const score = selectedTrack === 'cost' ? totalCost : totalDuration;
    const submissionData = {
      track: selectedTrack,
      score: score,
      projectDuration: totalDuration,
      totalCost: totalCost,
      details: {
        // 这里可以添加更多想保存的细节
        compressedTasks: tasks.filter(t => t.duration < t.timeNormal).map(t => t.id)
      }
    };

    try {
      const response = await axios.post('/api/submissions', submissionData, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSubmitStatus({ message: response.data.message, error: false });
    } catch (err) {
      const errorMessage = err.response ? err.response.data.error : '提交失败，请检查网络';
      setSubmitStatus({ message: errorMessage, error: true });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>提交你的优化方案</h3>
        <p>请选择一个赛道进行提交。系统将只保留你在该赛道上的历史最佳成绩。</p>
        <div className="track-selection">
          <label>
            <input type="radio" value="cost" checked={selectedTrack === 'cost'} onChange={() => setSelectedTrack('cost')} />
            总成本最低 (当前: ¥{Math.round(totalCost).toLocaleString()})
          </label>
          <label>
            <input type="radio" value="time" checked={selectedTrack === 'time'} onChange={() => setSelectedTrack('time')} />
            总工期最短 (当前: {totalDuration} 天)
          </label>
        </div>
        {submitStatus.message && (
          <p style={{ color: submitStatus.error ? 'red' : 'green' }}>
            {submitStatus.message}
          </p>
        )}
        <div className="modal-actions">
          <button onClick={onClose} disabled={isSubmitting}>关闭</button>
          <button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? '提交中...' : '确认提交'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubmissionModal;