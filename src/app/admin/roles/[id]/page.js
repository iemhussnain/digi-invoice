'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RoleDetailPage({ params }) {
  const router = useRouter();
  const { id } = params;

  const [role, setRole] = useState(null);
  const [permissions, setPermissions] = useState({});
  const [rolePermissions, setRolePermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRoleData();
  }, [id]);

  const fetchRoleData = async () => {
    try {
      setLoading(true);
      setError('');

      const roleResponse = await fetch(`/api/rbac/roles/${id}?includePermissions=true`);
      const roleData = await roleResponse.json();

      if (!roleData.success) {
        throw new Error(roleData.message || 'Failed to fetch role');
      }

      const permResponse = await fetch('/api/rbac/permissions?grouped=true');
      const permData = await permResponse.json();

      if (!permData.success) {
        throw new Error(permData.message || 'Failed to fetch permissions');
      }

      setRole(roleData.data.role);
      setPermissions(permData.data.permissions);
      setRolePermissions(roleData.data.role.permissions?.map(p => p.key) || []);
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePermissionToggle = (permissionKey) => {
    setRolePermissions((prev) => {
      if (prev.includes(permissionKey)) {
        return prev.filter((k) => k !== permissionKey);
      } else {
        return [...prev, permissionKey];
      }
    });
  };

  const handleSelectAll = (category) => {
    const categoryPerms = permissions[category] || [];
    const categoryKeys = categoryPerms.map((p) => p.key);
    const allSelected = categoryKeys.every((k) => rolePermissions.includes(k));

    if (allSelected) {
      setRolePermissions((prev) => prev.filter((k) => !categoryKeys.includes(k)));
    } else {
      setRolePermissions((prev) => {
        const newPerms = [...prev];
        categoryKeys.forEach((k) => {
          if (!newPerms.includes(k)) {
            newPerms.push(k);
          }
        });
        return newPerms;
      });
    }
  };

  const handleSavePermissions = async () => {
    try {
      setSaving(true);
      setError('');

      const response = await fetch(`/api/rbac/roles/${id}/permissions`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ permissions: rolePermissions }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.message || 'Failed to update permissions');
      }

      alert('Permissions updated successfully!');
    } catch (err) {
      console.error('Save error:', err);
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getFilteredPermissions = () => {
    if (!searchTerm) return permissions;

    const filtered = {};
    Object.keys(permissions).forEach((category) => {
      const categoryPerms = permissions[category].filter(
        (p) =>
          p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.key.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (categoryPerms.length > 0) {
        filtered[category] = categoryPerms;
      }
    });
    return filtered;
  };

  const filteredPermissions = getFilteredPermissions();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading role details...</p>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
            {error || 'Role not found'}
          </div>
          <Link href="/admin/roles" className="text-blue-600 hover:text-blue-800">
            ← Back to Roles
          </Link>
        </div>
      </div>
    );
  }

  const getRoleLevelBadge = (level) => {
    if (level >= 90) return { text: 'Executive', color: 'bg-red-100 text-red-800' };
    if (level >= 70) return { text: 'Management', color: 'bg-orange-100 text-orange-800' };
    if (level >= 50) return { text: 'Specialist', color: 'bg-blue-100 text-blue-800' };
    return { text: 'Basic', color: 'bg-gray-100 text-gray-800' };
  };

  const levelBadge = getRoleLevelBadge(role.level);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <Link href="/admin/roles" className="text-blue-600 hover:text-blue-800 mb-4 inline-block">
            ← Back to Roles
          </Link>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div
                  className="w-16 h-16 rounded-lg flex items-center justify-center text-white text-2xl font-bold mr-4"
                  style={{ backgroundColor: role.color }}
                >
                  {role.name.charAt(0)}
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{role.name}</h1>
                  <div className="flex items-center mt-2 space-x-3">
                    <span className={`px-3 py-1 rounded text-sm font-medium ${levelBadge.color}`}>
                      {levelBadge.text} • Level {role.level}
                    </span>
                    {role.isSystem && (
                      <span className="px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
                        System Role
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleSavePermissions}
                disabled={saving || role.isSystem}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>

            {role.description && (
              <p className="mt-4 text-gray-600">{role.description}</p>
            )}

            {role.isSystem && (
              <div className="mt-4 bg-yellow-50 border border-yellow-200 text-yellow-800 px-4 py-3 rounded">
                <p className="text-sm">
                  ⚠️ System roles cannot be modified. Their permissions are managed by the system.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Total Permissions</p>
            <p className="text-3xl font-bold text-gray-900">{rolePermissions.length}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Users with this Role</p>
            <p className="text-3xl font-bold text-gray-900">{role.userCount || 0}</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <p className="text-sm text-gray-600 mb-1">Available Permissions</p>
            <p className="text-3xl font-bold text-gray-900">
              {Object.values(permissions).reduce((sum, perms) => sum + perms.length, 0)}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <input
            type="text"
            placeholder="Search permissions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {Object.keys(filteredPermissions).length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">No permissions found</p>
            </div>
          ) : (
            Object.keys(filteredPermissions).map((category) => {
              const categoryPerms = filteredPermissions[category];
              const categoryKeys = categoryPerms.map((p) => p.key);
              const allSelected = categoryKeys.every((k) => rolePermissions.includes(k));
              const someSelected = categoryKeys.some((k) => rolePermissions.includes(k));

              return (
                <div key={category} className="bg-white rounded-lg shadow">
                  <div className="border-b border-gray-200 p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <h2 className="text-xl font-bold text-gray-900 capitalize">
                          {category.replace(/_/g, ' ')}
                        </h2>
                        <span className="ml-3 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded">
                          {categoryPerms.length} permissions
                        </span>
                      </div>
                      {!role.isSystem && (
                        <button
                          onClick={() => handleSelectAll(category)}
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            allSelected
                              ? 'bg-blue-100 text-blue-700'
                              : someSelected
                              ? 'bg-blue-50 text-blue-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {allSelected ? 'Deselect All' : someSelected ? 'Select All' : 'Select All'}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryPerms.map((permission) => {
                        const isChecked = rolePermissions.includes(permission.key);

                        return (
                          <label
                            key={permission.key}
                            className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition ${
                              isChecked
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300 bg-white'
                            } ${role.isSystem ? 'cursor-not-allowed opacity-60' : ''}`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePermissionToggle(permission.key)}
                              disabled={role.isSystem}
                              className="mt-1 w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500 disabled:cursor-not-allowed"
                            />
                            <div className="ml-3 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium text-gray-900">{permission.name}</p>
                                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-1 rounded">
                                  {permission.action}
                                </span>
                              </div>
                              {permission.description && (
                                <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                Resource: {permission.resource}
                              </p>
                            </div>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {!role.isSystem && (
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {rolePermissions.length} permissions selected
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Click "Save Permissions" to apply changes
                </p>
              </div>
              <button
                onClick={handleSavePermissions}
                disabled={saving}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-medium"
              >
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
