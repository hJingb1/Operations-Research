// frontend/src/simulation-engine/cpm.js

/**
 * 这是项目的核心计算引擎。
 * 它实现了关键路径法 (Critical Path Method, CPM)。
 *
 * 输入: 一个工序(tasks)数组。每个工序对象至少需要包含:
 *   - id: 唯一标识符 (可以是数字或字符串)
 *   - duration: 工期
 *   - predecessors: 一个包含前置工序ID的数组
 *
 * 输出: 一个包含计算结果的对象:
 *   - tasks: 更新后的工序数组，每个工序都增加了ES, EF, LS, LF, slack, isCritical属性
 *   - totalDuration: 项目的总工期
 *   - criticalPath: 一个包含关键路径上所有工序ID的数组
 */
export function calculateProjectSchedule(tasks) {
  if (!tasks || tasks.length === 0) {
    return { tasks: [], totalDuration: 0, criticalPath: [] };
  }

  // 为了方便查找，将数组转换为Map
  const taskMap = new Map(tasks.map(task => [task.id, { ...task }]));

  // 初始化所有任务的计算属性
  for (const task of taskMap.values()) {
    task.successors = [];
    task.ES = 0; // Earliest Start
    task.EF = 0; // Earliest Finish
    task.LS = Infinity; // Latest Start
    task.LF = Infinity; // Latest Finish
    task.slack = 0;
    task.isCritical = false;
  }

  // 构建任务之间的后继关系 (Successors)
  for (const task of taskMap.values()) {
    for (const predId of task.predecessors) {
      const predecessor = taskMap.get(predId);
      if (predecessor) {
        predecessor.successors.push(task.id);
      }
    }
  }

  // 找到所有起始任务 (没有前置任务)
  const startNodes = [...taskMap.values()].filter(t => t.predecessors.length === 0);

  // --- 1. 正推法 (Forward Pass) ---
  // 计算所有任务的最早开始(ES)和最早完成(EF)时间
  const forwardPassQueue = [...startNodes];
  const visited = new Set();
  
  while (forwardPassQueue.length > 0) {
    const currentTask = forwardPassQueue.shift();
    if (visited.has(currentTask.id)) continue;
    visited.add(currentTask.id);

    // 计算当前任务的EF
    currentTask.EF = currentTask.ES + currentTask.duration;

    // 更新其所有后继任务的ES
    for (const succId of currentTask.successors) {
      const successor = taskMap.get(succId);
      // 后继任务的ES，是其所有前置任务EF的最大值
      successor.ES = Math.max(successor.ES, currentTask.EF);
      forwardPassQueue.push(successor);
    }
  }

  // 项目总工期是所有任务中EF的最大值
  const totalDuration = Math.max(0, ...[...taskMap.values()].map(t => t.EF));

  // --- 2. 逆推法 (Backward Pass) ---
  // 计算所有任务的最晚完成(LF)和最晚开始(LS)时间
  
  // 找到所有结束任务 (没有后继任务)
  const endNodes = [...taskMap.values()].filter(t => t.successors.length === 0);
  for (const task of endNodes) {
    task.LF = totalDuration; // 结束任务的LF就是项目总工期
  }

  const backwardPassQueue = [...endNodes];
  const visitedBackwards = new Set();

  while (backwardPassQueue.length > 0) {
    const currentTask = backwardPassQueue.shift();
    if (visitedBackwards.has(currentTask.id)) continue;
    visitedBackwards.add(currentTask.id);
    
    // 计算当前任务的LS
    currentTask.LS = currentTask.LF - currentTask.duration;
    
    // 更新其所有前置任务的LF
    for (const predId of currentTask.predecessors) {
        const predecessor = taskMap.get(predId);
        // 前置任务的LF，是其所有后继任务LS的最小值
        predecessor.LF = Math.min(predecessor.LF, currentTask.LS);
        backwardPassQueue.push(predecessor);
    }
  }

  // --- 3. 计算时差和关键路径 ---
  const criticalPath = [];
  for (const task of taskMap.values()) {
    task.slack = task.LF - task.EF;
    // 关键任务的时差(slack)为0 (或一个非常小的数以应对浮点数精度问题)
    if (task.slack < 1e-5) {
      task.isCritical = true;
      criticalPath.push(task.id);
    }
  }

  return {
    tasks: Array.from(taskMap.values()),
    totalDuration,
    criticalPath,
  };
}


// --- 用于独立测试的示例 ---
export function runTest() {
  console.log("Running CPM calculation test...");
  
  const sampleTasks = [
    { id: 'A', duration: 3, predecessors: [] },
    { id: 'B', duration: 5, predecessors: ['A'] },
    { id: 'C', duration: 7, predecessors: ['A'] },
    { id: 'D', duration: 2, predecessors: ['B', 'C'] },
    { id: 'E', duration: 4, predecessors: ['D'] },
  ];

  const result = calculateProjectSchedule(sampleTasks);

  console.log("Calculation Result:");
  console.log("Total Duration:", result.totalDuration); // 预期: 3 + 7 + 2 + 4 = 16
  console.log("Critical Path:", result.criticalPath); // 预期: ['A', 'C', 'D', 'E']
  console.table(result.tasks); // 以表格形式打印所有任务的详细信息
}

// 在非浏览器环境（如Node.js直接运行）下执行测试
// if (typeof window === 'undefined') {
//   runTest();
// }
