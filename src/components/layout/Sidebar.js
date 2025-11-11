'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

/**
 * Modern Sidebar Navigation Component
 * Features:
 * - Collapsible sections
 * - Active route highlighting
 * - Icons for visual clarity
 * - Smooth transitions
 * - Responsive design
 */
export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();
  const [expandedSections, setExpandedSections] = useState({
    sales: true,
    procurement: true,
    accounting: true,
  });

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const isActive = (path) => pathname === path;
  const isSectionActive = (paths) => paths.some((path) => pathname.startsWith(path));

  const navigation = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: '📊',
      single: true,
    },
    {
      name: 'Sales',
      key: 'sales',
      icon: '💰',
      items: [
        { name: 'Quick Sale (POS)', href: '/admin/sales', icon: '🛒' },
        { name: 'Customers', href: '/admin/customers', icon: '👥' },
        { name: 'Sales Invoices', href: '/admin/invoices', icon: '📄' },
      ],
    },
    {
      name: 'Procurement',
      key: 'procurement',
      icon: '📦',
      items: [
        { name: 'Suppliers', href: '/admin/suppliers', icon: '🏢' },
        { name: 'Purchase Orders', href: '/admin/purchase-orders', icon: '📋' },
        { name: 'Goods Receipt (GRN)', href: '/admin/grn', icon: '📥' },
        { name: 'Purchase Invoices', href: '/admin/purchase-invoices', icon: '🧾' },
      ],
    },
    {
      name: 'Accounting',
      key: 'accounting',
      icon: '💼',
      items: [
        { name: 'Chart of Accounts', href: '/admin/accounts', icon: '📊' },
        { name: 'Journal Vouchers', href: '/admin/vouchers', icon: '📝' },
        { name: 'Reports', href: '/admin/reports', icon: '📈' },
      ],
    },
    {
      name: 'Administration',
      key: 'admin',
      icon: '⚙️',
      items: [
        { name: 'Roles & Permissions', href: '/admin/roles', icon: '🔐' },
        { name: 'Library Examples', href: '/admin/library-examples', icon: '🎨' },
      ],
    },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-20 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-screen w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo/Brand */}
        <div className="flex items-center justify-between h-16 px-6 border-b border-gray-700">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
              D
            </div>
            <span className="text-xl font-bold">DigiInvoice</span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3">
          <div className="space-y-1">
            {navigation.map((item) => (
              <div key={item.name}>
                {item.single ? (
                  // Single navigation item
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }`}
                  >
                    <span className="mr-3 text-lg">{item.icon}</span>
                    {item.name}
                  </Link>
                ) : (
                  // Section with subitems
                  <div>
                    <button
                      onClick={() => toggleSection(item.key)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                        isSectionActive(item.items.map((i) => i.href))
                          ? 'bg-gray-700 text-white'
                          : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center">
                        <span className="mr-3 text-lg">{item.icon}</span>
                        {item.name}
                      </div>
                      <span
                        className={`transform transition-transform duration-200 ${
                          expandedSections[item.key] ? 'rotate-90' : ''
                        }`}
                      >
                        ›
                      </span>
                    </button>

                    {/* Subitems */}
                    <div
                      className={`mt-1 space-y-1 overflow-hidden transition-all duration-200 ${
                        expandedSections[item.key]
                          ? 'max-h-96 opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      {item.items.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={`flex items-center pl-11 pr-3 py-2 text-sm rounded-lg transition-colors ${
                            isActive(subItem.href)
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                          }`}
                        >
                          <span className="mr-2">{subItem.icon}</span>
                          {subItem.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-700 p-4">
          <div className="text-xs text-gray-400 text-center">
            DigiInvoice ERP v1.0
          </div>
        </div>
      </aside>
    </>
  );
}
