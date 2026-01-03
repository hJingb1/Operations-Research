import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import ValidationModal from './ValidationModal';

function Phase1Header() {
  const [showModal, setShowModal] = useState(false);
  const { projectName, unplacedTaskIds } = useSelector(state => state.phase1);

  return (
    <div className="phase1-header">
      <h1>{projectName}</h1>
      <div className="header-info">
        <span>阶段1: 手动排程训练</span>
        <span className="unplaced-count">
          待放置任务: {unplacedTaskIds.length}
        </span>
      </div>
      <button
        onClick={() => setShowModal(true)}
        className="btn-submit-phase1"
      >
        提交阶段1
      </button>

      <ValidationModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}

export default Phase1Header;