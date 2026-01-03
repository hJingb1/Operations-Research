import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { validatePhase1Submission } from '../../validators/phase1Validator';
import { markPassed } from '../../store/phase1Slice';
import { setPhase1Result } from '../../store/gameSlice';
import axios from 'axios';

function ValidationModal({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentValidation, setCurrentValidation] = useState(null);
  const { tasks, resourcePool, config } = useSelector(state => state.phase1);
  const { token } = useSelector(state => state.auth);

  // 每次打开弹窗时重新验证
  useEffect(() => {
    if (isOpen && tasks.length > 0) {
      const result = validatePhase1Submission(tasks, resourcePool, config);
      setCurrentValidation(result);
    }
  }, [isOpen, tasks, resourcePool, config]);

  const handleSubmit = async () => {
    if (!currentValidation || !currentValidation.isValid) {
      return;
    }

    // 通过验证，提交到后端
    setIsSubmitting(true);
    try {
      const response = await axios.post(
        '/api/phase1/submit',
        {
          finalDuration: currentValidation.errors.duration.current,
          taskPlacements: tasks.filter(t => t.isPlaced).map(t => ({
            taskId: t.id,
            startDay: t.startDay
          }))
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      // 更新状态并切换到阶段2
      dispatch(markPassed());
      dispatch(setPhase1Result({ score: response.data.score }));

      alert(config.validationMessages.pass);
      onClose();
      // 页面将自动切换到阶段2(通过App.jsx的逻辑)

    } catch (error) {
      console.error('提交失败:', error);
      alert('提交失败，请稍后重试: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !currentValidation) return null;

  const { duration, dependencies, resources, unplaced } = currentValidation.errors;
  const hasErrors = !currentValidation.isValid;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="validation-modal" onClick={(e) => e.stopPropagation()}>
        <h2>提交验证</h2>

        {hasErrors ? (
          <div className="validation-errors">
            <h3>❌ 提交失败，请修正以下问题：</h3>

            {/* 工期问题 */}
            {!duration.isValid && (
              <div className="error-section">
                <h4>📅 工期超限</h4>
                <p>当前总工期：{duration.current}天</p>
                <p>要求：≤ {duration.max}天</p>
              </div>
            )}

            {/* 未放置任务 */}
            {unplaced.length > 0 && (
              <div className="error-section">
                <h4>📋 未放置任务 ({unplaced.length}个)</h4>
                <ul>
                  {unplaced.map(err => (
                    <li key={err.taskId}>{err.taskId}: {err.taskName}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* 依赖问题 */}
            {dependencies.length > 0 && (
              <div className="error-section">
                <h4>⛓️ 前置依赖违规 ({dependencies.length}个)</h4>
                <ul>
                  {dependencies.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="error-item">
                      {err.message}
                    </li>
                  ))}
                  {dependencies.length > 5 && <li>...还有{dependencies.length - 5}个错误</li>}
                </ul>
              </div>
            )}

            {/* 资源冲突 */}
            {resources.length > 0 && (
              <div className="error-section">
                <h4>⚠️ 资源冲突 ({resources.length}个时段)</h4>
                <ul>
                  {resources.slice(0, 5).map((err, idx) => (
                    <li key={idx} className="error-item">
                      第{err.day}天: {err.resourceType}
                      需求<span className="error-value">{err.required}</span>
                      &gt; 可用<span className="limit-value">{err.available}</span>
                      (超出{err.exceed})
                    </li>
                  ))}
                  {resources.length > 5 && <li>...还有{resources.length - 5}个冲突</li>}
                </ul>
              </div>
            )}

            <button onClick={onClose} className="btn-back">
              返回修改
            </button>
          </div>
        ) : (
          <div className="validation-success">
            <h3>✓ 验证通过！</h3>
            <p>总工期：{duration.current}天（≤ {duration.max}天）</p>
            <p>所有依赖关系满足 ✓</p>
            <p>无资源冲突 ✓</p>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="btn-submit"
            >
              {isSubmitting ? '提交中...' : '确认提交并进入阶段2'}
            </button>
            <button onClick={onClose} className="btn-cancel">
              取消
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default ValidationModal;