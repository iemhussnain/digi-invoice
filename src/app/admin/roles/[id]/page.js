'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

export default function RoleDetailsPage() {
  const router = useRouter();
  const params = useParams();
  const roleId = params.id;

  const [role, setRole] = useState(null);
  const [allPermissions, setAllPermissions] = useState({});
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('permissions'); // permissions, users, settings

  useEffect(() => {
    if (roleId) {
      fetchRoleDetails();
      fetchAllPermissions();
    }
  }, [roleId]);

  const fetchRoleDetails = async () => {
    try {
      const response = await fetch(`/api/rbac/roles/${roleId}`);
      const data = await response.json();

      if (data.success) {
        setRole(data.data.role);
        setSelectedPermissions(data.data.role.permissions.map((p) => p._id));
      } else {
        setError(data.message || 'Failed to fetch role details');
      }
    } catch (err) {
      console.error('Fetch role error:', err);
      setError('Network error');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const response = await fetch('/api/rbac/permissions?grouped=true');
      const data = await response.json();

      if (data.success) {
        setAllPermissions(data.data.permissions);
      }
    } catch (err) {
      console.error('Fetch permissions error:', err);
    }
  };

  const togglePermission = (permissionId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId]
    );
  };

  const toggleCategory = (categoryPermissions) => {
    const categoryIds = categoryPermissions.map((p) => p._id);
    const allSelected = categoryIds.every((id) => selectedPermissions.includes(id));

    if (allSelected) {
      // Deselect all in category
      setSelectedPermissions((prev) => prev.filter((id) => !categoryIds.includes(id)));
    } else {
      // Select all in category
      setSelectedPermissions((prev) => {
        const newSet = new Set([...prev, ...categoryIds]);
        return Array.from(newSet);
      });
    }
  };

  const savePermissions = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      const response = await fetch(`/api/rbac/roles/${roleId}/permissions`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ permissions: selectedPermissions }),
      });

      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Permissions updated successfully!');
        await fetchRoleDetails();

        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(data.message || 'Failed to update permissions');
      }
    } catch (err) {
      console.error('Save permissions error:', err);
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (error && !role) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Role</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link
            href="/admin/roles"
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition inline-block"
          >
            Back to Roles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Link
                href="/admin/roles"
                className="mr-4 p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <svg
                  className="w-6 h-6 text-gray-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>

              <div className="flex items-center">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold mr-4"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name.charAt(0)}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h1 className="text-2xl font-bold text-gray-900">{role.name}</h1>
                    {role.isSystem && (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        System Role
                      </span>
                    )}
                  </div>
                  <p className="text-gray-600">{role.description || 'No description'}</p>
                </div>
              </div>
            </div>

            {!role.isSystem && (
              <button
                onClick={savePermissions}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
              >
                {saving ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Save Changes
                  </>
                )}
              </button>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Permissions</p>
              <p className="text-2xl font-bold text-gray-900">
                {selectedPermissions.length}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Users Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{role.users?.length || 0}</p>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600 mb-1">Access Level</p>
              <p className="text-2xl font-bold text-gray-900">Level {role.level}</p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex space-x-4 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('permissions')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'permissions'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Permissions
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                activeTab === 'users'
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
              }`}
            >
              Assigned Users ({role.users?.length || 0})
            </button>
            {!role.isSystem && (
              <button
                onClick={() => setActiveTab('settings')}
                className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                  activeTab === 'settings'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                Settings
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      {successMessage && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-green-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-green-700">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {error && (
        <div className="max-w-7xl mx-auto px-6 mt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <svg
                className="w-5 h-5 text-red-600 mr-3"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Permissions Tab */}
        {activeTab === 'permissions' && (
          <div className="space-y-6">
            {role.isSystem && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-start">
                  <svg
                    className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-yellow-800 mb-1">
                      System Role - Read Only
                    </p>
                    <p className="text-sm text-yellow-700">
                      System role permissions cannot be modified. These roles are predefined and
                      protected.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {Object.entries(allPermissions).map(([category, permissions]) => {
              const categoryPermissionIds = permissions.map((p) => p._id);
              const selectedInCategory = categoryPermissionIds.filter((id) =>
                selectedPermissions.includes(id)
              ).length;
              const allSelected = selectedInCategory === categoryPermissionIds.length;
              const someSelected = selectedInCategory > 0 && !allSelected;

              return (
                <div key={category} className="bg-white rounded-lg shadow">
                  {/* Category Header */}
                  <div className="p-6 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                        <span className="ml-3 text-sm text-gray-600">
                          {selectedInCategory} / {permissions.length} selected
                        </span>
                      </div>
                      {!role.isSystem && (
                        <button
                          onClick={() => toggleCategory(permissions)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            allSelected
                              ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                              : someSelected
                              ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected
                            ? 'Deselect All'
                            : someSelected
                            ? 'Select All'
                            : 'Select All'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Permissions List */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {permissions.map((permission) => {
                        const isSelected = selectedPermissions.includes(permission._id);

                        return (
                          <label
                            key={permission._id}
                            className={`flex items-start p-4 rounded-lg border-2 cursor-pointer transition ${
                              isSelected
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            } ${role.isSystem ? 'cursor-not-allowed opacity-75' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePermission(permission._id)}
                              disabled={role.isSystem}
                              className="mt-1 h-5 w-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <p className="text-sm font-medium text-gray-900">
                                  {permission.name}
                                </p>
                                <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                  {permission.key}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600">{permission.description}</p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Users with {role.name} Role
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {role.users?.length || 0} user(s) assigned to this role
              </p>
            </div>

            {(!role.users || role.users.length === 0) && (
              <div className="p-12 text-center">
                <svg
                  className="w-16 h-16 text-gray-400 mx-auto mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users assigned</h3>
                <p className="text-gray-600">No users have been assigned to this role yet</p>
              </div>
            )}

            {role.users && role.users.length > 0 && (
              <div className="divide-y divide-gray-200">
                {role.users.map((user) => (
                  <div key={user._id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center">
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                          {user.name.charAt(0)}
                        </div>
                      )}
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        user.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : user.status === 'inactive'
                          ? 'bg-gray-100 text-gray-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {user.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && !role.isSystem && (
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Role Settings</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role Name</label>
                <input
                  type="text"
                  defaultValue={role.name}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  defaultValue={role.description}
                  disabled
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Level
                </label>
                <input
                  type="number"
                  defaultValue={role.level}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 cursor-not-allowed"
                />
              </div>
              <p className="text-sm text-gray-600">
                Role settings can be edited from the main roles page.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
