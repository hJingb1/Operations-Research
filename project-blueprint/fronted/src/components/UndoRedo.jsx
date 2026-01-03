// frontend/src/components/UndoRedo.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ActionCreators as UndoActionCreators } from 'redux-undo';
import { setProjectData } from '../store/projectSlice';
import initialData from '../../public/phase2-project.json'; // 重新加载初始数据需要

function UndoRedo() {
  const dispatch = useDispatch();
  const { past, future } = useSelector((state) => state.project);

  const handleUndo = () => {
    dispatch(UndoActionCreators.undo());
  };

  const handleRedo = () => {
    dispatch(UndoActionCreators.redo());
  };
  
  const handleReset = () => {
    if (window.confirm('您确定要重置所有操作吗？所有未提交的进度都将丢失。')) {
      // 重置项目最简单的方法就是重新dispatch初始数据
      dispatch(setProjectData(initialData));
    }
  };

  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
      <button onClick={handleUndo} disabled={past.length === 0}>
        撤销 (Undo)
      </button>
      <button onClick={handleRedo} disabled={future.length === 0}>
        重做 (Redo)
      </button>
      <button onClick={handleReset} style={{ backgroundColor: '#dc3545', color: 'white' }}>
        重置项目
      </button>
    </div>
  );
}

export default UndoRedo;