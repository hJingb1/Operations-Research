import React, { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { generateResourceTimeline } from '../../validators/resourceValidator';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

function ResourceChart() {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);
  const { tasks, resourcePool } = useSelector(state => state.phase1);

  useEffect(() => {
    if (!chartRef.current) return;

    const { days, data, pool } = generateResourceTimeline(tasks, resourcePool);

    // 销毁旧图表
    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    // 创建新图表
    const ctx = chartRef.current.getContext('2d');

    const datasets = Object.entries(data).map(([type, values]) => ({
      label: type,
      data: values,
      backgroundColor: values.map((v) =>
        v > pool[type] ? 'rgba(255, 99, 99, 0.6)' : 'rgba(99, 132, 255, 0.6)'
      ),
      borderColor: values.map((v) =>
        v > pool[type] ? 'rgb(255, 99, 99)' : 'rgb(99, 132, 255)'
      ),
      borderWidth: 1
    }));

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: days,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: '资源数量' }
          },
          x: {
            title: { display: true, text: '天数' }
          }
        },
        plugins: {
          legend: { display: true },
          tooltip: {
            callbacks: {
              afterLabel: function(context) {
                const type = context.dataset.label;
                const limit = pool[type];
                return `上限: ${limit}`;
              }
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [tasks, resourcePool]);

  return (
    <div className="resource-chart">
      <h3>资源占用情况（红色=超限）</h3>
      <div style={{ height: '150px' }}>
        <canvas ref={chartRef}></canvas>
      </div>
    </div>
  );
}

export default ResourceChart;