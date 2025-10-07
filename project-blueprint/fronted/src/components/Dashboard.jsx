// frontend/src/components/Dashboard.jsx
import React, {useState} from 'react';
import { useSelector } from 'react-redux';
import SubmissionModal from './SubmissionModal';
import UndoRedo from './UndoRedo';

function Dashboard() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { 
    projectName, 
    totalDuration,
    totalDirectCost,
    totalIndirectCost,
    totalCost 
  } = useSelector((state) => state.project.present);

  return (
    <div>
        <div style={{display: 'flex', justifyContent: 'space-between', alignItems:'center',marginBottom:'1rem'}}>
            <h1>{projectName}</h1>
            <div style ={{display:'flex' , gap:'1rem'}}>
            <UndoRedo />
            <button onClick={() => setIsModalOpen(true)}>提交方案</button>
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