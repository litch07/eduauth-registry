import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import { Activity, ChevronLeft, ChevronRight } from 'lucide-react';
import api from '../../services/api';
import { formatDateTime } from '../../utils/helpers';

const TIME_FILTERS = [
  { id: 'today', label: 'Today' },
  { id: 'this_week', label: 'This Week' },
  { id: 'this_month', label: 'This Month' },
  { id: 'all', label: 'All Time' },
];

const TYPE_FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'user_action', label: 'User Actions' },
  { id: 'certificate', label: 'Certificates' },
  { id: 'enrollment', label: 'Enrollments' },
  { id: 'system', label: 'System' },
];

export default function ActivityLogs() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialFilter = searchParams.get('filter') || 'today';
  
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState(initialFilter);
  const [typeFilter, setTypeFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);

  const fetchLogs = useCallback(async (page = 1) => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/activity-logs', {
        params: {
          filter: timeFilter,
          type: typeFilter,
          page: page
        }
      });
      setLogs(data.logs.data || []);
      setCurrentPage(data.logs.current_page || 1);
      setLastPage(data.logs.last_page || 1);
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  }, [timeFilter, typeFilter]);

  useEffect(() => {
    fetchLogs(currentPage);
  }, [currentPage, fetchLogs]);

  useEffect(() => {
    if (searchParams.get('filter') && searchParams.get('filter') !== timeFilter) {
      setTimeFilter(searchParams.get('filter'));
      setCurrentPage(1);
    }
  }, [searchParams]);

  const handleTimeFilterChange = (id) => {
    setTimeFilter(id);
    setCurrentPage(1);
    setSearchParams({ filter: id });
  };

  const handleTypeFilterChange = (val) => {
    setTypeFilter(val);
    setCurrentPage(1);
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Admin</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Activity className="h-7 w-7 text-primary-600" />
            System Activity
          </h1>
        </div>

        <Card>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              {TIME_FILTERS.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleTimeFilterChange(item.id)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    timeFilter === item.id
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type:</label>
              <select
                value={typeFilter}
                onChange={(e) => handleTypeFilterChange(e.target.value)}
                className="block rounded-lg border border-gray-300 bg-white py-2 pl-3 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              >
                {TYPE_FILTERS.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </Card>

        <Card>
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : logs.length === 0 ? (
            <EmptyState
              icon={Activity}
              title="No Activity Found"
              message="There are no activity logs matching your selected filters."
            />
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Time', 'User', 'Role', 'Action', 'Target'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {logs.map((log) => (
                    <tr key={log.id} className="h-12 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-4 py-0 pl-0 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                        {log.created_at ? formatDateTime(log.created_at) : '—'}
                      </td>
                      <td className="px-4 py-0 font-medium text-gray-900 dark:text-white">
                        {log.user_name}
                      </td>
                      <td className="px-4 py-0">
                        <Badge variant={log.user_role === 'admin' ? 'error' : log.user_role === 'university' ? 'success' : log.user_role === 'verifier' ? 'warning' : log.user_role === 'system' ? 'default' : 'primary'}>
                          {log.user_role}
                        </Badge>
                      </td>
                      <td className="px-4 py-0 text-gray-600 dark:text-gray-300">
                        {log.action_description}
                      </td>
                      <td className="px-4 py-0 text-gray-600 dark:text-gray-300">
                        {log.target || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && lastPage > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {lastPage}
              </p>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <Button variant="secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= lastPage || loading}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
