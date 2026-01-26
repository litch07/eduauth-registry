import React, { useEffect, useState } from 'react';
import { Shield, RefreshCw, XCircle, Building2 } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const StatusBadge = ({ isVerified }) => (
  <span
    className={`rounded-full px-2 py-1 text-xs font-semibold ${
      isVerified ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
    }`}
  >
    {isVerified ? 'Verified' : 'Pending'}
  </span>
);

const Verifiers = () => {
  const [verifiers, setVerifiers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVerifiers(filter);
  }, [filter]);

  const fetchVerifiers = async (selectedFilter) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/admin/verifiers', { params: { isVerified: selectedFilter } });
      setVerifiers(res.data.verifiers || []);
    } catch (err) {
      const msg = err.response?.data?.error || 'Failed to load verifiers';
      setError(msg);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verifiers</h1>
            <p className="text-sm text-slate-600 dark:text-gray-300">Review verifier accounts and status.</p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white"
            >
              <option value="all">All</option>
              <option value="true">Verified</option>
              <option value="false">Pending</option>
            </select>
            <button
              onClick={() => fetchVerifiers(filter)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" /> Refresh
            </button>
          </div>
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
          <LoadingSpinner message="Loading verifiers..." />
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-gray-700">
              <thead className="bg-slate-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Company</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Purpose</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Verified At</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-600 dark:text-gray-200">Total Requests</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-gray-700">
                {verifiers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                    <td className="px-4 py-3 text-sm text-slate-800 dark:text-gray-200 flex items-center gap-2">
                      <Shield className="h-4 w-4 text-slate-500" /> {v.companyName}
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{v.email}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{v.purpose || '-'}</td>
                    <td className="px-4 py-3 text-sm"><StatusBadge isVerified={v.isVerified} /></td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{v.createdAt || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{v.verifiedAt || '-'}</td>
                    <td className="px-4 py-3 text-sm text-slate-700 dark:text-gray-300">{v.totalRequests ?? 0}</td>
                  </tr>
                ))}
                {verifiers.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center">
                      <Building2 className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Verifiers Found
                      </h3>
                      <p className="text-gray-600 dark:text-gray-400">
                        No verifiers match the selected filters
                      </p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Verifiers;
