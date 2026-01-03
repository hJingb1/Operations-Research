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
    gantt.config.start_date = new Date(config.projectStartDate || '2025-01-01');
    gantt.config.end_date = new Date(config.projectEndDate || '2025-03-01');
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.show_grid = true;
    gantt.config.grid_width = 350; // 左侧网格宽度
    gantt.config.column_width = 40; // 每天列宽
    gantt.config.show_task_cells = false; // 禁用添加任务按钮
    gantt.config.show_quick_info = false; // 禁用快速信息
    gantt.config.show_add_column = false; // 禁用添加列按钮

    // 禁止拖动锁定的任务
    gantt.attachEvent('onBeforeTaskDrag', (id) => {
      const task = gantt.getTask(id);
      if (task.isLocked) {
        return false; // 阻止拖拽
      }
      return true;
    });

    // 自定义任务样式
    gantt.templates.task_class = (start, end, task) => {
      let classes = [];

      // 锁定的任务
      if (task.isLocked) {
        classes.push('locked-task');
      }

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

      // 防止拖拽后视图自动滚动
      return false;
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
        isPlaced: task.isPlaced,
        isLocked: task.isLocked || false
      })),
      links: [] // 阶段1不显示依赖连线(避免提示)
    };

    // 保存当前滚动位置
    const scrollState = gantt.getScrollState();

    gantt.clearAll();
    gantt.parse(ganttData);

    // 强制刷新任务样式（应用dependency-error类）
    gantt.render();

    // 恢复滚动位置
    if (scrollState) {
      gantt.scrollTo(scrollState.x, scrollState.y);
    }
  }, [tasks, validationErrors.dependencies, config.projectStartDate]);

  return (
    <div className="phase1-gantt-wrapper">
      <div className="gantt-header">
        <div className="gantt-title-section">
          <h3 className="gantt-title">📊 项目甘特图</h3>
          <p className="gantt-subtitle">拖动任务到合适位置进行排程</p>
        </div>
        <div className="gantt-legend">
          <div className="legend-item">
            <span className="legend-color locked"></span>
            <span className="legend-text">锁定任务</span>
          </div>
          <div className="legend-item">
            <span className="legend-color unplaced"></span>
            <span className="legend-text">待放置</span>
          </div>
          <div className="legend-item">
            <span className="legend-color error"></span>
            <span className="legend-text">依赖错误</span>
          </div>
        </div>
      </div>
      <div
        ref={ganttContainer}
        style={{ width: '100%', height: '750px' }}
      />
    </div>
  );
}

export default Phase1Gantt;