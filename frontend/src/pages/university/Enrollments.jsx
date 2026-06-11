import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, GraduationCap, Search, UserCheck, UserPlus, Users, RefreshCw, Calendar, Clock, LogOut, MessageSquare, Pencil, BookOpen, ChevronDown, ChevronUp, CalendarPlus, Check, XCircle, ArrowRightLeft, FileText, Info, Send, Eye, MoreVertical } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import EmptyState from '../../components/shared/EmptyState';
import ConfirmModal from '../../components/shared/ConfirmModal';
import Modal from '../../components/shared/Modal';
import SelectField from '../../components/shared/SelectField';
import api, { cachedGet } from '../../services/api';
import { generateBatchOptions } from '../../utils/helpers';

const statusVariants = {
  active: 'success',
  graduated: 'primary',
  suspended: 'warning',
  withdrawn: 'danger',
  withdrawal_requested: 'warning',
};

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

function getFullName(enrollment) {
  return enrollment.student_name || enrollment.name || 'Unknown student';
}

function getEnrollmentSummary(enrollment) {
  const parts = [enrollment.program, enrollment.batch].filter(Boolean);
  return parts.length > 0 ? parts.join(' • ') : 'No program details yet';
}

function computeProgramDisplay(enrollment) {
  const level = enrollment.certificate_level_name;
  const dept = enrollment.department_name;
  const major = enrollment.major_name;

  if (!level && !dept) return enrollment.program || 'N/A';

  let display = [level, dept].filter(Boolean).join(' — ');
  if (major) display += ` (${major})`;
  return display;
}

export default function Enrollments() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('view') === 'programs' ? 'programs' : (searchParams.get('tab') || 'enrollments');

  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [certLevelFilter, setCertLevelFilter] = useState('');
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [majorFilter, setMajorFilter] = useState('');

  // Auto-open enroll modal from dashboard link
  useEffect(() => {
    if (searchParams.get('action') === 'enroll') {
      setShowEnrollModal(true);
      setSearchParams(prev => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    cachedGet('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);
    
    cachedGet('/university/certificate-levels').then(({ data }) => {
      setCertificateLevels(data.certificate_levels?.filter(cl => cl.is_active) || []);
    }).catch(console.error);
  }, []);


  // Sync filter state from URL parameter if it exists
  useEffect(() => {
    const urlFilter = searchParams.get('filter');
    if (urlFilter && urlFilter !== filter) {
      setFilter(urlFilter);
    }
  }, [searchParams, filter]);

  const handleFilterChange = useCallback((status) => {
    setFilter(status);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      next.set('filter', status);
      return next;
    });
  }, [setSearchParams]);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [stats, setStats] = useState({ total: 0, active: 0, graduated: 0 });
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [enrollApplicationData, setEnrollApplicationData] = useState(null);
  const [extendingEnrollment, setExtendingEnrollment] = useState(null);
  const [suspendingEnrollment, setSuspendingEnrollment] = useState(null);
  const [editingEnrollment, setEditingEnrollment] = useState(null);
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);
  const [pendingExtensions, setPendingExtensions] = useState(0);
  const [pendingApplications, setPendingApplications] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/university/withdrawal/pending');
        setPendingWithdrawals(data.requests?.length || 0);
      } catch (e) {}
    };

    const fetchExtensionCount = async () => {
      try {
        const { data } = await api.get('/university/extension-requests');
        const pending = (data.requests || []).filter(r => r.status === 'pending' || r.status === 'counter_offered').length;
        setPendingExtensions(pending);
      } catch (e) {}
    };

    const fetchApplicationCount = async () => {
      try {
        const { data } = await api.get('/university/enrollment-applications');
        const pending = (data.applications || []).filter(a => a.status === 'pending').length;
        setPendingApplications(pending);
      } catch (e) {}
    };
    
    fetchCount();
    fetchExtensionCount();
    fetchApplicationCount();

    const handleUpdate = () => { fetchCount(); fetchExtensionCount(); fetchApplicationCount(); };
    window.addEventListener('withdrawal_requests_updated', handleUpdate);
    window.addEventListener('extension_requests_updated', handleUpdate);
    window.addEventListener('enrollment_applications_updated', handleUpdate);

    const handleOpenEnrollModal = (e) => {
      setEnrollApplicationData(e.detail);
      setSearchParams({ tab: 'enrollments' });
      setShowEnrollModal(true);
    };
    window.addEventListener('open_enroll_modal', handleOpenEnrollModal);

    return () => {
      window.removeEventListener('withdrawal_requests_updated', handleUpdate);
      window.removeEventListener('extension_requests_updated', handleUpdate);
      window.removeEventListener('enrollment_applications_updated', handleUpdate);
      window.removeEventListener('open_enroll_modal', handleOpenEnrollModal);
    };
  }, []);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, enrollmentId: null, newStatus: '' });

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/enrollments', {
        params: { status: filter, search, page, certificate_level_id: certLevelFilter, department_id: departmentFilter },
      });
      setEnrollments(data.enrollments || []);
      if (data.pagination) setPagination(data.pagination);
      if (data.stats) setStats(data.stats);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch enrollments');
      toast.error('Failed to fetch enrollments');
    } finally {
      setLoading(false);
    }
  }, [filter, search, page, certLevelFilter, departmentFilter]);

  useEffect(() => {
    setPage(1);
    setMajorFilter(''); // Reset major filter when search or filters change
  }, [filter, search, certLevelFilter, departmentFilter]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchEnrollments();
    }, search ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [fetchEnrollments, search]);



  const requestUpdateStatus = (enrollmentId, newStatus) => {
    setConfirmModal({ isOpen: true, enrollmentId, newStatus });
  };

  const executeUpdateStatus = async () => {
    const { enrollmentId, newStatus } = confirmModal;
    if (!enrollmentId) return;

    try {
      const { data } = await api.patch(`/university/enrollments/${enrollmentId}/status`, {
        status: newStatus,
        actual_graduation_date: newStatus === 'graduated' ? new Date().toISOString().split('T')[0] : null,
      });

      window.dispatchEvent(new Event('withdrawal_requests_updated'));
      
      if (data.redirect_to_certificate_issuance && data.student_data) {
        toast.success('Student marked as graduated. Issue certificate now.', { duration: 4000 });
        navigate('/university/issue-certificate', { state: { preSelectedStudent: data.student_data } });
      } else {
        toast.success(`Enrollment marked as ${newStatus}`);
        fetchEnrollments();
      }
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Failed to update enrollment status');
    } finally {
      setConfirmModal({ isOpen: false, enrollmentId: null, newStatus: '' });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">University Operations</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Enrollments</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Search students, enroll them into your institution, and manage their enrollment status from one place.
            </p>
          </div>
          <Button onClick={() => setShowEnrollModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Enroll Student
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Enrollments" value={stats.total} color="primary" />
          <StatCard icon={<UserCheck className="h-5 w-5" />} label="Active" value={stats.active} color="green" />
          <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Graduated" value={stats.graduated} color="blue" />
        </div>


        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6" aria-label="Tabs">
            <button
              onClick={() => setSearchParams({ tab: 'enrollments' })}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'enrollments'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              All Enrollments
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'programs' })}
              className={`whitespace-nowrap border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'programs'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              By Program
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'withdrawals' })}
              className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'withdrawals'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Withdrawal Requests
              {pendingWithdrawals > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-100 px-1 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {pendingWithdrawals}
                </span>
              )}
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'extensions' })}
              className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'extensions'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Extension Requests
              {pendingExtensions > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-100 px-1 text-xs font-medium text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                  {pendingExtensions}
                </span>
              )}
            </button>
            <button
              onClick={() => setSearchParams({ tab: 'applications' })}
              className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'applications'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Applications
              {pendingApplications > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-green-100 px-1 text-xs font-medium text-green-600 dark:bg-green-900/30 dark:text-green-400">
                  {pendingApplications}
                </span>
              )}
            </button>
          </nav>
        </div>

        {activeTab === 'enrollments' && (
          <>
            <Card className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between border-b border-gray-100 pb-4 dark:border-gray-800">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter enrollments</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Search and filter the list of students.</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={fetchEnrollments} loading={loading} className="!p-2">
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 lg:items-center pt-2">
                <div className="relative md:col-span-2 lg:col-span-2">
                  <Input
                    type="text"
                    placeholder="Search by name, student ID, email..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    icon={<Search className="h-4 w-4" />}
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <SelectField
                    value={filter}
                    onChange={(value) => handleFilterChange(value)}
                    options={[
                      { value: 'all', label: 'All Statuses' },
                      { value: 'active', label: 'Active' },
                      { value: 'graduated', label: 'Graduated' },
                      { value: 'suspended', label: 'Suspended' },
                      { value: 'withdrawn', label: 'Withdrawn' },
                    ]}
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <SelectField
                    value={certLevelFilter}
                    onChange={(value) => {
                      setCertLevelFilter(value);
                      setDepartmentFilter('');
                    }}
                    options={[
                      { value: '', label: 'All Cert Levels' },
                      ...certificateLevels.map(cl => ({ value: cl.id, label: cl.name }))
                    ]}
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <SelectField
                    value={departmentFilter}
                    onChange={(value) => setDepartmentFilter(value)}
                    options={[
                      { value: '', label: 'All Departments' },
                      ...departments
                        .filter(d => !certLevelFilter || String(d.certificate_level_id) === String(certLevelFilter) || !d.certificate_level_id)
                        .map(d => ({ value: d.id, label: d.name }))
                    ]}
                  />
                </div>

                <div className="md:col-span-1 lg:col-span-1">
                  <SelectField
                    value={majorFilter}
                    onChange={(value) => setMajorFilter(value)}
                    options={[
                      { value: '', label: 'All Majors' },
                      ...Array.from(
                        new Map(
                          enrollments
                            .filter(e => e.major_id && e.major_name)
                            .map(e => [e.major_id, { value: e.major_id, label: e.major_name }])
                        ).values()
                      )
                    ]}
                  />
                </div>
              </div>

              {error ? (
                <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300 mt-4">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>{error}</span>
                </div>
              ) : null}
            </Card>

            {loading ? (
              <Card>
                <div className="flex min-h-64 items-center justify-center">
                  <LoadingSpinner />
                </div>
              </Card>
            ) : error ? (
              <ErrorMessage message={error} retry={fetchEnrollments} />
            ) : enrollments.length === 0 ? (
              <EmptyState
                title="No enrollments found"
                message="Enroll your first student or clear the filters to view the full enrollment list."
                icon={Users}
                action={
                  <Button onClick={() => setShowEnrollModal(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Enroll Student
                  </Button>
                }
              />
            ) : (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto min-h-[320px] rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Student Name</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Student ID</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Program</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Batch</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                        <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Enrolled Date</th>
                        <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                      {enrollments.filter(e => !majorFilter || String(e.major_id) === String(majorFilter)).map((enrollment) => (
                        <tr key={enrollment.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition group/row">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium text-gray-900 dark:text-white">{getFullName(enrollment)}</div>
                            <div className="text-xs text-gray-500">{enrollment.student_email || enrollment.email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{enrollment.student_id}</td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[200px]" title={enrollment.certificate_level_name || 'N/A'}>
                              {enrollment.certificate_level_name || 'N/A'}
                            </div>
                            <div className="text-xs text-gray-500 truncate max-w-[200px]" title={`${enrollment.department_name || ''} ${enrollment.major_name ? `(${enrollment.major_name})` : ''}`.trim() || enrollment.program}>
                              {`${enrollment.department_name || ''} ${enrollment.major_name ? `(${enrollment.major_name})` : ''}`.trim() || enrollment.program || 'N/A'}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{enrollment.batch || 'N/A'}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant={statusVariants[enrollment.status] || 'default'}>{String(enrollment.status || 'unknown').toUpperCase()}</Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{formatDate(enrollment.enrollment_date)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="relative inline-block text-left group">
                              <button type="button" className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
                                <MoreVertical className="h-5 w-5" />
                              </button>
                              <div className="absolute right-0 mt-1 hidden w-48 origin-top-right flex-col rounded-md bg-white py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none group-hover:flex dark:bg-gray-800 dark:ring-gray-700 z-50">
                                <button
                                  className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                  onClick={() => setEditingEnrollment(enrollment)}
                                  disabled={['graduated', 'withdrawn'].includes(enrollment.status)}
                                >
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </button>

                                {enrollment.status === 'active' && (
                                  <>
                                    <button
                                      className="flex w-full items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                      onClick={() => requestUpdateStatus(enrollment.id, 'graduated')}
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" /> Mark Graduated
                                    </button>
                                    <button
                                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                      onClick={() => setExtendingEnrollment(enrollment)}
                                    >
                                      <Calendar className="mr-2 h-4 w-4" /> Extend
                                    </button>
                                    <button
                                      className="flex w-full items-center px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20"
                                      onClick={() => setSuspendingEnrollment(enrollment)}
                                    >
                                      <AlertCircle className="mr-2 h-4 w-4" /> Suspend
                                    </button>
                                  </>
                                )}

                                {enrollment.status === 'withdrawal_requested' && (
                                  <>
                                    <button
                                      className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                                      onClick={() => requestUpdateStatus(enrollment.id, 'withdrawn')}
                                    >
                                      <UserCheck className="mr-2 h-4 w-4" /> Approve Withdrawal
                                    </button>
                                    <button
                                      className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                                      onClick={() => requestUpdateStatus(enrollment.id, 'active')}
                                    >
                                      <XCircle className="mr-2 h-4 w-4" /> Reject Withdrawal
                                    </button>
                                  </>
                                )}

                                {enrollment.status === 'suspended' && (
                                  <button
                                    className="flex w-full items-center px-4 py-2 text-sm text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/20"
                                    onClick={() => requestUpdateStatus(enrollment.id, 'active')}
                                  >
                                    <UserCheck className="mr-2 h-4 w-4" /> Reactivate
                                  </button>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="grid gap-4 md:hidden">
                {enrollments.map((enrollment) => (
                  <Card key={enrollment.id} className="space-y-5 border border-transparent transition hover:border-primary-200 hover:shadow-xl dark:hover:border-primary-900/40">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="rounded-2xl bg-primary-50 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{getFullName(enrollment)}</h3>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {enrollment.student_email || enrollment.email || 'No email'} • Student ID: {enrollment.student_id}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-[1.2fr_2.5fr_1fr_1fr]">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Enrollment #</p>
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.enrollment_number}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Program</p>
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{computeProgramDisplay(enrollment)}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Batch</p>
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.batch || 'N/A'}</p>
                          </div>
                          <div>
                            <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Enrolled</p>
                            <p className="mt-1 font-medium text-gray-900 dark:text-white">{formatDate(enrollment.enrollment_date)}</p>
                          </div>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-3 text-sm text-gray-500 dark:text-gray-400">
                          <span>{getEnrollmentSummary(enrollment)}</span>
                          <span>Expected graduation: {formatDate(enrollment.expected_graduation)}</span>
                          {enrollment.actual_graduation ? <span>Graduated on: {formatDate(enrollment.actual_graduation)}</span> : null}
                        </div>
                      </div>

                      <Badge variant={statusVariants[enrollment.status] || 'default'}>{String(enrollment.status || 'unknown').toUpperCase()}</Badge>
                    </div>

                    <div className="flex flex-wrap gap-2 border-t border-gray-200 pt-4 dark:border-gray-700">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        type="button" 
                        onClick={() => setEditingEnrollment(enrollment)}
                        disabled={['graduated', 'withdrawn'].includes(enrollment.status)}
                      >
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                      {enrollment.status === 'active' ? (
                        <>
                          <Button variant="success" size="sm" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'graduated')}>
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            Mark Graduated
                          </Button>
                          <Button variant="secondary" size="sm" type="button" onClick={() => setExtendingEnrollment(enrollment)}>
                            <Calendar className="mr-1.5 h-3.5 w-3.5" />
                            Extend
                          </Button>
                          <Button variant="secondary" size="sm" type="button" onClick={() => setSuspendingEnrollment(enrollment)}>
                            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                            Suspend
                          </Button>
                        </>
                      ) : null}

                      {enrollment.status === 'withdrawal_requested' ? (
                        <>
                          <Button variant="danger" size="sm" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'withdrawn')}>
                            <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                            Approve
                          </Button>
                          <Button variant="secondary" size="sm" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'active')}>
                            <AlertCircle className="mr-1.5 h-3.5 w-3.5" />
                            Reject
                          </Button>
                        </>
                      ) : null}

                      {enrollment.status === 'suspended' ? (
                        <Button variant="success" size="sm" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'active')}>
                          <UserCheck className="mr-1.5 h-3.5 w-3.5" />
                          Reactivate
                        </Button>
                      ) : null}
                    </div>
                  </Card>
                ))}
                </div>
                {pagination.last_page > 1 && (
                  <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Showing <span className="font-medium">{(pagination.current_page - 1) * 15 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 15, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={pagination.current_page === 1}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                        disabled={pagination.current_page === pagination.last_page}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}

        {activeTab === 'programs' && <ProgramsTab />}

        {activeTab === 'withdrawals' && <WithdrawalRequestsTab />}

        {activeTab === 'extensions' && <ExtensionRequestsTab />}

        {activeTab === 'applications' && <ApplicationsTab />}

        {showEnrollModal ? (
          <EnrollStudentModal
            open={showEnrollModal}
            application={enrollApplicationData}
            onClose={() => { setShowEnrollModal(false); setEnrollApplicationData(null); }}
            onSuccess={() => {
              setShowEnrollModal(false);
              setEnrollApplicationData(null);
              setSearch('');
              handleFilterChange('all');
              fetchEnrollments();
              window.dispatchEvent(new Event('enrollment_applications_updated'));
            }}
          />
        ) : null}

        {extendingEnrollment ? (
          <ExtendGraduationModal
            enrollment={extendingEnrollment}
            onClose={() => setExtendingEnrollment(null)}
            onSuccess={() => {
              setExtendingEnrollment(null);
              fetchEnrollments();
            }}
          />
        ) : null}

        {editingEnrollment ? (
          <EditEnrollmentModal
            enrollment={editingEnrollment}
            onClose={() => setEditingEnrollment(null)}
            onSuccess={() => {
              setEditingEnrollment(null);
              fetchEnrollments();
            }}
          />
        ) : null}

        {suspendingEnrollment ? (
          <SuspendStudentModal
            enrollment={suspendingEnrollment}
            onClose={() => setSuspendingEnrollment(null)}
            onSuccess={() => {
              setSuspendingEnrollment(null);
              fetchEnrollments();
            }}
          />
        ) : null}

        <ConfirmModal
          isOpen={confirmModal.isOpen}
          onClose={() => setConfirmModal({ isOpen: false, enrollmentId: null, newStatus: '' })}
          onConfirm={executeUpdateStatus}
          title={`Confirm ${confirmModal.newStatus.charAt(0).toUpperCase() + confirmModal.newStatus.slice(1)}`}
          message={`Are you sure you want to change this enrollment status to ${confirmModal.newStatus}?`}
          confirmText="Update Status"
          isDestructive={confirmModal.newStatus === 'suspended' || confirmModal.newStatus === 'withdrawn'}
        />
      </div>
    </DashboardLayout>
  );
}

function EnrollStudentModal({ open, onClose, onSuccess, application }) {
  const [step, setStep] = useState(application ? 2 : 1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(application ? { name: application.student_name, email: application.student_email } : null);
  const [formData, setFormData] = useState({
    student_email: application ? application.student_email : '',
    roll_number: '',
    certificate_level_id: application ? application.certificate_level_id : '',
    department_id: application ? application.department_id : '',
    major_id: '',
    batch: application ? application.batch : '',
    enrollment_date: new Date().toISOString().split('T')[0],
    expected_graduation_date: '',
  });

  useEffect(() => {
    if (application) {
      setStep(2);
      setSelectedStudent({ name: application.student_name, email: application.student_email });
      setFormData(f => ({
        ...f,
        student_email: application.student_email,
        certificate_level_id: application.certificate_level_id || '',
        department_id: application.department_id || '',
        batch: application.batch || '',
      }));
    }
  }, [application]);

  const [departments, setDepartments] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [certLevelsLoading, setCertLevelsLoading] = useState(true);
  const [certLevelsError, setCertLevelsError] = useState(null);
  const [majors, setMajors] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);

  useEffect(() => {
    // Fetch departments
    cachedGet('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);

    // Fetch certificate levels from API
    setCertLevelsLoading(true);
    setCertLevelsError(null);
    cachedGet('/university/certificate-levels')
      .then(({ data }) => {
        const active = (data.certificate_levels || data.levels || []).filter(l => l.is_active !== false);
        setCertificateLevels(active);
      })
      .catch(() => {
        setCertLevelsError('Could not load certificate levels. Please refresh.');
      })
      .finally(() => setCertLevelsLoading(false));
  }, []);

  // Load majors when department changes
  useEffect(() => {
    if (!formData.department_id) {
      setMajors([]);
      setFormData(c => ({ ...c, major_id: '' }));
      return;
    }
    setMajorsLoading(true);
    cachedGet('/university/majors', { params: { department_id: formData.department_id } })
      .then(({ data }) => {
        const active = (data.majors || []).filter(m => m.is_active !== false);
        setMajors(active);
      })
      .catch(() => setMajors([]))
      .finally(() => setMajorsLoading(false));
    // Reset major when department changes
    setFormData(c => ({ ...c, major_id: '' }));
  }, [formData.department_id]);

  // Auto-calculate expected graduation date based on certificate level
  useEffect(() => {
    if (!formData.certificate_level_id || !formData.enrollment_date) return;

    const level = certificateLevels.find(l => String(l.id) === String(formData.certificate_level_id));
    if (!level) return;

    const name = (level.name || '').toLowerCase();
    let years = 4; // default
    if (name.includes('master')) years = 2;
    else if (name.includes('bachelor')) years = 4;
    else if (name.includes('phd') || name.includes('doctor')) years = 4;
    else if (name.includes('diploma')) years = 2;
    else if (name.includes('certificate')) years = 1;

    const enrollDate = new Date(formData.enrollment_date);
    if (!isNaN(enrollDate.getTime())) {
      enrollDate.setFullYear(enrollDate.getFullYear() + years);
      const calculatedDate = enrollDate.toISOString().split('T')[0];
      
      setFormData(current => {
        if (current.expected_graduation_date === calculatedDate) return current;
        return { ...current, expected_graduation_date: calculatedDate };
      });
    }
  }, [formData.certificate_level_id, formData.enrollment_date, certificateLevels]);

  const searchStudents = async () => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const { data } = await api.get('/university/students/search', {
        params: { search: searchQuery.trim() },
      });
      setSearchResults(data.students || []);
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Failed to search students');
    } finally {
      setSearching(false);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setFormData((current) => ({
      ...current,
      student_email: student.email,
      roll_number: '',
    }));
    setEnrollError(null);
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formData.certificate_level_id) {
      toast.error('Please select a certificate level');
      return;
    }

    if (formData.expected_graduation_date && new Date(formData.expected_graduation_date) <= new Date(formData.enrollment_date)) {
      toast.error('Expected graduation date must be after enrollment date');
      return;
    }

    setFormSubmitting(true);
    setEnrollError(null);

    try {
      const payload = {
        student_email: formData.student_email,
        certificate_level_id: Number(formData.certificate_level_id),
        department_id: Number(formData.department_id),
        batch: formData.batch,
        enrollment_date: formData.enrollment_date,
        expected_graduation_date: formData.expected_graduation_date || undefined,
      };
      if (formData.roll_number) payload.roll_number = formData.roll_number;
      if (formData.major_id) payload.major_id = Number(formData.major_id);

      await api.post('/university/enrollments', payload);
      toast.success('Student enrolled successfully');
      onSuccess();
    } catch (requestError) {
      const errorData = requestError.response?.data;

      if (errorData?.message) {
        let errorMessage = errorData.message;

        // Show current enrollment details if provided (409 Conflict)
        if (errorData.current_enrollment) {
          const current = errorData.current_enrollment;
          errorMessage +=
            `\n\nCurrent Enrollment:\n` +
            `Institution: ${current.institution}\n` +
            `Program: ${current.program} (${current.batch})\n` +
            `Status: ${current.status}`;
        }

        setEnrollError(errorMessage);
        toast.error(errorData.message);
      } else {
        setEnrollError('Failed to enroll student');
        toast.error('Failed to enroll student');
      }
    } finally {
      setFormSubmitting(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Enroll New Student" size="lg">
      {step === 1 ? (
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Search for a student, then select them to continue with enrollment.
          </p>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="text"
              placeholder="Search by name, email, or NID"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  searchStudents();
                }
              }}
              icon={<Search className="h-4 w-4" />}
              className="flex-1"
            />
            <Button type="button" onClick={searchStudents} disabled={searching}>
              <Search className="mr-2 h-4 w-4" />
              {searching ? 'Searching...' : 'Search'}
            </Button>
          </div>

          <div className="space-y-3">
            {searchResults.length > 0 ? searchResults.map((student) => (
              <button
                type="button"
                key={student.id}
                onClick={() => selectStudent(student)}
                disabled={student.is_enrolled_anywhere}
                className={`flex w-full items-center justify-between rounded-2xl border p-4 text-left transition ${
                  student.is_enrolled_anywhere
                    ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed dark:border-gray-800 dark:bg-gray-800/30'
                    : 'border-gray-200 bg-white hover:border-primary-300 hover:bg-primary-50/60 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-primary-700 dark:hover:bg-primary-900/20'
                }`}
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {student.email}
                  </p>
                  {student.is_enrolled_anywhere && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                      <XCircle className="h-3 w-3" />
                      Currently enrolled at {student.active_institution}
                    </p>
                  )}
                  {!student.is_enrolled_anywhere && student.is_enrolled_here && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                      <Info className="h-3 w-3" />
                      Has past records here
                    </p>
                  )}
                </div>
                {!student.is_enrolled_anywhere && (
                  <UserPlus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                )}
              </button>
            )) : (
              <div className="rounded-2xl border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                {searching ? 'Searching students...' : 'Search for students to see results here.'}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="rounded-2xl bg-primary-50 p-4 dark:bg-primary-900/20">
            <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">Selected Student</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">{selectedStudent?.name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{selectedStudent?.email}</p>
          </div>

          {enrollError && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
              <div className="flex items-start">
                <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
                <div className="whitespace-pre-line text-sm text-red-700 dark:text-red-300">
                  {enrollError}
                </div>
              </div>
            </div>
          )}

          {/* Student ID (roll_number) */}
          <div className="space-y-1">
            <Input
              label="Student ID"
              type="text"
              placeholder="e.g. UIU-2026-001234"
              value={formData.roll_number}
              onChange={(event) => setFormData((current) => ({ ...current, roll_number: event.target.value }))}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              The ID your institution assigns to this student. This will appear on their certificate and cannot be changed after enrollment.
            </p>
          </div>

          {/* Certificate Level — fetched from API */}
          <div className="space-y-1">
            <SelectField
              label="Certificate Level"
              value={formData.certificate_level_id}
              onChange={(value) => setFormData((current) => ({ ...current, certificate_level_id: value, department_id: '', major_id: '' }))}
              options={[
                { value: '', label: certLevelsLoading ? 'Loading levels...' : certLevelsError ? certLevelsError : 'Select Certificate Level' },
                ...certificateLevels.map(level => ({ value: level.id, label: level.name }))
              ]}
              required
              disabled={certLevelsLoading}
            />
            {certLevelsError && (
              <p className="text-xs text-red-500 dark:text-red-400">{certLevelsError}</p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* Department */}
            <div className="space-y-1">
              <SelectField
                label="Department"
                value={formData.department_id}
                onChange={(value) => setFormData((current) => ({ ...current, department_id: value, major_id: '' }))}
                options={[
                  { value: '', label: formData.certificate_level_id ? 'Select Department' : 'Select Certificate Level First' },
                  ...departments
                    .filter(d => !formData.certificate_level_id || String(d.certificate_level_id) === String(formData.certificate_level_id) || !d.certificate_level_id)
                    .map(dept => ({ value: dept.id, label: dept.name }))
                ]}
                disabled={!formData.certificate_level_id}
                required
              />
              <div className="flex justify-end">
                <a
                  href="/university/settings?tab=departments"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Manage Departments
                </a>
              </div>
            </div>

            {/* Major — optional */}
            <div className="space-y-1">
              <SelectField
                label="Major"
                value={formData.major_id}
                onChange={(value) => setFormData((current) => ({ ...current, major_id: value }))}
                options={[
                  { value: '', label: majorsLoading ? 'Loading majors...' : 'Select Major (Optional)' },
                  ...majors.map(major => ({ value: major.id, label: major.name }))
                ]}
                disabled={!formData.department_id || majorsLoading}
              />
              <div className="flex justify-end">
                <a
                  href={`/university/settings?tab=majors${formData.department_id ? `&dept=${formData.department_id}` : ''}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Manage Majors
                </a>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <SelectField
              label="Batch"
              value={formData.batch}
              onChange={(val) => setFormData((current) => ({ ...current, batch: val }))}
              options={[
                { value: '', label: 'Select batch...' },
                ...generateBatchOptions()
              ]}
              required
            />
            <Input
              label="Enrollment Date"
              type="date"
              value={formData.enrollment_date}
              onChange={(event) => setFormData((current) => ({ ...current, enrollment_date: event.target.value }))}
              required
            />
          </div>

          <Input
            label="Expected Graduation Date"
            type="date"
            value={formData.expected_graduation_date}
            onChange={(event) => setFormData((current) => ({ ...current, expected_graduation_date: event.target.value }))}
          />

          <div className="flex flex-col gap-3 pt-2 sm:flex-row">
            {!application && (
              <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={formSubmitting}>
                Back
              </Button>
            )}
            {application && (
              <Button type="button" variant="secondary" onClick={onClose} disabled={formSubmitting}>
                Cancel
              </Button>
            )}
            <Button type="submit" loading={formSubmitting} className="sm:flex-1">
              Enroll Student
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

// Extend Graduation Modal Component
function ExtendGraduationModal({ enrollment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    new_expected_graduation_date: enrollment.expected_graduation,
    reason: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.patch(
        `/university/enrollments/${enrollment.id}/extend-graduation`,
        formData
      );

      toast.success(response.data.message);
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to extend graduation date';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

    // Calculate current session duration
    const enrollmentDate = new Date(enrollment.enrollment_date);
    const currentExpectedDate = new Date(enrollment.expected_graduation);
    const diffMonths = Math.floor(
      (currentExpectedDate - enrollmentDate) / (1000 * 60 * 60 * 24 * 30)
    );
    const years = Math.floor(diffMonths / 12);
    const months = diffMonths % 12;
  
    // Calculate time left until graduation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const timeDiffMs = currentExpectedDate - today;
    const daysLeft = Math.ceil(timeDiffMs / (1000 * 60 * 60 * 24));
  
    let timeLeftText = '';
    if (daysLeft < 0) {
      timeLeftText = 'Past expected graduation date';
    } else if (daysLeft === 0) {
      timeLeftText = 'Graduates today!';
    } else if (daysLeft < 30) {
      timeLeftText = `${daysLeft} day${daysLeft > 1 ? 's' : ''} left`;
    } else {
      const monthsLeft = Math.floor(daysLeft / 30);
      const remainingDays = daysLeft % 30;
      timeLeftText = `${monthsLeft} month${monthsLeft > 1 ? 's' : ''} ${
        remainingDays > 0 ? `and ${remainingDays} day${remainingDays > 1 ? 's' : ''}` : ''
      } left`;
    }
  
    return (
      <Modal open={true} onClose={onClose} title="Extend Graduation Date">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg mb-4">
            <h4 className="font-medium mb-2">{enrollment.student_name}</h4>
            <div className="text-sm space-y-1">
              <p>
                <span className="text-gray-600 dark:text-gray-400">Program:</span>{' '}
                {enrollment.program}
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Enrolled:</span>{' '}
                {new Date(enrollment.enrollment_date).toLocaleDateString()}
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Current Expected Graduation:</span>{' '}
                {new Date(enrollment.expected_graduation).toLocaleDateString()}
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Time Left:</span>{' '}
                <span className={`font-semibold ${daysLeft < 0 ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`}>
                  {timeLeftText}
                </span>
              </p>
              <p>
                <span className="text-gray-600 dark:text-gray-400">Current Session Duration:</span>{' '}
                {years > 0 && `${years} year${years > 1 ? 's' : ''}`}
                {years > 0 && months > 0 && ' and '}
                {months > 0 && `${months} month${months > 1 ? 's' : ''}`}
              </p>
            </div>
          </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 p-3 rounded-lg">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Input
          label="New Expected Graduation Date"
          type="date"
          value={formData.new_expected_graduation_date}
          onChange={(e) =>
            setFormData({ ...formData, new_expected_graduation_date: e.target.value })
          }
          min={enrollment.expected_graduation} // Must be after current date
          required
        />

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Extension <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[100px]"
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            placeholder="Explain why the graduation date needs to be extended (min 10 characters)..."
            required
            minLength={10}
            maxLength={500}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {formData.reason.length}/500 characters
          </p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            Extend Graduation Date
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// Suspend Student Modal
  function SuspendStudentModal({ enrollment, onClose, onSuccess }) {
    const [reason, setReason] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      setError('');

      try {
        await api.patch(`/university/enrollments/${enrollment.id}/status`, {
          status: 'suspended',
          suspension_reason: reason,
        });
        toast.success('Student suspended successfully');
        onSuccess();
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Failed to suspend student';
        setError(errorMsg);
        toast.error(errorMsg);
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <Modal open={true} onClose={onClose} title="Suspend Student">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="rounded-2xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-sm font-semibold text-amber-800 dark:text-amber-200">Student Details</p>
            <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.student_name}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {enrollment.program} • {enrollment.batch}
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
              Reason for Suspension <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[120px]"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain the reason for suspending this student (min 10 characters)..."
              required
              minLength={10}
              maxLength={1000}
            />
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {reason.length}/1000 characters
            </p>
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="danger" loading={submitting} className="flex-1">
              <AlertCircle className="mr-2 h-4 w-4" />
              Confirm Suspension
            </Button>
          </div>
        </form>
      </Modal>
    );
  }

function EditEnrollmentModal({ enrollment, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    certificate_level_id: enrollment.certificate_level_id || '',
    department_id: enrollment.department_id || '',
    major_id: enrollment.major_id || '',
    batch: enrollment.batch || '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [departments, setDepartments] = useState([]);
  const [certificateLevels, setCertificateLevels] = useState([]);
  const [certLevelsLoading, setCertLevelsLoading] = useState(true);
  const [certLevelsError, setCertLevelsError] = useState(null);
  const [majors, setMajors] = useState([]);
  const [majorsLoading, setMajorsLoading] = useState(false);

  // Computed program display (read-only)
  const currentCertLevel = certificateLevels.find(l => String(l.id) === String(formData.certificate_level_id));
  const currentDept = departments.find(d => String(d.id) === String(formData.department_id));
  const currentMajor = majors.find(m => String(m.id) === String(formData.major_id));
  const programDisplay = (() => {
    if (!currentCertLevel && !currentDept) return enrollment.program || 'N/A';
    let p = [currentCertLevel?.name, currentDept?.name].filter(Boolean).join(' — ');
    if (currentMajor) p += ` (${currentMajor.name})`;
    return p;
  })();

  useEffect(() => {
    // Fetch departments
    cachedGet('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);

    // Fetch certificate levels
    setCertLevelsLoading(true);
    cachedGet('/university/certificate-levels')
      .then(({ data }) => {
        const active = (data.certificate_levels || data.levels || []).filter(l => l.is_active !== false);
        setCertificateLevels(active);
      })
      .catch(() => setCertLevelsError('Could not load certificate levels. Please refresh.'))
      .finally(() => setCertLevelsLoading(false));
  }, []);

  // Load majors when department changes
  useEffect(() => {
    if (!formData.department_id) {
      setMajors([]);
      return;
    }
    setMajorsLoading(true);
    cachedGet('/university/majors', { params: { department_id: formData.department_id } })
      .then(({ data }) => {
        const active = (data.majors || []).filter(m => m.is_active !== false);
        setMajors(active);
        // If current major isn't in the new list, clear it
        if (formData.major_id && !active.find(m => String(m.id) === String(formData.major_id))) {
          setFormData(c => ({ ...c, major_id: '' }));
        }
      })
      .catch(() => setMajors([]))
      .finally(() => setMajorsLoading(false));
  }, [formData.department_id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const payload = {
        certificate_level_id: Number(formData.certificate_level_id),
        department_id: Number(formData.department_id),
        major_id: formData.major_id ? Number(formData.major_id) : null,
        batch: formData.batch,
      };
      const response = await api.patch(`/university/enrollments/${enrollment.id}`, payload);
      toast.success(response.data.message || 'Enrollment updated successfully');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update enrollment';
      setError(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Edit Enrollment" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">

        {/* ── READ-ONLY SECTION ── */}
        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50 space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
            Cannot be changed
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Student Name */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Student Name</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{getFullName(enrollment)}</p>
            </div>

            {/* Enrollment Number */}
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Enrollment Number</p>
              <p className="mt-0.5 font-semibold text-gray-900 dark:text-white font-mono text-sm">{enrollment.enrollment_number}</p>
            </div>
          </div>

          {/* Student ID — read-only with lock */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800/40 dark:bg-amber-900/20">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <div>
                <p className="text-xs text-amber-700 dark:text-amber-300 font-medium">Student ID (cannot be changed after enrollment)</p>
                <p className="mt-0.5 font-bold text-amber-900 dark:text-amber-100">{enrollment.roll_number || enrollment.student_id || '—'}</p>
              </div>
            </div>
          </div>

          {/* Computed Program Display */}
          <div>
            <p className="text-xs text-gray-500 dark:text-gray-400">Program (computed from selections below)</p>
            <p className="mt-0.5 font-medium text-gray-900 dark:text-white">{programDisplay}</p>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* ── EDITABLE FIELDS ── */}

        {/* Certificate Level */}
        <div className="space-y-1">
          <SelectField
            label="Certificate Level"
            value={formData.certificate_level_id}
            onChange={(value) => setFormData(c => ({ ...c, certificate_level_id: value }))}
            options={[
              { value: '', label: certLevelsLoading ? 'Loading levels...' : certLevelsError ? certLevelsError : 'Select Certificate Level' },
              ...certificateLevels.map(level => ({ value: level.id, label: level.name }))
            ]}
            required
            disabled={certLevelsLoading}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Department */}
          <div className="space-y-1">
            <SelectField
              label="Department"
              value={formData.department_id}
              onChange={(value) => setFormData(c => ({ ...c, department_id: value, major_id: '' }))}
              options={[
                { value: '', label: 'Select Department' },
                ...departments.map(dept => ({ value: dept.id, label: dept.name }))
              ]}
              required
            />
            <div className="flex justify-end">
              <a
                href="/university/settings?tab=departments"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Manage Departments
              </a>
            </div>
          </div>

          {/* Major — optional */}
          <div className="space-y-1">
            <SelectField
              label="Major"
              value={formData.major_id}
              onChange={(value) => setFormData(c => ({ ...c, major_id: value }))}
              options={[
                { value: '', label: majorsLoading ? 'Loading majors...' : 'Select Major (Optional)' },
                ...majors.map(major => ({ value: major.id, label: major.name }))
              ]}
              disabled={!formData.department_id || majorsLoading}
            />
            <div className="flex justify-end">
              <a
                href={`/university/settings?tab=majors${formData.department_id ? `&dept=${formData.department_id}` : ''}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
              >
                Manage Majors
              </a>
            </div>
          </div>
        </div>

        {/* Batch */}
        <SelectField
          label="Batch / Intake"
          value={formData.batch}
          onChange={(val) => setFormData(c => ({ ...c, batch: val }))}
          options={[
            { value: '', label: 'Select batch...' },
            ...generateBatchOptions()
          ]}
          required
        />

        {/* Expected Graduation Date — removed, note shown */}
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/40 dark:bg-blue-900/20">
          <div className="flex items-start gap-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              To change the expected graduation date, use the <strong>Extension Request</strong> feature on the student's enrollment.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            Save Changes
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function WithdrawalRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/withdrawal/pending', {
        params: { search, page },
      });
      setRequests(data.requests || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch withdrawal requests');
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRequests();
    }, search ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [fetchRequests, search, page]);

  const handleApproveWithdrawal = async (requestId, responseMessage = '') => {
    try {
      await api.post(`/university/withdrawal/${requestId}/approve`, {
        response_message: responseMessage || 'Withdrawal approved',
      });
      toast.success('Withdrawal approved');
      window.dispatchEvent(new Event('withdrawal_requests_updated'));
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve withdrawal');
    }
  };

  const handleRejectWithdrawal = async (requestId, responseMessage) => {
    if (!responseMessage || responseMessage.length < 10) {
      toast.error('Please provide a rejection reason (min 10 characters)');
      return;
    }
    try {
      await api.post(`/university/withdrawal/${requestId}/reject`, {
        response_message: responseMessage,
      });
      toast.success('Withdrawal rejected');
      window.dispatchEvent(new Event('withdrawal_requests_updated'));
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject withdrawal');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter requests</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Search by student name, ID, or enrollment number.</p>
          </div>

          <Button variant="outline" onClick={fetchRequests} loading={loading} className="!p-2 w-max lg:w-auto self-start lg:self-center">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        <div className="grid gap-3 lg:grid-cols-[1fr] lg:items-center">
          <div className="relative">
            <Input
              type="text"
              placeholder="Search requests..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="pr-11"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </Card>
      ) : error ? (
        <ErrorMessage message={error} retry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title={search ? "No requests found" : "No pending requests"}
          message={search ? "Try adjusting your search query." : "There are currently no pending withdrawal requests from students."}
          icon={MessageSquare}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {requests.map((request) => (
              <WithdrawalRequestCard
                key={request.id}
                request={request}
                onApprove={handleApproveWithdrawal}
                onReject={handleRejectWithdrawal}
              />
            ))}
          </div>
          {pagination.last_page > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{(pagination.current_page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function WithdrawalRequestCard({ request, onApprove, onReject }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(request.id);
    setProcessing(false);
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }
    setProcessing(true);
    await onReject(request.id, rejectionReason);
    setProcessing(false);
  };

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800/40 hover:shadow-lg transition">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-gray-900 dark:text-white">{request.student_name}</p>
            <Badge variant="warning">PENDING</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {request.student_email} • {request.enrollment_number}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {request.program} • {request.batch}
          </p>
          <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Student's Reason</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.reason}"</p>
          </div>
          <p className="text-xs text-gray-400 mt-4 font-medium">
            Requested {new Date(request.requested_at).toLocaleDateString()}
          </p>
        </div>

        <div className="flex flex-col gap-2 lg:items-end w-full lg:w-auto mt-4 lg:mt-0">
          {!showRejectInput ? (
            <>
              <Button variant="danger" type="button" onClick={handleApprove} loading={processing} className="w-full lg:w-auto">
                Approve Withdrawal
              </Button>
              <Button variant="secondary" type="button" onClick={() => setShowRejectInput(true)} className="w-full lg:w-auto">
                Reject Request
              </Button>
            </>
          ) : (
            <div className="space-y-3 w-full lg:w-80 bg-gray-50 p-4 rounded-xl dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
              <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rejection Reason</label>
              <textarea
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white min-h-[80px]"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Why is this request being rejected? (min 10 chars)..."
                minLength={10}
                maxLength={500}
              />
              <div className="flex gap-2">
                <Button variant="secondary" type="button" onClick={() => setShowRejectInput(false)} className="flex-1">
                  Cancel
                </Button>
                <Button variant="danger" type="button" onClick={handleReject} loading={processing} className="flex-1">
                  Confirm Reject
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ProgramsTab() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedProgram, setExpandedProgram] = useState(null);

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/university/enrollments/programs');
      setPrograms(data.programs || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch programs');
      toast.error('Failed to fetch programs');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrograms();
  }, [fetchPrograms]);

  if (loading) {
    return (
      <Card>
        <div className="flex min-h-64 items-center justify-center">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  if (error) {
    return <ErrorMessage message={error} retry={fetchPrograms} />;
  }

  if (programs.length === 0) {
    return (
      <EmptyState
        title="No active programs"
        message="You haven't set any program names for your enrollments. When you enroll students and provide a program name, it will appear here."
        icon={BookOpen}
      />
    );
  }

  return (
    <div className="space-y-6">
      {programs.map((program) => (
        <Card key={program.name} className="border border-transparent transition hover:border-primary-200 hover:shadow-xl dark:hover:border-primary-900/40">
          <div 
            className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between cursor-pointer"
            onClick={() => setExpandedProgram(expandedProgram === program.name ? null : program.name)}
          >
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{program.name}</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Most recent enrollment: {program.recent_enrollment_date ? new Date(program.recent_enrollment_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="success">Active: {program.active_count}</Badge>
              <Badge variant="primary">Graduated: {program.graduated_count}</Badge>
              <Badge variant="danger">Withdrawn: {program.withdrawn_count}</Badge>
              <div className="ml-2 text-gray-400">
                {expandedProgram === program.name ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
              </div>
            </div>
          </div>
          
          {expandedProgram === program.name && (
            <div className="mt-6 border-t border-gray-200 pt-6 dark:border-gray-700">
              <h4 className="mb-4 text-sm font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Enrolled Students
              </h4>
              
              {program.students && program.students.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-600 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3 font-medium">Name</th>
                        <th className="px-4 py-3 font-medium">Student ID</th>
                        <th className="px-4 py-3 font-medium">Batch</th>
                        <th className="px-4 py-3 font-medium">Enrolled Date</th>
                        <th className="px-4 py-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {program.students.map((student) => (
                        <tr key={student.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900 dark:text-white">
                            {student.student_name}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">{student.roll_number || student.student_id || 'N/A'}</td>
                          <td className="whitespace-nowrap px-4 py-3">{student.batch || 'N/A'}</td>
                          <td className="whitespace-nowrap px-4 py-3">{new Date(student.enrollment_date).toLocaleDateString()}</td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <Badge variant={statusVariants[student.status] || 'default'}>
                              {String(student.status || 'unknown').toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500">No students found in this program.</p>
              )}
            </div>
          )}
        </Card>
      ))}
    </div>
  );
}

// ─── Extension Requests Tab ──────────────────────────────
function ExtensionRequestsTab() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [counterOfferRequest, setCounterOfferRequest] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/extension-requests', {
        params: { page },
      });
      setRequests(data.requests || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch extension requests');
      toast.error('Failed to fetch extension requests');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleApprove = async (requestId) => {
    try {
      await api.post(`/university/extension-requests/${requestId}/approve`);
      toast.success('Extension request approved');
      window.dispatchEvent(new Event('extension_requests_updated'));
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve extension');
    }
  };

  const handleReject = async (requestId, universityResponse) => {
    if (!universityResponse || universityResponse.length < 10) {
      toast.error('Please provide a rejection reason (min 10 characters)');
      return;
    }
    try {
      await api.post(`/university/extension-requests/${requestId}/reject`, {
        university_response: universityResponse,
      });
      toast.success('Extension request rejected');
      window.dispatchEvent(new Event('extension_requests_updated'));
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject extension');
    }
  };

  const handleCounterOffer = async (requestId, counterDate, message) => {
    try {
      await api.post(`/university/extension-requests/${requestId}/counter-offer`, {
        counter_offered_date: counterDate,
        university_response: message,
      });
      toast.success('Counter offer sent to student');
      window.dispatchEvent(new Event('extension_requests_updated'));
      setCounterOfferRequest(null);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send counter offer');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Extension Requests</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review student requests for graduation date extensions.</p>
          </div>

          <Button variant="outline" onClick={fetchRequests} loading={loading} className="!p-2 w-max lg:w-auto self-start lg:self-center">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </Card>
      ) : error ? (
        <ErrorMessage message={error} retry={fetchRequests} />
      ) : requests.length === 0 ? (
        <EmptyState
          title="No extension requests"
          message="There are currently no extension requests from students."
          icon={CalendarPlus}
        />
      ) : (
        <>
          <div className="grid gap-4">
            {requests.map((request) => (
              <ExtensionRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                onCounterOffer={() => setCounterOfferRequest(request)}
              />
            ))}
          </div>
          {pagination.last_page > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{(pagination.current_page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {counterOfferRequest && (
        <CounterOfferModal
          request={counterOfferRequest}
          onClose={() => setCounterOfferRequest(null)}
          onSubmit={handleCounterOffer}
        />
      )}
    </div>
  );
}

function ExtensionRequestCard({ request, onApprove, onReject, onCounterOffer }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [showConfirmApprove, setShowConfirmApprove] = useState(false);

  const statusVariant =
    request.status === 'approved' ? 'success' :
    request.status === 'rejected' ? 'danger' :
    request.status === 'pending' ? 'warning' :
    request.status === 'counter_offered' ? 'primary' : 'secondary';

  const statusLabel =
    request.status === 'counter_offered' ? 'COUNTER OFFERED' : request.status.toUpperCase();

  const isPending = request.status === 'pending';

  const handleApprove = async () => {
    setProcessing(true);
    await onApprove(request.id);
    setProcessing(false);
    setShowConfirmApprove(false);
  };

  const handleReject = async () => {
    if (rejectionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }
    setProcessing(true);
    await onReject(request.id, rejectionReason);
    setProcessing(false);
  };

  return (
    <Card className={`border-2 transition hover:shadow-lg ${
      isPending
        ? 'border-amber-200 dark:border-amber-800/40'
        : request.status === 'counter_offered'
          ? 'border-primary-200 dark:border-primary-800/40'
          : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-gray-900 dark:text-white">{request.student_name}</p>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {request.student_email} • {request.program} • {request.batch}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Current Expected</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {request.current_expected_graduation ? new Date(request.current_expected_graduation).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div className="rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">Requested Date</p>
              <p className="mt-1 text-sm font-bold text-blue-700 dark:text-blue-300">
                {new Date(request.requested_graduation_date).toLocaleDateString()}
              </p>
            </div>
            {request.counter_offered_date && (
              <div className="rounded-lg bg-primary-50 p-3 dark:bg-primary-900/20">
                <p className="text-xs uppercase tracking-wider font-semibold text-primary-600 dark:text-primary-400">Counter Offered</p>
                <p className="mt-1 text-sm font-bold text-primary-700 dark:text-primary-300">
                  {new Date(request.counter_offered_date).toLocaleDateString()}
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
            <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Student's Reason</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.reason}"</p>
          </div>

          {request.supporting_document_path && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <CalendarPlus className="h-3 w-3" />
              <span>Supporting document attached</span>
            </div>
          )}

          {request.university_response && request.status !== 'pending' && (
            <div className="mt-3 rounded-xl bg-gray-50 p-3 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">University Response</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{request.university_response}"</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 font-medium">
            Requested {new Date(request.created_at).toLocaleDateString()}
            {request.reviewed_at && ` • Reviewed ${new Date(request.reviewed_at).toLocaleDateString()}`}
          </p>
        </div>

        {isPending && (
          <div className="flex flex-col gap-2 lg:items-end w-full lg:w-auto mt-4 lg:mt-0">
            {!showRejectInput && !showConfirmApprove ? (
              <>
                <Button variant="success" type="button" onClick={() => setShowConfirmApprove(true)} className="w-full lg:w-auto">
                  <Check className="mr-2 h-4 w-4" />
                  Approve
                </Button>
                <Button variant="danger" type="button" onClick={() => setShowRejectInput(true)} className="w-full lg:w-auto">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
                <Button variant="secondary" type="button" onClick={onCounterOffer} className="w-full lg:w-auto">
                  <ArrowRightLeft className="mr-2 h-4 w-4" />
                  Counter-Offer
                </Button>
              </>
            ) : showConfirmApprove ? (
              <div className="space-y-3 w-full lg:w-80 bg-green-50 p-4 rounded-xl dark:bg-green-900/20 border border-green-200 dark:border-green-800/40">
                <p className="text-sm font-medium text-green-800 dark:text-green-200">
                  Approve this extension? The enrollment's expected graduation date will be updated to{' '}
                  <strong>{new Date(request.requested_graduation_date).toLocaleDateString()}</strong>.
                </p>
                <div className="flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setShowConfirmApprove(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="success" type="button" onClick={handleApprove} loading={processing} className="flex-1">
                    Confirm Approve
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3 w-full lg:w-80 bg-gray-50 p-4 rounded-xl dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rejection Reason</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white min-h-[80px]"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why is this request being rejected? (min 10 chars)..."
                  minLength={10}
                  maxLength={1000}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setShowRejectInput(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="danger" type="button" onClick={handleReject} loading={processing} className="flex-1">
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

function CounterOfferModal({ request, onClose, onSubmit }) {
  const [counterDate, setCounterDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Min date: day after current expected graduation
  const minDate = request.current_expected_graduation
    ? (() => {
        const d = new Date(request.current_expected_graduation);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })()
    : new Date().toISOString().split('T')[0];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }
    setSubmitting(true);
    setError('');
    await onSubmit(request.id, counterDate, message);
    setSubmitting(false);
  };

  return (
    <Modal open={true} onClose={onClose} title="Counter-Offer Extension Date">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Student Request Details</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{request.student_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{request.program} • {request.batch}</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Current Expected</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {request.current_expected_graduation ? new Date(request.current_expected_graduation).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Student Requested</p>
              <p className="font-medium text-blue-700 dark:text-blue-300">
                {new Date(request.requested_graduation_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Your Proposed Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
            value={counterDate}
            onChange={(e) => setCounterDate(e.target.value)}
            min={minDate}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Must be after current expected graduation date
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Message to Student <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[100px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain why you're proposing an alternative date (min 10 characters)..."
            required
            minLength={10}
            maxLength={1000}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{message.length}/1000 characters</p>
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting} className="flex-1">
            <ArrowRightLeft className="mr-2 h-4 w-4" />
            Send Counter Offer
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── ENROLLMENT APPLICATIONS TAB ──────────────────────────────
function ApplicationsTab() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [enrollApplicationData, setEnrollApplicationData] = useState(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    const handleOpenEnrollModal = (e) => setEnrollApplicationData(e.detail);
    window.addEventListener('open_enroll_modal', handleOpenEnrollModal);
    return () => window.removeEventListener('open_enroll_modal', handleOpenEnrollModal);
  }, []);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/university/enrollment-applications', {
        params: { page },
      });
      setApplications(data.applications || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch applications');
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleReject = async (applicationId, universityResponse) => {
    if (!universityResponse || universityResponse.length < 10) {
      toast.error('Please provide a rejection reason (min 10 characters)');
      return;
    }
    try {
      await api.post(`/university/enrollment-applications/${applicationId}/reject`, {
        university_response: universityResponse,
      });
      toast.success('Application rejected');
      window.dispatchEvent(new Event('enrollment_applications_updated'));
      fetchApplications();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject application');
    }
  };

  return (
    <div className="space-y-6">
      <Card className="space-y-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enrollment Applications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Review student enrollment applications to your institution.</p>
          </div>

          <Button variant="outline" onClick={fetchApplications} loading={loading} className="!p-2 w-max lg:w-auto self-start lg:self-center">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {error ? (
          <div className="flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-300">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : null}
      </Card>

      {loading ? (
        <Card>
          <div className="flex min-h-64 items-center justify-center">
            <LoadingSpinner />
          </div>
        </Card>
      ) : error ? (
        <ErrorMessage message={error} retry={fetchApplications} />
      ) : applications.length === 0 ? (
        <EmptyState
          title="No applications"
          message="There are currently no enrollment applications from students."
          icon={FileText}
        />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2">
            {applications.map((application) => (
              <ApplicationCard
                key={application.id}
                application={application}
                onApprove={() => {
                  window.dispatchEvent(new CustomEvent('open_enroll_modal', { detail: application }));
                }}
                onReject={handleReject}
              />
            ))}
          </div>
          {pagination.last_page > 1 && (
            <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing <span className="font-medium">{(pagination.current_page - 1) * 10 + 1}</span> to <span className="font-medium">{Math.min(pagination.current_page * 10, pagination.total)}</span> of <span className="font-medium">{pagination.total}</span> results
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.current_page === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                  disabled={pagination.current_page === pagination.last_page}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {enrollApplicationData && (
        <EnrollStudentModal
          application={enrollApplicationData}
          onClose={() => setEnrollApplicationData(null)}
          onSuccess={() => {
            setEnrollApplicationData(null);
            window.dispatchEvent(new Event('enrollment_applications_updated'));
            fetchApplications();
          }}
        />
      )}

    </div>
  );
}

function ApplicationCard({ application, onApprove, onReject }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const statusVariant =
    application.status === 'approved' ? 'success' :
    application.status === 'rejected' ? 'danger' : 'warning';

  const statusLabel = application.status.toUpperCase();

  const isPending = application.status === 'pending';

  const handleReject = async () => {
    if (rejectionReason.length < 10) {
      toast.error('Rejection reason must be at least 10 characters');
      return;
    }
    setProcessing(true);
    await onReject(application.id, rejectionReason);
    setProcessing(false);
  };

  return (
    <Card className={`border-2 transition hover:shadow-lg ${
      isPending
        ? 'border-amber-200 dark:border-amber-800/40'
        : 'border-gray-100 dark:border-gray-800'
    }`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className="font-semibold text-gray-900 dark:text-white">{application.student_name}</p>
            <Badge variant={statusVariant}>{statusLabel}</Badge>
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {application.student_email}
            {application.student_current_id && ` • Current ID: ${application.student_current_id}`}
          </p>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Program</p>
              <p 
                className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate" 
                title={[application.certificate_level_name, application.department_name].filter(Boolean).join(' - ') || 'Not specified'}
              >
                {[application.certificate_level_name, application.department_name].filter(Boolean).join(' - ') || 'Not specified'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Batch</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {application.batch || 'Not specified'}
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 dark:bg-gray-800/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400">Applied</p>
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {new Date(application.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>

          {application.reason && (
            <div className="mt-4 rounded-xl bg-gray-50 p-4 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-2">Student's Reason</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{application.reason}"</p>
            </div>
          )}

          {application.document_path && (
            <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
              <FileText className="h-3 w-3" />
              <span>Supporting document attached</span>
            </div>
          )}

          {application.university_response && application.status === 'rejected' && (
            <div className="mt-3 rounded-xl bg-gray-50 p-3 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">Rejection Reason</p>
              <p className="text-sm text-gray-700 dark:text-gray-300 italic">"{application.university_response}"</p>
            </div>
          )}

          <p className="text-xs text-gray-400 mt-4 font-medium">
            Applied {new Date(application.created_at).toLocaleDateString()}
            {application.reviewed_at && ` • Reviewed ${new Date(application.reviewed_at).toLocaleDateString()}`}
          </p>
        </div>

        {isPending && (
          <div className="flex flex-col gap-2 lg:items-end w-full lg:w-auto mt-4 lg:mt-0">
            {!showRejectInput ? (
              <>
                <Button variant="success" type="button" onClick={onApprove} className="w-full lg:w-auto">
                  <Check className="mr-2 h-4 w-4" />
                  Approve & Enroll
                </Button>
                <Button variant="danger" type="button" onClick={() => setShowRejectInput(true)} className="w-full lg:w-auto">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </>
            ) : (
              <div className="space-y-3 w-full lg:w-80 bg-gray-50 p-4 rounded-xl dark:bg-gray-900/50 border border-gray-100 dark:border-gray-800">
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Rejection Reason</label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white min-h-[80px]"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Why is this application being rejected? (min 10 chars)..."
                  minLength={10}
                  maxLength={1000}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" type="button" onClick={() => setShowRejectInput(false)} className="flex-1">
                    Cancel
                  </Button>
                  <Button variant="danger" type="button" onClick={handleReject} loading={processing} className="flex-1">
                    Confirm Reject
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

