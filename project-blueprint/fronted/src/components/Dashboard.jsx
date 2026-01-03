// frontend/src/components/Dashboard.jsx
import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../store/authSlice';
import SubmissionModal from './SubmissionModal';
import UndoRedo from './UndoRedo';

function Dashboard() {
  const dispatch = useDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const {
    totalDuration,
    totalDirectCost,
    totalIndirectCost,
    totalCost
  } = useSelector((state) => state.project.present);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      dispatch(logout());
      window.location.reload();
    }
  };

  return (
    <div>
        <div className="phase2-header">
          <div className="phase2-title-section">
            <div className="phase2-logo-icon">运</div>
            <div className="phase2-title-group">
              <h1 className="phase2-title">运筹学课程设计项目</h1>
              <span className="phase2-subtitle">Operations Research Course Design</span>
            </div>
          </div>
          <div className="phase2-actions">
            <UndoRedo />
            <button onClick={() => setIsModalOpen(true)} className="btn-submit-solution">
              <span className="btn-icon">📤</span>
              提交方案
            </button>
            <button
              onClick={handleLogout}
              className="btn-logout-phase2"
            >
              <span className="btn-icon">⎋</span>
              退出登录
            </button>
          </div>
        </div>

      <div className="dashboard">
        <div className="dashboard-metric">
          <label>总工期 (天)</label>
          <span>{totalDuration}</span>
        </div>
        <div className="dashboard-metric">
          <label>总直接费用 (元)</label>
          <span>¥{Math.round(totalDirectCost).toLocaleString()}</span>
        </div>
        <div className="dashboard-metric">
          <label>总间接费用 (元)</label>
          <span>¥{Math.round(totalIndirectCost).toLocaleString()}</span>
        </div>
        <div className="dashboard-metric">
          <label>项目总费用 (元)</label>
          <span>¥{Math.round(totalCost).toLocaleString()}</span>
        </div>
      </div>
      {isModalOpen && <SubmissionModal onClose={() => setIsModalOpen(false)} />}
    </div>
  );
}

export default Dashboard;