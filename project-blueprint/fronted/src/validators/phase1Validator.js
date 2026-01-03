// fronted/src/validators/phase1Validator.js
import { validateDependencies } from './dependencyValidator';
import { detectResourceConflicts } from './resourceValidator';

/**
 * 阶段1完整验证
 * @param {Array} tasks - 任务数组
 * @param {Object} resourcePool - 资源池
 * @param {Object} config - 配置
 * @returns {Object} { isValid: boolean, errors: {...} }
 */
export function validatePhase1Submission(tasks, resourcePool, config) {
  const errors = {
    duration: { current: 0, max: config.maxDuration, isValid: true },
    dependencies: [],
    resources: [],
    unplaced: []
  };

  // 1. 检查是否所有任务已放置
  const unplacedTasks = tasks.filter(t => !t.isPlaced);
  if (unplacedTasks.length > 0) {
    errors.unplaced = unplacedTasks.map(t => ({
      taskId: t.id,
      taskName: t.name
    }));
  }

  // 2. 计算总工期
  const placedTasks = tasks.filter(t => t.isPlaced);
  if (placedTasks.length > 0) {
    const totalDuration = Math.max(
      ...placedTasks.map(t => t.startDay + t.duration)
    );
    errors.duration.current = totalDuration;
    errors.duration.isValid = totalDuration <= config.maxDuration;
  }

  // 3. 验证依赖关系
  errors.dependencies = validateDependencies(tasks);

  // 4. 验证资源冲突
  errors.resources = detectResourceConflicts(tasks, resourcePool);

  // 判断整体是否通过
  const isValid =
    errors.unplaced.length === 0 &&
    errors.duration.isValid &&
    errors.dependencies.length === 0 &&
    errors.resources.length === 0;

  return { isValid, errors };
}
