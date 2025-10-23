"use client";
import React from 'react';

// Lightweight area trend using plain SVG so we avoid adding a chart lib now
export function AreaTrend({ values }: { values: number[] }) {
  const width = 800;
  const height = 240;
  const padding = 16;
  const max = Math.max(...values, 1);
  const points = values.map((v, i) => {
    const x = padding + (i * (width - padding * 2)) / (values.length - 1 || 1);
    const y = height - padding - (v / max) * (height - padding * 2);
    return [x, y] as const;
  });
  const path = [
    `M ${padding} ${height - padding}`,
    ...points.map(([x, y]) => `L ${x} ${y}`),
    `L ${width - padding} ${height - padding}`,
    'Z',
  ].join(' ');

  return (
    <div className="w-full overflow-x-auto">
      <svg width={width} height={height} className="text-primary/50">
        <defs>
          <linearGradient id="g" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.1" />
          </linearGradient>
        </defs>
        <path d={path} fill="url(#g)" stroke="none" />
      </svg>
    </div>
  );
}


