import React, { useState, useEffect } from 'react';
import { Activity, Filter, ChevronLeft, ChevronRight, XCircle, Loader2, ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../services/api';
import { format } from 'date-fns';
import DashboardLayout from '../../components/DashboardLayout';

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedLog, setExpandedLog] = useState(null);

  // Filter state
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    actorType: 'all',
    action: ''
  });

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    fetchLogs();
  }, [page, filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page,
        limit: 50,
        ...(filters.actorType !== 'all' && { actorType: filters.actorType }),
        ...(filters.action && { action: filters.action }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      };

      const response = await api.get('/admin/activity-logs', { params });
      setLogs(response.data.logs);
      setTotal(response.data.pagination.total);
      setTotalPages(response.data.pagination.totalPages);
      setPage(response.data.pagination.page);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch activity logs');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFilters = () => {
    setFilters(tempFilters);
    setPage(1);
  };

  const handleClearFilters = () => {
    const cleared = {
      dateFrom: '',
      dateTo: '',
      actorType: 'all',
      action: ''
    };
    setTempFilters(cleared);
    setFilters(cleared);
    setPage(1);
  };

  const handleFilterChange = (key, value) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };

  const getActorTypeBadge = (type) => {
    const badgeConfig = {
      STUDENT: { bg: 'bg-blue-100 dark:bg-blue-900/40', text: 'text-blue-700 dark:text-blue-200', label: 'Student' },
      UNIVERSITY: { bg: 'bg-green-100 dark:bg-green-900/40', text: 'text-green-700 dark:text-green-200', label: 'University' },
      VERIFIER: { bg: 'bg-amber-100 dark:bg-amber-900/40', text: 'text-amber-700 dark:text-amber-200', label: 'Verifier' },
      ADMIN: { bg: 'bg-purple-100 dark:bg-purple-900/40', text: 'text-purple-700 dark:text-purple-200', label: 'Admin' },
      SYSTEM: { bg: 'bg-slate-100 dark:bg-gray-700', text: 'text-slate-700 dark:text-gray-200', label: 'System' }
    };
    const config = badgeConfig[type] || { bg: 'bg-slate-100 dark:bg-gray-700', text: 'text-slate-700 dark:text-gray-200', label: type };
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const formatTimestamp = (dateStr) => {
    try {
      return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
    } catch {
      return dateStr;
    }
  };

  if (loading && logs.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-blue-400 mx-auto mb-4" />
            <p className="text-slate-600 dark:text-gray-300">Loading activity logs...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error && logs.length === 0) {
    return (
      <DashboardLayout>
        <div className="mx-auto max-w-6xl py-10">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Activity Logs</h1>
            <p className="text-slate-600 dark:text-gray-300">System audit trail and event history.</p>
          </div>
          <button onClick={() => fetchLogs()} className="btn-secondary text-sm">
            Refresh
          </button>
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

        {/* Filters */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-5 w-5 text-slate-600 dark:text-gray-300" />
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Filters</h2>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-4">
            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">From Date</label>
              <input
                type="date"
                value={tempFilters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">To Date</label>
              <input
                type="date"
                value={tempFilters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {/* Actor Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Actor Type</label>
              <select
                value={tempFilters.actorType}
                onChange={(e) => handleFilterChange('actorType', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="all">All</option>
                <option value="STUDENT">Student</option>
                <option value="UNIVERSITY">University</option>
                <option value="ADMIN">Admin</option>
                <option value="SYSTEM">System</option>
              </select>
            </div>

            {/* Action Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">Action</label>
              <input
                type="text"
                placeholder="e.g., certificate_issued"
                value={tempFilters.action}
                onChange={(e) => handleFilterChange('action', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-3">
            <button onClick={handleApplyFilters} className="btn-primary">
              Apply Filters
            </button>
            <button onClick={handleClearFilters} className="btn-secondary">
              Clear Filters
            </button>
          </div>
        </div>

        {/* Logs Table */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Timestamp</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Actor Type</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Action</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Target</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">IP Address</th>
                  <th className="px-6 py-3 text-center text-xs font-semibold text-slate-700 dark:text-gray-200">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <React.Fragment key={log.id}>
                      <tr className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition">
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-100">
                          {formatTimestamp(log.createdAt)}
                        </td>
                        <td className="px-6 py-4">
                          {getActorTypeBadge(log.actorType)}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-slate-900 dark:text-gray-100">
                          {log.action}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-100">
                          {log.targetType && log.targetId ? (
                            <code className="text-xs bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">
                              {log.targetType}: {String(log.targetId).slice(0, 8)}...
                            </code>
                          ) : (
                            <span className="text-slate-500 dark:text-gray-400">N/A</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-600 dark:text-gray-300 font-mono">
                          {log.ipAddress || 'N/A'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                            className="inline-flex items-center justify-center text-slate-600 dark:text-gray-300 hover:text-primary transition"
                          >
                            {expandedLog === log.id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                      {expandedLog === log.id && log.details && (
                        <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/30">
                          <td colSpan={6} className="px-6 py-4 text-sm text-slate-700 dark:text-gray-200 whitespace-pre-wrap">
                            <div className="flex items-start gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                              <pre className="text-xs bg-slate-100 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                                {JSON.stringify(log.details, null, 2)}
                              </pre>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <Activity className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Activity Logs</h3>
                      <p className="text-gray-600 dark:text-gray-400 mb-6">
                        No activity has been recorded for the selected filters
                      </p>
                      <button onClick={() => fetchLogs()} className="btn-primary">
                        Refresh Logs
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="text-sm text-slate-600 dark:text-gray-300">
            <strong>Page {page} of {totalPages}</strong>
            {total > 0 && (
              <span className="ml-2">
                ({total.toLocaleString()} total logs)
              </span>
            )}
          </div>

          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ActivityLogs;
