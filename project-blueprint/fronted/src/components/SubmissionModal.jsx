// frontend/src/components/SubmissionModal.jsx
import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import axios from 'axios';

function SubmissionModal({ onClose }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ message: '', error: false });

  const { totalCost, totalDuration, totalDirectCost, tasks } = useSelector((state) => state.project.present);
  const token = useSelector((state) => state.auth.token);

  // totalCost 已经包含了间接费用（在 Redux Store 中使用 12,000元/天 计算）
  const lifecycleCost = totalCost;

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus({ message: '', error: false });

    const submissionData = {
      track: 'weighted',
      score: lifecycleCost, // 使用全生命周期总成本作为分数
      projectDuration: totalDuration,
      directCost: totalDirectCost,  // 直接成本
      totalCost: totalCost,  // 全生命周期总成本
      details: {
        lifecycleCost: lifecycleCost,
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
        <p>系统将根据全生命周期总成本进行排名，只保留你的历史最佳成绩。</p>

        <div style={{
          marginTop: '1rem',
          marginBottom: '1rem',
          padding: '1rem',
          background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(33, 150, 243, 0.05) 100%)',
          borderRadius: '8px',
          border: '2px solid #2196f3'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: '600', color: '#1976d2' }}>工期：</span>
            <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>{totalDuration} 天</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
            <span style={{ fontWeight: '600', color: '#1976d2' }}>直接成本：</span>
            <span style={{ fontSize: '1.1em', fontWeight: 'bold' }}>¥{Math.round(totalDirectCost).toLocaleString()}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem', borderTop: '2px solid #2196f3' }}>
            <span style={{ fontWeight: '600', color: '#1565c0', fontSize: '1.1em' }}>全生命周期总成本：</span>
            <span style={{ fontSize: '1.3em', fontWeight: 'bold', color: '#1565c0' }}>¥{Math.round(lifecycleCost).toLocaleString()}</span>
          </div>
        </div>

        {submitStatus.message && (
          <p style={{ color: submitStatus.error ? 'red' : 'green', marginTop: '1rem' }}>
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