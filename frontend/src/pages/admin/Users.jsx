import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  Users, Search, Filter, Download, ChevronLeft, ChevronRight,
  GraduationCap, Building2, ShieldCheck, UserCog, Eye, MoreVertical,
  CheckCircle, XCircle, Clock, Mail, X, RefreshCw, UserCheck,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';

const STATUS_TABS = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
];

const ROLE_OPTIONS = [
  { value: 'all', label: 'All Roles' },
  { value: 'student', label: 'Students' },
  { value: 'university', label: 'Universities' },
  { value: 'verifier', label: 'Verifiers' },
];

const ROLE_CONFIG = {
  student:    { label: 'Student',    color: 'primary', icon: GraduationCap },
  university: { label: 'University', color: 'success', icon: Building2 },
  verifier:   { label: 'Verifier',   color: 'warning', icon: ShieldCheck },
  admin:      { label: 'Admin',      color: 'error',   icon: UserCog },
};

const PER_PAGE_OPTIONS = [25, 50, 100];

function timeAgo(iso) {
  if (!iso) return '';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return `${Math.floor(diff / 2592000)}mo ago`;
}

function RoleBadge({ role }) {
  const cfg = ROLE_CONFIG[role] || { label: role, color: 'default' };
  return <Badge variant={cfg.color}>{cfg.label}</Badge>;
}

function RoleIcon({ role, className = '' }) {
  const cfg = ROLE_CONFIG[role];
  if (!cfg) return null;
  const Icon = cfg.icon;
  return <Icon className={className} />;
}

function RoleDetail({ user }) {
  if (user.role === 'student') {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        {user.student_id && <p>ID: {user.student_id}</p>}
        {user.enrollment_institution && <p>{user.enrollment_institution}</p>}
        <p>{user.certificates_count ?? 0} certificate{user.certificates_count !== 1 ? 's' : ''}</p>
      </div>
    );
  }
  if (user.role === 'university') {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        {user.institution_name && <p>{user.institution_name}</p>}
        <p>{user.enrolled_students_count ?? 0} enrolled · {user.certificates_count ?? 0} certs</p>
      </div>
    );
  }
  if (user.role === 'verifier') {
    return (
      <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5">
        {user.company_name && <p>{user.company_name}</p>}
        <p>{user.verifications_count ?? 0} verifications · {user.active_access_count ?? 0} access</p>
      </div>
    );
  }
  return null;
}

export default function AdminUsers() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchInputRef = useRef(null);
  const debounceRef = useRef(null);

  // Data
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [exporting, setExporting] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  // Filters
  const [statusTab, setStatusTab] = useState(searchParams.get('status') || 'all');
  const [role, setRole] = useState(searchParams.get('role') || 'all');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Action modals
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState(null);
  const [menuOpen, setMenuOpen] = useState(null);

  const fetchUsers = useCallback(async (page = 1, overrides = {}) => {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: perPage,
        status: overrides.status ?? statusTab,
        role: overrides.role ?? role,
        search: overrides.search ?? searchQuery,
        date_from: overrides.dateFrom ?? dateFrom,
        date_to: overrides.dateTo ?? dateTo,
      };
      // Clean empty params
      Object.keys(params).forEach((k) => { if (!params[k] || params[k] === 'all') delete params[k]; });
      
      const { data } = await api.get('/admin/users', { params });
      setUsers(data.data || []);
      setTotal(data.total || 0);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
      setPendingCount(data.pending_count || 0);
    } catch {
      toast.error('Failed to load users.');
    } finally {
      setLoading(false);
    }
  }, [perPage, statusTab, role, searchQuery, dateFrom, dateTo]);

  useEffect(() => {
    fetchUsers(1);
  }, [statusTab, role, perPage]);

  const handleSearchChange = (value) => {
    setSearchQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchUsers(1, { search: value });
    }, 400);
  };

  const handleStatusTab = (tab) => {
    setStatusTab(tab);
    setSearchParams((prev) => { prev.set('status', tab); return prev; });
  };

  const handlePageChange = (page) => {
    fetchUsers(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = {};
      if (statusTab !== 'all') params.status = statusTab;
      if (role !== 'all') params.role = role;
      const response = await api.get('/admin/users/export', { params, responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Export downloaded.');
    } catch {
      toast.error('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleApprove = async (userId) => {
    setActionLoading(userId);
    try {
      await api.post(`/admin/approve-user/${userId}`);
      toast.success('User approved.');
      setPendingCount((prev) => Math.max(0, prev - 1));
      if (statusTab === 'pending') {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setTotal((prev) => Math.max(0, prev - 1));
      } else {
        setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, is_approved: true } : u));
      }
      setMenuOpen(null);
      window.dispatchEvent(new CustomEvent('pending_users_updated'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(rejectModal);
    try {
      await api.post(`/admin/reject-user/${rejectModal}`, { reason: rejectReason });
      toast.success('User rejected.');
      setPendingCount((prev) => Math.max(0, prev - 1));
      setUsers((prev) => prev.filter((u) => u.id !== rejectModal));
      setTotal((prev) => Math.max(0, prev - 1));
      setRejectModal(null);
      setRejectReason('');
      setMenuOpen(null);
      window.dispatchEvent(new CustomEvent('pending_users_updated'));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject.');
    } finally {
      setActionLoading(null);
    }
  };

  const clearFilters = () => {
    setRole('all');
    setSearchQuery('');
    setDateFrom('');
    setDateTo('');
    setSearchParams((prev) => {
      const nextParams = new URLSearchParams();
      if (statusTab && statusTab !== 'all') {
        nextParams.set('status', statusTab);
      }
      return nextParams;
    });
    fetchUsers(1, { status: statusTab, role: 'all', search: '', dateFrom: '', dateTo: '' });
  };

  const hasActiveFilters = role !== 'all' || searchQuery || dateFrom || dateTo;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Admin</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Users className="h-7 w-7 text-primary-600" />
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : `${total} user${total !== 1 ? 's' : ''} total`}
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => fetchUsers(currentPage)} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button variant="secondary" onClick={handleExport} loading={exporting}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Filter bar */}
        <Card>
          {/* Status tabs */}
          <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4">
            {STATUS_TABS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleStatusTab(value)}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  statusTab === value
                    ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
              >
                {label}
                {value === 'pending' && pendingCount > 0 && statusTab !== 'pending' && (
                  <span className="ml-1.5 inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-100 text-[10px] font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5">!</span>
                )}
              </button>
            ))}
          </div>

          <div className="grid gap-4 grid-cols-1 md:grid-cols-12">
            {/* Search */}
            <div className="md:col-span-6 lg:col-span-5">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={searchInputRef}
                  value={searchQuery}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder="Search by name, email, ID..."
                  className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
                {searchQuery && (
                  <button
                    onClick={() => handleSearchChange('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>

            {/* Role */}
            <div className="md:col-span-6 lg:col-span-3">
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {ROLE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Date range */}
            <div className="flex gap-2 md:col-span-12 lg:col-span-4">
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); fetchUsers(1, { dateFrom: e.target.value }); }}
                className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                title="From date"
              />
              <input
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); fetchUsers(1, { dateTo: e.target.value }); }}
                className="w-full flex-1 rounded-xl border border-gray-300 bg-white px-2 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
                title="To date"
              />
            </div>
          </div>

          {hasActiveFilters && (
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={clearFilters}
                className="flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
              >
                <X className="h-3 w-3" /> Clear all filters
              </button>
            </div>
          )}
        </Card>

        {/* Table */}
        <Card>
          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : users.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <Users className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">No users found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {hasActiveFilters ? 'Try adjusting your filters.' : 'No users in the system yet.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[800px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['User', 'Status', 'Details', 'Joined', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-0 last:pr-0 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => {
                    const cfg = ROLE_CONFIG[user.role] || {};
                    return (
                      <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group">
                        {/* User info */}
                        <td className="py-3 px-4 pl-0">
                          <div className="flex items-center gap-3">
                            <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-${cfg.color === 'primary' ? 'primary' : cfg.color === 'success' ? 'green' : cfg.color === 'warning' ? 'amber' : 'red'}-100 dark:bg-${cfg.color === 'primary' ? 'primary' : cfg.color === 'success' ? 'green' : cfg.color === 'warning' ? 'amber' : 'red'}-900/30`}>
                              <RoleIcon role={user.role} className={`h-5 w-5 text-${cfg.color === 'primary' ? 'primary' : cfg.color === 'success' ? 'green' : cfg.color === 'warning' ? 'amber' : 'red'}-600 dark:text-${cfg.color === 'primary' ? 'primary' : cfg.color === 'success' ? 'green' : cfg.color === 'warning' ? 'amber' : 'red'}-400`} />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {user.name}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                              <RoleBadge role={user.role} />
                            </div>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-3 px-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5">
                              {user.email_verified_at ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 text-gray-400" />
                              )}
                              <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              {user.is_approved ? (
                                <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-amber-500" />
                              )}
                              <span className="text-xs text-gray-600 dark:text-gray-400">
                                {user.is_approved ? 'Approved' : 'Pending'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Role details */}
                        <td className="py-3 px-4">
                          <RoleDetail user={user} />
                        </td>

                        {/* Joined */}
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-xs text-gray-700 dark:text-gray-300">
                              {user.created_at ? new Date(user.created_at).toLocaleDateString() : '—'}
                            </p>
                            <p className="text-[10px] text-gray-400">{timeAgo(user.created_at)}</p>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 pr-0 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => navigate(`/admin/users/${user.id}`)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 transition"
                            >
                              <Eye className="h-3.5 w-3.5" />
                              Details
                            </button>
                            
                            {!user.is_approved && user.role !== 'admin' && (
                              <>
                                <button
                                  onClick={() => handleApprove(user.id)}
                                  disabled={actionLoading === user.id}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 px-3 py-1.5 text-xs font-medium transition"
                                >
                                  <UserCheck className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectModal(user.id)}
                                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-3 py-1.5 text-xs font-medium transition"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-100 dark:border-gray-800 pt-4">
              <div className="flex items-center gap-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Page {currentPage} of {lastPage} · {total} users
                </p>
                <select
                  value={perPage}
                  onChange={(e) => setPerPage(Number(e.target.value))}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-2 py-1 text-xs text-gray-700 dark:text-gray-300"
                >
                  {PER_PAGE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n}/page</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
                <Button variant="secondary" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage <= 1 || loading}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Prev
                </Button>
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2, lastPage - 4)) + i;
                    if (page > lastPage) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                <Button variant="secondary" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage >= lastPage || loading}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Reject Modal */}
      <Modal
        open={!!rejectModal}
        onClose={() => { setRejectModal(null); setRejectReason(''); }}
        title="Reject User"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            This will permanently remove the user. Please provide a reason.
          </p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setRejectModal(null); setRejectReason(''); }}>
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleReject}
              loading={actionLoading === rejectModal}
              disabled={!rejectReason.trim()}
            >
              Reject User
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
