import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, GraduationCap, Search, UserCheck, UserPlus, Users, RefreshCw, Calendar, Clock, LogOut, MessageSquare, Pencil, BookOpen, ChevronDown, ChevronUp, CalendarPlus, Check, XCircle, ArrowRightLeft, FileText, Info, Send } from 'lucide-react';
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
import api from '../../services/api';

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
        const pending = (data.applications || []).filter(a => a.status === 'pending' || a.status === 'more_info_requested').length;
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
    return () => {
      window.removeEventListener('withdrawal_requests_updated', handleUpdate);
      window.removeEventListener('extension_requests_updated', handleUpdate);
      window.removeEventListener('enrollment_applications_updated', handleUpdate);
    };
  }, []);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, enrollmentId: null, newStatus: '' });

  const fetchEnrollments = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/enrollments', {
        params: { status: filter, search, page },
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
  }, [filter, search, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, search]);

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
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Filter enrollments</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Use the search box or status chips to narrow the list.</p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={fetchEnrollments} loading={loading} className="!p-2">
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Input
                type="text"
                placeholder="Search by name, student ID, email, or enrollment number"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pr-11"
              />
              <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            </div>

            <div className="flex flex-wrap gap-2">
              {['all', 'active', 'graduated', 'suspended', 'withdrawn'].map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={filter === status ? 'primary' : 'secondary'}
                  onClick={() => handleFilterChange(status)}
                  className="capitalize"
                >
                  {status}
                </Button>
              ))}
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
            <div className="grid gap-4">
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
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.program || 'N/A'}</p>
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

                <div className="flex flex-wrap gap-3 border-t border-gray-200 pt-4 dark:border-gray-700">
                  <Button 
                    variant="secondary" 
                    type="button" 
                    onClick={() => setEditingEnrollment(enrollment)}
                    disabled={['graduated', 'withdrawn'].includes(enrollment.status)}
                    title={['graduated', 'withdrawn'].includes(enrollment.status) ? "Cannot edit graduated or withdrawn enrollments" : ""}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  {enrollment.status === 'active' ? (
                    <>
                      <Button variant="success" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'graduated')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Mark Graduated
                      </Button>
                      <Button variant="secondary" type="button" onClick={() => setExtendingEnrollment(enrollment)}>
                        <Calendar className="mr-2 h-4 w-4" />
                        Extend Graduation Date
                      </Button>
                      <Button variant="secondary" type="button" onClick={() => setSuspendingEnrollment(enrollment)}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Suspend
                      </Button>
                    </>
                  ) : null}

                  {enrollment.status === 'withdrawal_requested' ? (
                    <>
                      <Button variant="danger" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'withdrawn')}>
                        <UserCheck className="mr-2 h-4 w-4" />
                        Approve Withdrawal
                      </Button>
                      <Button variant="secondary" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'active')}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        Reject Withdrawal
                      </Button>
                    </>
                  ) : null}

                  {enrollment.status === 'suspended' ? (
                    <Button variant="success" type="button" onClick={() => requestUpdateStatus(enrollment.id, 'active')}>
                      <UserCheck className="mr-2 h-4 w-4" />
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
            onClose={() => setShowEnrollModal(false)}
            onSuccess={() => {
              setShowEnrollModal(false);
              setSearch('');
              handleFilterChange('all');
              fetchEnrollments();
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

function EnrollStudentModal({ open, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [enrollError, setEnrollError] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [formData, setFormData] = useState({
    student_email: '',
    student_id: '',
    program_level: '',
    department_id: '',
    batch: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    expected_graduation_date: '',
  });

  const [departments, setDepartments] = useState([]);
  useEffect(() => {
    api.get('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);
  }, []);

  const calculateGraduationDate = (level, enrollDateStr) => {
    if (!level || !enrollDateStr) return '';
    const date = new Date(enrollDateStr);
    if (isNaN(date.getTime())) return '';

    if (level === 'Bachelors') {
      date.setFullYear(date.getFullYear() + 4);
    } else if (level === 'Masters') {
      date.setFullYear(date.getFullYear() + 2);
    } else if (level === 'PhD') {
      date.setFullYear(date.getFullYear() + 3);
    }
    return date.toISOString().split('T')[0];
  };

  const handleProgramLevelChange = (level) => {
    const newExpectedGraduation = calculateGraduationDate(level, formData.enrollment_date);
    setFormData(current => ({
      ...current,
      program_level: level,
      expected_graduation_date: newExpectedGraduation || current.expected_graduation_date
    }));
  };

  const handleEnrollmentDateChange = (dateStr) => {
    const newExpectedGraduation = calculateGraduationDate(formData.program_level, dateStr);
    setFormData(current => ({
      ...current,
      enrollment_date: dateStr,
      expected_graduation_date: newExpectedGraduation || current.expected_graduation_date
    }));
  };

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
      student_id: student.student_id || '',
    }));
    setEnrollError(null);
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (formData.expected_graduation_date && new Date(formData.expected_graduation_date) <= new Date(formData.enrollment_date)) {
      toast.error('Expected graduation date must be after enrollment date');
      return;
    }

    setFormSubmitting(true);
    setEnrollError(null);

    try {
      const payload = {
        ...formData,
      };
      if (formData.department_id) {
        payload.department_id = Number(formData.department_id);
      }
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
              placeholder="Search by name, email, or student ID"
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
                className="flex w-full items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 text-left transition hover:border-primary-300 hover:bg-primary-50/60 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-primary-700 dark:hover:bg-primary-900/20"
              >
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{student.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {student.email} • ID: {student.student_id}
                  </p>
                </div>
                <UserPlus className="h-5 w-5 text-primary-600 dark:text-primary-400" />
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

          <div className="space-y-1">
            <Input
              label="Student ID"
              type="text"
              placeholder="e.g. UIU-2026-001234"
              value={formData.student_id}
              onChange={(event) => setFormData((current) => ({ ...current, student_id: event.target.value }))}
              required
            />
            {selectedStudent?.student_id && formData.student_id === selectedStudent.student_id && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                This student already has this ID. You can keep it or assign a new one for your institution.
              </p>
            )}
            {!selectedStudent?.student_id && (
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Assign a unique student ID for this student within your university.
              </p>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Program Level <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.program_level}
                onChange={(e) => handleProgramLevelChange(e.target.value)}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
                required
              >
                <option value="">Select Level</option>
                <option value="Bachelors">Bachelors</option>
                <option value="Masters">Masters</option>
                <option value="PhD">PhD</option>
              </select>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Department
                </label>
                <a
                  href="/settings?tab=role_prefs"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Manage Departments
                </a>
              </div>
              <select
                value={formData.department_id}
                onChange={(e) => setFormData((current) => ({ ...current, department_id: e.target.value }))}
                className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
              >
                <option value="">Select Department (Optional)</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.id}>{dept.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Batch"
              type="text"
              placeholder="e.g. Spring 2024"
              value={formData.batch}
              onChange={(event) => setFormData((current) => ({ ...current, batch: event.target.value }))}
              required
            />
            <Input
              label="Enrollment Date"
              type="date"
              value={formData.enrollment_date}
              onChange={(event) => handleEnrollmentDateChange(event.target.value)}
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
            <Button type="button" variant="secondary" onClick={() => setStep(1)} disabled={formSubmitting}>
              Back
            </Button>
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
    program: enrollment.program || '',
    batch: enrollment.batch || '',
    expected_graduation_date: enrollment.expected_graduation ? enrollment.expected_graduation.split('T')[0] : '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await api.patch(`/university/enrollments/${enrollment.id}`, formData);
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
    <Modal open={true} onClose={onClose} title="Edit Enrollment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-gray-50 p-4 dark:bg-gray-800/50">
          <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">Reference Information</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{getFullName(enrollment)}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Enrollment #: {enrollment.enrollment_number}</p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <Input
          label="Program"
          type="text"
          value={formData.program}
          onChange={(e) => setFormData({ ...formData, program: e.target.value })}
        />
        
        <Input
          label="Batch"
          type="text"
          value={formData.batch}
          onChange={(e) => setFormData({ ...formData, batch: e.target.value })}
        />

        <Input
          label="Expected Graduation Date"
          type="date"
          value={formData.expected_graduation_date}
          onChange={(e) => setFormData({ ...formData, expected_graduation_date: e.target.value })}
        />

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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/withdrawal/pending', {
        params: { search },
      });
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch withdrawal requests');
      toast.error('Failed to fetch withdrawal requests');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchRequests();
    }, search ? 300 : 0);

    return () => clearTimeout(timeout);
  }, [fetchRequests, search]);

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
                          <td className="whitespace-nowrap px-4 py-3">{student.student_id || 'N/A'}</td>
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

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const { data } = await api.get('/university/extension-requests');
      setRequests(data.requests || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch extension requests');
      toast.error('Failed to fetch extension requests');
    } finally {
      setLoading(false);
    }
  }, []);

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
  const [approvingApp, setApprovingApp] = useState(null);
  const [moreInfoApp, setMoreInfoApp] = useState(null);

  const fetchApplications = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/university/enrollment-applications');
      setApplications(data.applications || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to fetch applications');
      toast.error('Failed to fetch applications');
    } finally {
      setLoading(false);
    }
  }, []);

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
        <div className="grid gap-4">
          {applications.map((application) => (
            <ApplicationCard
              key={application.id}
              application={application}
              onApprove={() => setApprovingApp(application)}
              onReject={handleReject}
              onRequestMoreInfo={() => setMoreInfoApp(application)}
            />
          ))}
        </div>
      )}

      {approvingApp && (
        <ApproveApplicationModal
          application={approvingApp}
          onClose={() => setApprovingApp(null)}
          onSuccess={() => {
            setApprovingApp(null);
            window.dispatchEvent(new Event('enrollment_applications_updated'));
            fetchApplications();
          }}
        />
      )}

      {moreInfoApp && (
        <RequestMoreInfoModal
          application={moreInfoApp}
          onClose={() => setMoreInfoApp(null)}
          onSuccess={() => {
            setMoreInfoApp(null);
            window.dispatchEvent(new Event('enrollment_applications_updated'));
            fetchApplications();
          }}
        />
      )}
    </div>
  );
}

function ApplicationCard({ application, onApprove, onReject, onRequestMoreInfo }) {
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [processing, setProcessing] = useState(false);

  const statusVariant =
    application.status === 'approved' ? 'success' :
    application.status === 'rejected' ? 'danger' :
    application.status === 'pending' ? 'warning' :
    application.status === 'more_info_requested' ? 'primary' : 'secondary';

  const statusLabel =
    application.status === 'more_info_requested' ? 'MORE INFO REQUESTED' : application.status.toUpperCase();

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
        : application.status === 'more_info_requested'
          ? 'border-primary-200 dark:border-primary-800/40'
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
              <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                {application.program || 'Not specified'}
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

          {application.university_response && application.status !== 'pending' && (
            <div className="mt-3 rounded-xl bg-gray-50 p-3 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-700/50">
              <p className="text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 mb-1">University Response</p>
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
                <Button variant="secondary" type="button" onClick={onRequestMoreInfo} className="w-full lg:w-auto">
                  <Info className="mr-2 h-4 w-4" />
                  Request More Info
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

function ApproveApplicationModal({ application, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    student_id: application.student_current_id || '',
    program_level: '',
    department_id: '',
    batch: application.batch || '',
    enrollment_date: new Date().toISOString().split('T')[0],
    expected_graduation_date: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [departments, setDepartments] = useState([]);

  useEffect(() => {
    api.get('/university/departments').then(({ data }) => {
      setDepartments(data.departments?.filter(d => d.is_active) || []);
    }).catch(console.error);
  }, []);

  const calculateGraduationDate = (level, enrollDateStr) => {
    if (!level || !enrollDateStr) return '';
    const date = new Date(enrollDateStr);
    if (isNaN(date.getTime())) return '';
    if (level === 'Bachelors') date.setFullYear(date.getFullYear() + 4);
    else if (level === 'Masters') date.setFullYear(date.getFullYear() + 2);
    else if (level === 'PhD') date.setFullYear(date.getFullYear() + 3);
    return date.toISOString().split('T')[0];
  };

  const handleProgramLevelChange = (level) => {
    const newGrad = calculateGraduationDate(level, formData.enrollment_date);
    setFormData(c => ({ ...c, program_level: level, expected_graduation_date: newGrad || c.expected_graduation_date }));
  };

  const handleEnrollmentDateChange = (dateStr) => {
    const newGrad = calculateGraduationDate(formData.program_level, dateStr);
    setFormData(c => ({ ...c, enrollment_date: dateStr, expected_graduation_date: newGrad || c.expected_graduation_date }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (formData.expected_graduation_date && new Date(formData.expected_graduation_date) <= new Date(formData.enrollment_date)) {
      toast.error('Expected graduation date must be after enrollment date');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = { ...formData };
      if (formData.department_id) payload.department_id = Number(formData.department_id);

      await api.post(`/university/enrollment-applications/${application.id}/approve`, payload);
      toast.success('Application approved — student enrolled successfully');
      onSuccess();
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.message) {
        let errorMessage = errorData.message;
        if (errorData.current_enrollment) {
          const current = errorData.current_enrollment;
          errorMessage += `\n\nCurrent Enrollment:\nInstitution: ${current.institution}\nProgram: ${current.program} (${current.batch})\nStatus: ${current.status}`;
        }
        setError(errorMessage);
        toast.error(errorData.message);
      } else {
        setError('Failed to approve application');
        toast.error('Failed to approve application');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Approve Application & Enroll Student" size="lg">
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="rounded-2xl bg-green-50 p-4 dark:bg-green-900/20">
          <p className="text-sm font-semibold text-green-800 dark:text-green-200">Approving Application From</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{application.student_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{application.student_email}</p>
          {application.program && (
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Requested Program: {application.program}</p>
          )}
          {application.batch && (
            <p className="text-sm text-gray-600 dark:text-gray-400">Requested Batch: {application.batch}</p>
          )}
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/20">
            <div className="flex items-start">
              <AlertCircle className="mr-2 mt-0.5 h-5 w-5 flex-shrink-0 text-red-600 dark:text-red-400" />
              <div className="whitespace-pre-line text-sm text-red-700 dark:text-red-300">
                {error}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-1">
          <Input
            label="Student ID"
            type="text"
            placeholder="e.g. UIU-2026-001234"
            value={formData.student_id}
            onChange={(e) => setFormData(c => ({ ...c, student_id: e.target.value }))}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Assign a unique student ID for this student within your university.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Program Level <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.program_level}
              onChange={(e) => handleProgramLevelChange(e.target.value)}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
              required
            >
              <option value="">Select Level</option>
              <option value="Bachelors">Bachelors</option>
              <option value="Masters">Masters</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
          <div className="space-y-1">
            <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Department
            </label>
            <select
              value={formData.department_id}
              onChange={(e) => setFormData(c => ({ ...c, department_id: e.target.value }))}
              className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
            >
              <option value="">Select Department (Optional)</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>{dept.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Batch"
            type="text"
            placeholder="e.g. Spring 2024"
            value={formData.batch}
            onChange={(e) => setFormData(c => ({ ...c, batch: e.target.value }))}
            required
          />
          <Input
            label="Enrollment Date"
            type="date"
            value={formData.enrollment_date}
            onChange={(e) => handleEnrollmentDateChange(e.target.value)}
            required
          />
        </div>

        <Input
          label="Expected Graduation Date"
          type="date"
          value={formData.expected_graduation_date}
          onChange={(e) => setFormData(c => ({ ...c, expected_graduation_date: e.target.value }))}
        />

        <div className="flex flex-col gap-3 pt-2 sm:flex-row">
          <Button type="button" variant="secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="success" loading={submitting} className="sm:flex-1">
            <Check className="mr-2 h-4 w-4" />
            Approve & Enroll Student
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function RequestMoreInfoModal({ application, onClose, onSuccess }) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (message.length < 10) {
      setError('Message must be at least 10 characters');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      await api.post(`/university/enrollment-applications/${application.id}/request-more-info`, {
        university_response: message,
      });
      toast.success('Request for more information sent to student');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to send request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Request More Information">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Requesting more info from</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{application.student_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{application.student_email}</p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> The student will be notified and can see your message on their My University page.
            They will need to contact you directly to provide additional information.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Message to Student <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[120px]"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Explain what additional information or documents you need from the student (min 10 characters)..."
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
            <Info className="mr-2 h-4 w-4" />
            Send Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}