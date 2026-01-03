// fronted/src/validators/dependencyValidator.js

/**
 * 验证所有任务的前置依赖关系
 * @param {Array} tasks - 任务数组
 * @returns {Array} 违规列表
 */
export function validateDependencies(tasks) {
  const errors = [];

  tasks.forEach(task => {
    if (!task.isPlaced) return; // 未放置的任务不检查

    task.predecessors.forEach(predId => {
      const pred = tasks.find(t => t.id === predId);

      if (!pred) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          predId,
          message: `前置任务${predId}不存在`
        });
        return;
      }

      if (!pred.isPlaced) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          predId,
          predName: pred.name,
          message: `前置任务${pred.name}尚未放置`
        });
        return;
      }

      const predEndDay = pred.startDay + pred.duration;
      if (predEndDay > task.startDay) {
        errors.push({
          taskId: task.id,
          taskName: task.name,
          taskStartDay: task.startDay,
          predId,
          predName: pred.name,
          predEndDay,
          message: `${task.name}(第${task.startDay}天开始)早于前置任务${pred.name}(第${predEndDay}天完成)`
        });
      }
    });
  });

  return errors;
}
