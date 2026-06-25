import React from 'react';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = [
  '#3B82F6', '#14B8A6', '#F59E0B', '#EF4444', '#8B5CF6',
  '#EC4899', '#06B6D4', '#84CC16', '#F97316', '#6366F1',
];

export default function CategoryChart({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div style={{ height: '280px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--txt3)', fontSize: '0.85rem' }}>
        Aucune donnée disponible
      </div>
    );
  }

  const chartData = {
    labels: data.map(d => d._id || 'Autre'),
    datasets: [{
      data: data.map(d => d.count),
      backgroundColor: data.map((_, i) => COLORS[i % COLORS.length]),
      borderColor: 'var(--bg2)',
      borderWidth: 3,
      hoverBorderWidth: 0,
      hoverOffset: 6,
    }],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '62%',
    plugins: {
      legend: {
        display: true,
        position: 'right',
        labels: {
          color: 'var(--txt2)',
          font: { family: "'Outfit', sans-serif", size: 11 },
          usePointStyle: true,
          pointStyleWidth: 8,
          padding: 12,
          generateLabels: (chart) => {
            const dataset = chart.data.datasets[0];
            const total = dataset.data.reduce((a, b) => a + b, 0);
            return chart.data.labels.map((label, i) => ({
              text: `${label} (${dataset.data[i]})`,
              fillStyle: dataset.backgroundColor[i],
              strokeStyle: 'transparent',
              pointStyle: 'rectRounded',
              hidden: false,
              index: i,
            }));
          },
        },
      },
      tooltip: {
        backgroundColor: 'var(--bg3)',
        titleColor: 'var(--txt1)',
        bodyColor: 'var(--txt2)',
        borderColor: 'var(--border)',
        borderWidth: 1,
        padding: 12,
        callbacks: {
          label: ctx => {
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? Math.round((ctx.parsed / total) * 100) : 0;
            return ` ${ctx.label}: ${ctx.parsed} (${pct}%)`;
          },
        },
      },
    },
  };

  return (
    <div style={{ height: '280px', width: '100%', padding: '16px' }}>
      <Doughnut options={options} data={chartData} />
    </div>
  );
}
