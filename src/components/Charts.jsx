import React from 'react';
import { money } from '../utils/format';

export function MiniBarChart({ data = [] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="mini-bars">
      {data.map((item) => (
        <div key={item.label} className="mini-bar-item">
          <div className="mini-bar-track">
            <div className="mini-bar-fill" style={{ height: `${(item.value / max) * 100}%` }} />
          </div>
          <small>{item.label}</small>
        </div>
      ))}
    </div>
  );
}

export function LineChart({ data = [], currency = false }) {
  const width = 560;
  const height = 220;
  const padding = 24;
  const max = Math.max(...data.map((d) => d.value), 1);
  const points = data.map((item, index) => {
    const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
    const y = height - padding - ((item.value / max) * (height - padding * 2));
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="chart-shell">
      <svg viewBox={`0 0 ${width} ${height}`} className="chart-svg" role="img" aria-label="Line chart">
        {[0, 1, 2, 3].map((step) => {
          const y = padding + ((height - padding * 2) / 3) * step;
          return <line key={step} x1="0" y1={y} x2={width} y2={y} className="chart-grid" />;
        })}
        <polyline points={points} fill="none" className="chart-line" />
        {data.map((item, index) => {
          const x = padding + (index * (width - padding * 2)) / Math.max(data.length - 1, 1);
          const y = height - padding - ((item.value / max) * (height - padding * 2));
          return <circle key={item.label} cx={x} cy={y} r="5" className="chart-dot" />;
        })}
      </svg>
      <div className="chart-label-row">
        {data.map((item) => (
          <div key={item.label}>
            <strong>{currency ? money(item.value) : item.value}</strong>
            <small>{item.label}</small>
          </div>
        ))}
      </div>
    </div>
  );
}

export function DoughnutChart({ segments = [] }) {
  const total = Math.max(segments.reduce((sum, s) => sum + s.value, 0), 1);
  let cumulative = 0;
  const radius = 44;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="doughnut-wrap">
      <svg viewBox="0 0 120 120" className="doughnut-svg" role="img" aria-label="Doughnut chart">
        <circle cx="60" cy="60" r={radius} className="doughnut-bg" />
        {segments.map((segment) => {
          const dash = (segment.value / total) * circumference;
          const gap = circumference - dash;
          const circle = (
            <circle
              key={segment.label}
              cx="60"
              cy="60"
              r={radius}
              className={`doughnut-segment tone-${segment.tone || 'default'}`}
              strokeDasharray={`${dash} ${gap}`}
              strokeDashoffset={-cumulative}
            />
          );
          cumulative += dash;
          return circle;
        })}
      </svg>
      <div className="doughnut-center">
        <strong>{total}</strong>
        <small>Total</small>
      </div>
      <div className="legend-list">
        {segments.map((segment) => (
          <div key={segment.label} className="legend-item">
            <span className={`legend-dot tone-${segment.tone || 'default'}`} />
            <span>{segment.label}</span>
            <strong>{segment.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
