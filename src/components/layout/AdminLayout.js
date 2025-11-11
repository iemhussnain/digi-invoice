'use client';

import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

/**
 * Admin Layout Wrapper
 * Features:
 * - Combines sidebar and header
 * - Responsive design (mobile hamburger menu)
 * - Content area with proper spacing
 * - Smooth transitions
 */
export default function AdminLayout({ children, breadcrumbs = [] }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main content area */}
      <div className="lg:pl-64">
        {/* Header */}
        <Header
          onMenuClick={() => setSidebarOpen(true)}
          breadcrumbs={breadcrumbs}
        />

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
