'use client';

import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function TopSuppliersChart({ data, height = 300 }) {
  // Sample data for top suppliers
  const defaultData = [
    { name: 'Wholesale Supplies Co', value: 145000 },
    { name: 'Manufacturing Direct', value: 112000 },
    { name: 'Global Imports Ltd', value: 98000 },
    { name: 'Raw Materials Inc', value: 87000 },
    { name: 'Distribution Partners', value: 76000 },
    { name: 'Others', value: 120000 },
  ];

  const chartData = data || defaultData;

  // Colors for the pie slices
  const COLORS = [
    '#3b82f6',
    '#10b981',
    '#f59e0b',
    '#ef4444',
    '#8b5cf6',
    '#9ca3af',
  ];

  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ fontSize: '12px', fontWeight: 'bold' }}
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Top Suppliers by Purchase Volume
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderCustomLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
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
            verticalAlign="bottom"
            height={36}
            wrapperStyle={{ fontSize: '12px' }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-2 gap-4">
        <div className="bg-purple-50 rounded p-3">
          <div className="text-sm text-purple-700 font-medium">Total Purchases</div>
          <div className="text-xl font-bold text-purple-900">
            ${totalValue.toLocaleString()}
          </div>
        </div>
        <div className="bg-blue-50 rounded p-3">
          <div className="text-sm text-blue-700 font-medium">Top Supplier</div>
          <div className="text-sm font-bold text-blue-900 truncate">
            {chartData[0]?.name}
          </div>
          <div className="text-xs text-blue-700">
            ${chartData[0]?.value.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
