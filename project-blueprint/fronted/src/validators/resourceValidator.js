// fronted/src/validators/resourceValidator.js

/**
 * 检测资源超限时段
 * @param {Array} tasks - 任务数组
 * @param {Object} resourcePool - 资源池 {worker: 80, crane: 3}
 * @returns {Array} 冲突列表
 */
export function detectResourceConflicts(tasks, resourcePool) {
  const placedTasks = tasks.filter(t => t.isPlaced);
  if (placedTasks.length === 0) return [];

  // 计算项目时间范围
  const maxDay = Math.max(
    ...placedTasks.map(t => t.startDay + t.duration)
  );

  // 按天累加资源需求
  const timeline = {};
  for (let day = 0; day <= maxDay; day++) {
    timeline[day] = {};
  }

  placedTasks.forEach(task => {
    for (let day = task.startDay; day < task.startDay + task.duration; day++) {
      if (task.resources) {
        Object.entries(task.resources).forEach(([type, amount]) => {
          timeline[day][type] = (timeline[day][type] || 0) + amount;
        });
      }
    }
  });

  // 检测超限
  const conflicts = [];
  Object.entries(timeline).forEach(([day, usage]) => {
    Object.entries(usage).forEach(([resourceType, required]) => {
      const available = resourcePool[resourceType] || 0;
      if (required > available) {
        conflicts.push({
          day: parseInt(day),
          resourceType,
          required,
          available,
          exceed: required - available,
          message: `第${day}天${resourceType}需求${required} > 可用${available}`
        });
      }
    });
  });

  return conflicts;
}

/**
 * 生成资源使用时间轴数据(用于图表绘制)
 */
export function generateResourceTimeline(tasks, resourcePool) {
  const placedTasks = tasks.filter(t => t.isPlaced);
  if (placedTasks.length === 0) return { days: [], data: {}, pool: resourcePool };

  const maxDay = Math.max(...placedTasks.map(t => t.startDay + t.duration));
  const days = Array.from({ length: maxDay + 1 }, (_, i) => i);
  const data = {};

  // 初始化每种资源的数组
  Object.keys(resourcePool).forEach(type => {
    data[type] = new Array(maxDay + 1).fill(0);
  });

  placedTasks.forEach(task => {
    for (let day = task.startDay; day < task.startDay + task.duration; day++) {
      if (task.resources) {
        Object.entries(task.resources).forEach(([type, amount]) => {
          if (data[type]) {
            data[type][day] += amount;
          }
        });
      }
    }
  });

  return { days, data, pool: resourcePool };
}
