import React from 'react';

// Custom SVG Line Chart for Weekly Trips Traveled
export const LineChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-slate-400 text-sm text-center py-10">No data available</div>;

  const width = 500;
  const height = 200;
  const padding = 30;

  const maxVal = Math.max(...data.map(d => d.value), 5);
  const points = data.map((d, i) => {
    const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
    const y = height - padding - (d.value * (height - 2 * padding)) / maxVal;
    return { x, y };
  });

  const pathD = points.reduce((acc, p, i) => 
    i === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`, ''
  );

  const fillD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z` 
    : '';

  return (
    <div className="w-full">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
          </linearGradient>
        </defs>
        
        {/* Horizontal grid lines */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
          const y = padding + ratio * (height - 2 * padding);
          const val = Math.round(maxVal * (1 - ratio));
          return (
            <g key={idx} className="opacity-20 dark:opacity-10">
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
              <text x={padding - 5} y={y + 4} textAnchor="end" className="text-[10px] fill-current font-medium">{val}</text>
            </g>
          );
        })}

        {/* X Axis Labels */}
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / (data.length - 1 || 1);
          return (
            <text key={i} x={x} y={height - 10} textAnchor="middle" className="text-[9px] font-medium opacity-60 dark:opacity-40 fill-current">
              {d.label}
            </text>
          );
        })}

        {/* Gradient fill */}
        {fillD && <path d={fillD} fill="url(#chartGradient)" />}

        {/* Path line */}
        {pathD && (
          <path d={pathD} fill="none" stroke="#6366F1" strokeWidth="2.5" className="drop-shadow-[0_2px_8px_rgba(99,102,241,0.4)]" />
        )}

        {/* Dots */}
        {points.map((p, i) => (
          <g key={i} className="group cursor-pointer">
            <circle cx={p.x} cy={p.y} r="5" fill="#6366F1" className="stroke-white dark:stroke-slate-900 stroke-2" />
            <circle cx={p.x} cy={p.y} r="10" fill="#6366F1" className="opacity-0 hover:opacity-20 transition-opacity duration-150" />
            <title>{`${data[i].label}: ${data[i].value} trips`}</title>
          </g>
        ))}
      </svg>
    </div>
  );
};

// Custom SVG Donut Chart for Expenses by Category
export const DonutChart = ({ data }) => {
  if (!data || data.length === 0) return <div className="text-slate-400 text-sm text-center py-10">No data available</div>;

  const total = data.reduce((sum, d) => sum + d.value, 0);
  if (total === 0) return <div className="text-slate-400 text-sm text-center py-10">No expenses recorded yet</div>;

  const size = 200;
  const center = size / 2;
  const radius = 70;
  const strokeWidth = 24;
  const circumference = 2 * Math.PI * radius;

  let currentAngle = -Math.PI / 2; // Start from top

  const slices = data.map((d) => {
    const percentage = d.value / total;
    const strokeDasharray = `${percentage * circumference} ${circumference}`;
    const angleOffset = (currentAngle + Math.PI / 2) * (180 / Math.PI);
    currentAngle += percentage * 2 * Math.PI;

    return {
      ...d,
      strokeDasharray,
      angleOffset: -angleOffset // Rotate anti-clockwise or offset properly
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center justify-around gap-4 w-full">
      <div className="relative w-40 h-40">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full transform -rotate-90">
          {slices.map((slice, idx) => (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke={slice.color || '#6366F1'}
              strokeWidth={strokeWidth}
              strokeDasharray={slice.strokeDasharray}
              strokeDashoffset="0"
              transform={`rotate(${slice.angleOffset} ${center} ${center})`}
              className="transition-all duration-300 hover:opacity-95 cursor-pointer"
            >
              <title>{`${slice.label}: $${slice.value.toLocaleString()}`}</title>
            </circle>
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
          <span className="text-lg font-extrabold text-slate-800 dark:text-slate-100">${total.toLocaleString()}</span>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">{d.label}:</span>
            <span className="font-extrabold text-slate-800 dark:text-slate-100">${d.value.toLocaleString()}</span>
            <span className="text-slate-400">({Math.round((d.value / total) * 100)}%)</span>
          </div>
        ))}
      </div>
    </div>
  );
};
