'use client';

import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export default function RevenueExpenseChart({ data, height = 300 }) {
  // Sample data structure for demonstration
  const defaultData = [
    { month: 'Jan', revenue: 45000, expense: 32000 },
    { month: 'Feb', revenue: 52000, expense: 35000 },
    { month: 'Mar', revenue: 48000, expense: 33000 },
    { month: 'Apr', revenue: 61000, expense: 38000 },
    { month: 'May', revenue: 55000, expense: 36000 },
    { month: 'Jun', revenue: 67000, expense: 40000 },
    { month: 'Jul', revenue: 72000, expense: 42000 },
    { month: 'Aug', revenue: 68000, expense: 41000 },
    { month: 'Sep', revenue: 75000, expense: 43000 },
    { month: 'Oct', revenue: 80000, expense: 45000 },
    { month: 'Nov', revenue: 85000, expense: 47000 },
    { month: 'Dec', revenue: 92000, expense: 50000 },
  ];

  const chartData = data || defaultData;

  const formatCurrency = (value) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Revenue vs Expense Trends
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData}>
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
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="revenue"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: '#10b981', r: 4 }}
            activeDot={{ r: 6 }}
            name="Revenue"
          />
          <Line
            type="monotone"
            dataKey="expense"
            stroke="#ef4444"
            strokeWidth={2}
            dot={{ fill: '#ef4444', r: 4 }}
            activeDot={{ r: 6 }}
            name="Expense"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded p-3">
          <div className="text-sm text-green-700 font-medium">Total Revenue</div>
          <div className="text-xl font-bold text-green-900">
            ${chartData.reduce((sum, item) => sum + item.revenue, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-red-50 rounded p-3">
          <div className="text-sm text-red-700 font-medium">Total Expense</div>
          <div className="text-xl font-bold text-red-900">
            ${chartData.reduce((sum, item) => sum + item.expense, 0).toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
