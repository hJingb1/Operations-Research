import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { moveTask, placeTask } from '../../store/phase1Slice';
import gantt from 'dhtmlx-gantt';
import 'dhtmlx-gantt/codebase/dhtmlxgantt.css';

function Phase1Gantt() {
  const dispatch = useDispatch();
  const ganttContainer = useRef(null);
  const { tasks, validationErrors, config } = useSelector(state => state.phase1);

  useEffect(() => {
    // 配置gantt为可编辑模式
    gantt.config.readonly = false;
    gantt.config.drag_move = true;
    gantt.config.drag_links = false; // 不允许修改依赖关系
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.show_grid = true;

    // 自定义任务样式
    gantt.templates.task_class = (start, end, task) => {
      let classes = [];

      // 未放置的任务(堆叠在Day 0)
      if (!task.isPlaced) {
        classes.push('unplaced-task');
      }

      // 违反依赖的任务
      const hasDependencyError = validationErrors.dependencies
        .some(err => err.taskId === task.id);
      if (hasDependencyError) {
        classes.push('dependency-error');
      }

      return classes.join(' ');
    };

    // 拖拽结束事件
    gantt.attachEvent('onAfterTaskDrag', (id, mode) => {
      const task = gantt.getTask(id);
      // 使用配置文件中的项目起始日期
      const baseDate = new Date(config.projectStartDate || '2025-01-01');
      const newStartDay = Math.round(
        (task.start_date - baseDate) / (1000 * 60 * 60 * 24)
      );

      if (!task.isPlaced && newStartDay > 0) {
        // 首次从停车场拖出
        dispatch(placeTask({ taskId: id, startDay: newStartDay }));
      } else {
        // 调整已放置任务的位置
        dispatch(moveTask({ taskId: id, newStartDay }));
      }
    });

    gantt.init(ganttContainer.current);

    return () => {
      gantt.clearAll();
    };
  }, [dispatch, config.projectStartDate]); // 移除validationErrors.dependencies依赖，避免重复初始化

  useEffect(() => {
    // 更新甘特图数据
    const baseDate = new Date(config.projectStartDate || '2025-01-01');

    const ganttData = {
      data: tasks.map(task => ({
        id: task.id,
        text: `${task.id}: ${task.name}`,
        start_date: new Date(baseDate.getTime() + task.startDay * 24 * 60 * 60 * 1000),
        duration: task.duration,
        progress: 0,
        isPlaced: task.isPlaced
      })),
      links: [] // 阶段1不显示依赖连线(避免提示)
    };

    gantt.clearAll();
    gantt.parse(ganttData);

    // 强制刷新任务样式（应用dependency-error类）
    gantt.render();
  }, [tasks, validationErrors.dependencies, config.projectStartDate]);

  return (
    <div className="phase1-gantt-wrapper">
      <h3>项目甘特图 - 拖动任务到合适位置</h3>
      <div
        ref={ganttContainer}
        style={{ width: '100%', height: '500px' }}
      />
    </div>
  );
}

export default Phase1Gantt;