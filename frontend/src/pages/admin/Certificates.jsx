import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Award, Copy, Search, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const AdminCertificates = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [certificates, setCertificates] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [showDetails, setShowDetails] = useState(null);
  const [revokeTarget, setRevokeTarget] = useState(null);
  const todayOnly = searchParams.get('today') === '1';

  const fetchCertificates = async (paramsOverride = {}) => {
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
      const response = await api.get('/admin/certificates', { params });
      setCertificates(response.data.certificates || []);
      setPagination(response.data.pagination || { page: 1, limit: params.limit, total: 0, totalPages: 1 });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load certificates.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCertificates();
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

  const handleCopy = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
    } catch (err) {
      setError('Failed to copy serial to clipboard.');
      setTimeout(() => setError(null), 3000);
      console.error('Error:', err);
    }
  };

  const handleRevoke = async () => {
    if (!revokeTarget) return;
    try {
      await api.put(`/admin/certificates/${revokeTarget.id}/revoke`);
      setRevokeTarget(null);
      fetchCertificates();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to revoke certificate.');
      console.error('Error:', err);
    }
  };

  const pageLabel = todayOnly ? "Today's Certificates" : 'All Certificates';

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{pageLabel}</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Search by serial or student name to view certificate records.
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
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{pagination.total || 0}</p>
                <p className="text-sm text-slate-600 dark:text-gray-300">Certificates</p>
              </div>
            </div>
            <form onSubmit={handleSearch} className="flex w-full max-w-md items-center gap-2">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by serial or student..."
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
          <LoadingSpinner message="Loading certificates..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates found"
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
                  <th className="px-5 py-3">Program</th>
                  <th className="px-5 py-3">Issue Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                {certificates.map((cert) => (
                  <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-primary dark:text-blue-400 font-semibold">
                          {cert.serial}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopy(cert.serial)}
                          className="text-slate-500 hover:text-primary"
                          title="Copy serial"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-800 dark:text-gray-200">
                      <div className="font-semibold">{cert.studentName}</div>
                      <div className="text-xs text-slate-500 dark:text-gray-400">
                        {cert.studentSystemId || 'N/A'}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-gray-300">
                      {cert.institutionName}
                    </td>
                    <td className="px-5 py-4 text-slate-700 dark:text-gray-300">
                      {cert.certificateName}
                    </td>
                    <td className="px-5 py-4 text-slate-600 dark:text-gray-300">
                      {cert.issueDate}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowDetails(cert)}
                          className="rounded-lg border border-slate-300 dark:border-gray-600 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                        >
                          View Details
                        </button>
                        <button
                          type="button"
                          onClick={() => setRevokeTarget(cert)}
                          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          Revoke
                        </button>
                      </div>
                    </td>
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

        {showDetails && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-xl rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Certificate Details</h2>
                <button
                  onClick={() => setShowDetails(null)}
                  className="text-slate-500 hover:text-slate-700"
                >
                  ✕
                </button>
              </div>
              <div className="grid gap-4 text-sm text-slate-700 dark:text-gray-200">
                <div><span className="font-semibold">Serial:</span> {showDetails.serial}</div>
                <div><span className="font-semibold">Student:</span> {showDetails.studentName}</div>
                <div><span className="font-semibold">Student ID:</span> {showDetails.studentSystemId || 'N/A'}</div>
                <div><span className="font-semibold">Institution:</span> {showDetails.institutionName}</div>
                <div><span className="font-semibold">Program:</span> {showDetails.certificateName}</div>
                <div><span className="font-semibold">Level:</span> {showDetails.certificateLevel}</div>
                <div><span className="font-semibold">Department:</span> {showDetails.department || 'N/A'}</div>
                <div><span className="font-semibold">Session:</span> {showDetails.session || 'N/A'}</div>
                <div><span className="font-semibold">Roll:</span> {showDetails.rollNumber || 'N/A'}</div>
                <div><span className="font-semibold">Issue Date:</span> {showDetails.issueDate}</div>
                <div><span className="font-semibold">Convocation:</span> {showDetails.convocationDate || 'N/A'}</div>
                <div><span className="font-semibold">Authority:</span> {showDetails.authorityName} ({showDetails.authorityTitle})</div>
              </div>
            </div>
          </div>
        )}

        {revokeTarget && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
            <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-xl">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Revoke Certificate?</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">
                This will remove certificate <span className="font-mono">{revokeTarget.serial}</span> from active records.
              </p>
              <div className="mt-4 flex justify-end gap-3">
                <button
                  onClick={() => setRevokeTarget(null)}
                  className="rounded-lg border border-slate-300 dark:border-gray-600 px-4 py-2 text-sm text-slate-700 dark:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRevoke}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
                >
                  Confirm Revoke
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminCertificates;
