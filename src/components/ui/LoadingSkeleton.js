'use client';

import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Dashboard Stats Card Skeleton
 */
export function StatsCardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <Skeleton circle width={48} height={48} />
        </div>
        <div className="ml-5 w-0 flex-1">
          <Skeleton width="60%" height={14} className="mb-2" />
          <Skeleton width="40%" height={20} />
        </div>
      </div>
    </div>
  );
}

/**
 * Table Row Skeleton
 */
export function TableRowSkeleton({ columns = 4 }) {
  return (
    <tr>
      {Array.from({ length: columns }).map((_, i) => (
        <td key={i} className="px-6 py-4">
          <Skeleton height={16} />
        </td>
      ))}
    </tr>
  );
}

/**
 * Card Skeleton
 */
export function CardSkeleton({ height = 200 }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <Skeleton height={20} width="40%" className="mb-4" />
      <Skeleton height={height} />
    </div>
  );
}

/**
 * Form Field Skeleton
 */
export function FormFieldSkeleton() {
  return (
    <div className="mb-4">
      <Skeleton width="30%" height={16} className="mb-2" />
      <Skeleton height={40} />
    </div>
  );
}

/**
 * Page Header Skeleton
 */
export function PageHeaderSkeleton() {
  return (
    <div className="mb-8">
      <Skeleton width="40%" height={32} className="mb-2" />
      <Skeleton width="60%" height={16} />
    </div>
  );
}

/**
 * Dashboard Loading State
 */
export function DashboardSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Card */}
      <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
        <Skeleton width="40%" height={28} className="mb-2" />
        <Skeleton width="60%" height={16} />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatsCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="mb-6">
        <Skeleton width="30%" height={24} className="mb-4" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <CardSkeleton height={300} />
          <CardSkeleton height={300} />
        </div>
      </div>

      {/* User Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <CardSkeleton height={200} />
        <CardSkeleton height={200} />
      </div>
    </div>
  );
}

export default Skeleton;
