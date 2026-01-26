import React, { useEffect, useState } from 'react';
import { Users, RefreshCw, XCircle } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ role: 'all', emailVerified: 'all' });
  const [searchParams, setSearchParams] = useSearchParams();

  const fetchUsers = async (paramsOverride = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        role: searchParams.get('role') || 'all',
        emailVerified: searchParams.get('emailVerified') || 'all',
        ...paramsOverride
      };
      if (params.role === 'all') delete params.role;
      if (params.emailVerified === 'all') delete params.emailVerified;

      const response = await api.get('/admin/users', { params });
      setUsers(response.data.users || []);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const roleParam = searchParams.get('role');
    const emailParam = searchParams.get('emailVerified');
    setFilters((prev) => ({
      ...prev,
      role: roleParam ? roleParam.toUpperCase() : 'all',
      emailVerified: emailParam ? emailParam.toLowerCase() : 'all'
    }));
    fetchUsers({
      role: roleParam ? roleParam.toUpperCase() : 'all',
      emailVerified: emailParam ? emailParam.toLowerCase() : 'all'
    });
  }, [searchParams]);

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">All Users</h1>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">Manage registered users across roles.</p>
          </div>
          <button
            onClick={fetchUsers}
            className="flex items-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 px-3 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 flex flex-wrap items-center gap-3">
          <div className="text-sm font-semibold text-slate-700 dark:text-gray-200">Filters</div>
          <select
            value={filters.role}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              const value = e.target.value;
              if (value === 'all') {
                next.delete('role');
              } else {
                next.set('role', value);
              }
              setSearchParams(next);
            }}
            className="rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white"
          >
            <option value="all">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="UNIVERSITY">University</option>
            <option value="VERIFIER">Verifier</option>
          </select>
          <select
            value={filters.emailVerified}
            onChange={(e) => {
              const next = new URLSearchParams(searchParams);
              const value = e.target.value;
              if (value === 'all') {
                next.delete('emailVerified');
              } else {
                next.set('emailVerified', value);
              }
              setSearchParams(next);
            }}
            className="rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white"
          >
            <option value="all">All Email Status</option>
            <option value="true">Verified</option>
            <option value="false">Unverified</option>
          </select>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading users..." />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            description="Try adjusting the filters to see more results."
          />
        ) : (
          <div className="overflow-hidden rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Role</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Email Verified</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-gray-200">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{user.role}</td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-semibold ${
                          user.emailVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">
                      {user.createdAt || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminUsers;
