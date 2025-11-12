'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export default function TopCustomersChart({ data, height = 300 }) {
  // Sample data for top customers
  const defaultData = [
    { name: 'Acme Corporation', sales: 125000, orders: 45 },
    { name: 'Global Industries', sales: 98000, orders: 38 },
    { name: 'Tech Solutions Ltd', sales: 87000, orders: 32 },
    { name: 'Retail Partners Inc', sales: 76000, orders: 28 },
    { name: 'Manufacturing Co', sales: 65000, orders: 24 },
    { name: 'Services Group', sales: 54000, orders: 20 },
    { name: 'Digital Ventures', sales: 48000, orders: 18 },
    { name: 'Enterprise Systems', sales: 42000, orders: 15 },
  ];

  const chartData = data || defaultData;

  // Colors for the bars
  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#ec4899',
    '#06b6d4',
    '#6366f1',
  ];

  const formatCurrency = (value) => {
    return `$${(value / 1000).toFixed(0)}k`;
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top Customers by Sales
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            type="number"
            stroke="#6b7280"
            style={{ fontSize: '12px' }}
            tickFormatter={formatCurrency}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#6b7280"
            style={{ fontSize: '11px' }}
            width={95}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            formatter={(value, name) => {
              if (name === 'sales') {
                return [`$${value.toLocaleString()}`, 'Sales'];
              }
              return [value, 'Orders'];
            }}
          />
          <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-blue-50 rounded p-3">
          <div className="text-sm text-blue-700 font-medium">Total from Top 8</div>
          <div className="text-xl font-bold text-blue-900">
            ${chartData.reduce((sum, item) => sum + item.sales, 0).toLocaleString()}
          </div>
        </div>
        <div className="bg-green-50 rounded p-3">
          <div className="text-sm text-green-700 font-medium">Top Customer</div>
          <div className="text-sm font-bold text-green-900 truncate">
            {chartData[0]?.name}
          </div>
          <div className="text-xs text-green-700">
            ${chartData[0]?.sales.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
