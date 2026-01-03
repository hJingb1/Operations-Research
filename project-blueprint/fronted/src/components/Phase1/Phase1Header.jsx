import React, { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../../store/authSlice';
import ValidationModal from './ValidationModal';

function Phase1Header() {
  const dispatch = useDispatch();
  const [showModal, setShowModal] = useState(false);
  const { projectName, unplacedTaskIds } = useSelector(state => state.phase1);

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      dispatch(logout());
      window.location.reload(); // 刷新页面回到登录界面
    }
  };

  return (
    <div className="phase1-header">
      <div className="header-left">
        <div className="header-logo">
          <div className="header-logo-icon">运</div>
          <div className="header-title-group">
            <h1 className="header-title">{projectName}</h1>
            <span className="header-phase-badge">阶段1: 手动排程训练</span>
          </div>
        </div>
      </div>

      <div className="header-center">
        <div className="header-info-card">
          <div className="info-icon">📋</div>
          <div className="info-content">
            <span className="info-label">待放置任务</span>
            <span className={`unplaced-count ${unplacedTaskIds.length > 0 ? 'has-tasks' : 'all-placed'}`}>
              {unplacedTaskIds.length}
            </span>
          </div>
        </div>
      </div>

      <div className="header-right">
        <button
          onClick={() => setShowModal(true)}
          className="btn-submit-phase1"
        >
          <span className="btn-icon">✓</span>
          提交阶段1
        </button>
        <button
          onClick={handleLogout}
          className="btn-logout"
          title="退出登录"
        >
          <span className="btn-icon">⎋</span>
          退出登录
        </button>
      </div>

      <ValidationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default Phase1Header;