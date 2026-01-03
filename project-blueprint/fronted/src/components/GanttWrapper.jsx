// frontend/src/components/GanttWrapper.jsx
import React, { Component } from 'react';
// 【已修正】使用正确的包名和默认导入
import gantt from 'dhtmlx-gantt';

export default class GanttWrapper extends Component {
  constructor(props) {
    super(props);
    this.ganttContainer = React.createRef();
  }

  // --- 文件的其余部分与之前的“完整版”完全相同，无需修改 ---
  componentDidMount() {
    gantt.config.readonly = true;
    gantt.config.date_format = '%Y-%m-%d';
    gantt.config.show_grid = false;
    gantt.config.scale_unit = 'day';
    gantt.config.step = 1;
    gantt.config.date_scale = '%M %d';
    gantt.config.column_width = 30; 

    gantt.init(this.ganttContainer.current);

    this.onTaskClickHandler = gantt.attachEvent('onTaskClick', (id) => {
      this.props.onTaskClick?.(id);
      return true;
    });

    if (this.props.data) {
      gantt.parse(this.props.data);
    }
  }

  componentWillUnmount() {
    if (this.onTaskClickHandler) {
      gantt.detachEvent(this.onTaskClickHandler);
    }
  }

  shouldComponentUpdate(nextProps) {
    return this.props.data !== nextProps.data;
  }

  componentDidUpdate() {
    gantt.clearAll();
    gantt.parse(this.props.data);
  }

  render() {
    return (
      <div
        ref={this.ganttContainer}
        style={{ width: '100%', height: '800px' }}
      ></div>
    );
  }
}