import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Eye, Search, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const AdminVerifications = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [logs, setLogs] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const todayOnly = searchParams.get('today') === '1';

  const fetchLogs = async (paramsOverride = {}) => {
    try {
      setLoading(true);
      setError(null);
      const params = {
        q: searchParams.get('q') || '',
        today: searchParams.get('today') || undefined,
        page: Number(searchParams.get('page') || 1),
        limit: Number(searchParams.get('limit') || 10),
        ...paramsOverride
      };
      const response = await api.get('/admin/verifications', { params });
      setLogs(response.data.logs || []);
      setPagination(response.data.pagination || { page: 1, limit: params.limit, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load verification logs.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [searchParams]);

  const handleSearch = (e) => {
    e.preventDefault();
    const next = new URLSearchParams(searchParams);
    if (query.trim()) {
      next.set('q', query.trim());
    } else {
      next.delete('q');
    }
    next.set('page', '1');
    setSearchParams(next);
  };

  const pageLabel = todayOnly ? "Today's Verifications" : 'Verification Logs';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageLabel}</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Track verification activity and search by certificate serial.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-900/30 text-purple-600">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pagination.total || 0}</p>
                <p className="text-sm text-slate-600 dark:text-gray-300">Verifications</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by certificate serial..."
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white"
                />
              </div>
              <button
                type="submit"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading verification logs..." />
        ) : logs.length === 0 ? (
          <EmptyState
            icon={Eye}
            title="No verification logs found"
            description="Try adjusting the search or filters."
          />
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">
                <tr>
                  <th className="px-5 py-3">Serial</th>
                  <th className="px-5 py-3">Student</th>
                  <th className="px-5 py-3">Institution</th>
                  <th className="px-5 py-3">Verified At</th>
                  <th className="px-5 py-3">Country</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                    <td className="px-5 py-4 font-mono text-primary dark:text-blue-400">{log.serial}</td>
                    <td className="px-5 py-4 text-slate-800 dark:text-gray-200">{log.studentName}</td>
                    <td className="px-5 py-4 text-slate-700 dark:text-gray-300">{log.institutionName}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-300">{log.verifiedAt}</td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-300">{log.verifierCountry || 'N/A'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between rounded-xl bg-white dark:bg-gray-800 p-4 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="text-sm text-slate-600 dark:text-gray-300">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(Math.max(1, pagination.page - 1)));
                  setSearchParams(next);
                }}
                disabled={pagination.page <= 1}
                className="rounded-lg border border-slate-300 dark:border-gray-600 px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(Math.min(pagination.totalPages, pagination.page + 1)));
                  setSearchParams(next);
                }}
                disabled={pagination.page >= pagination.totalPages}
                className="rounded-lg border border-slate-300 dark:border-gray-600 px-3 py-1.5 text-sm text-slate-700 dark:text-gray-200 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminVerifications;
