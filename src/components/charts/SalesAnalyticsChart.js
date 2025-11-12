'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export default function SalesAnalyticsChart({ data, height = 300 }) {
  // Sample data for demonstration
  const defaultData = [
    { date: '01/11', sales: 4200, orders: 12 },
    { date: '02/11', sales: 3800, orders: 10 },
    { date: '03/11', sales: 5100, orders: 15 },
    { date: '04/11', sales: 4600, orders: 13 },
    { date: '05/11', sales: 6200, orders: 18 },
    { date: '06/11', sales: 5800, orders: 16 },
    { date: '07/11', sales: 7100, orders: 21 },
    { date: '08/11', sales: 6800, orders: 19 },
    { date: '09/11', sales: 7500, orders: 22 },
    { date: '10/11', sales: 8200, orders: 24 },
    { date: '11/11', sales: 9100, orders: 27 },
    { date: '12/11', sales: 8700, orders: 25 },
  ];

  const chartData = data || defaultData;

  const formatCurrency = (value) => {
    return `$${(value / 1000).toFixed(1)}k`;
  };

  const totalSales = chartData.reduce((sum, item) => sum + item.sales, 0);
  const totalOrders = chartData.reduce((sum, item) => sum + item.orders, 0);
  const avgOrderValue = totalSales / totalOrders;

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Sales Analytics
      </h3>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={chartData}>
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="date"
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
            formatter={(value, name) => {
              if (name === 'sales') {
                return [`$${value.toLocaleString()}`, 'Sales'];
              }
              return [value, 'Orders'];
            }}
          />
          <Area
            type="monotone"
            dataKey="sales"
            stroke="#3b82f6"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorSales)"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="bg-blue-50 rounded p-3">
          <div className="text-sm text-blue-700 font-medium">Total Sales</div>
          <div className="text-xl font-bold text-blue-900">
            ${totalSales.toLocaleString()}
          </div>
        </div>
        <div className="bg-purple-50 rounded p-3">
          <div className="text-sm text-purple-700 font-medium">Total Orders</div>
          <div className="text-xl font-bold text-purple-900">
            {totalOrders}
          </div>
        </div>
        <div className="bg-green-50 rounded p-3">
          <div className="text-sm text-green-700 font-medium">Avg Order Value</div>
          <div className="text-xl font-bold text-green-900">
            ${avgOrderValue.toFixed(0)}
          </div>
        </div>
      </div>
    </div>
  );
}
