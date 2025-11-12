'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';

export default function MonthlyComparisonChart({ data, height = 300 }) {
  // Sample data comparing current month vs previous month
  const defaultData = [
    { month: 'Jan', currentYear: 45000, previousYear: 38000 },
    { month: 'Feb', currentYear: 52000, previousYear: 41000 },
    { month: 'Mar', currentYear: 48000, previousYear: 43000 },
    { month: 'Apr', currentYear: 61000, previousYear: 47000 },
    { month: 'May', currentYear: 55000, previousYear: 49000 },
    { month: 'Jun', currentYear: 67000, previousYear: 52000 },
    { month: 'Jul', currentYear: 72000, previousYear: 58000 },
    { month: 'Aug', currentYear: 68000, previousYear: 55000 },
    { month: 'Sep', currentYear: 75000, previousYear: 62000 },
    { month: 'Oct', currentYear: 80000, previousYear: 68000 },
    { month: 'Nov', currentYear: 85000, previousYear: 72000 },
    { month: 'Dec', currentYear: 92000, previousYear: 78000 },
  ];

  const chartData = data || defaultData;

  const formatCurrency = (value) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  const currentYearTotal = chartData.reduce((sum, item) => sum + item.currentYear, 0);
  const previousYearTotal = chartData.reduce((sum, item) => sum + item.previousYear, 0);
  const growth = ((currentYearTotal - previousYearTotal) / previousYearTotal * 100).toFixed(1);

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Year-over-Year Comparison
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="month"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
          />
          <YAxis
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value) => `$${value.toLocaleString()}`}
          />
          <Legend
            wrapperStyle={{ fontSize: '14px' }}
          />
          <Bar
            dataKey="currentYear"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            name="2025"
          />
          <Bar
            dataKey="previousYear"
            fill="#93c5fd"
            radius={[4, 4, 0, 0]}
            name="2024"
          />
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded p-3">
          <div className="text-sm text-blue-700 font-medium">2025 Total</div>
          <div className="text-xl font-bold text-blue-900">
            ${currentYearTotal.toLocaleString()}
          </div>
        </div>
        <div className="bg-indigo-50 rounded p-3">
          <div className="text-sm text-indigo-700 font-medium">2024 Total</div>
          <div className="text-xl font-bold text-indigo-900">
            ${previousYearTotal.toLocaleString()}
          </div>
        </div>
        <div className={cn('rounded p-3', growth >= 0 ? 'bg-green-50' : 'bg-red-50')}>
          <div className={cn('text-sm font-medium', growth >= 0 ? 'text-green-700' : 'text-red-700')}>
            Growth Rate
          </div>
          <div className={cn('text-xl font-bold', growth >= 0 ? 'text-green-900' : 'text-red-900')}>
            {growth >= 0 ? '+' : ''}{growth}%
          </div>
        </div>
      </div>
    </div>
  );
}
