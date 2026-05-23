import { useEffect, useState, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { AlertCircle, GraduationCap, Search, UserCheck, UserPlus, Users, RefreshCw, Calendar, Clock, LogOut, MessageSquare } from 'lucide-react';
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
  const activeTab = searchParams.get('tab') || 'enrollments';

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
  const [pendingWithdrawals, setPendingWithdrawals] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const { data } = await api.get('/university/withdrawal/pending');
        setPendingWithdrawals(data.requests?.length || 0);
      } catch (e) {}
    };
    
    fetchCount();

    const handleUpdate = () => fetchCount();
    window.addEventListener('withdrawal_requests_updated', handleUpdate);
    return () => window.removeEventListener('withdrawal_requests_updated', handleUpdate);
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
              onClick={() => setSearchParams({ tab: 'withdrawals' })}
              className={`whitespace-nowrap flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors ${
                activeTab === 'withdrawals'
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              Withdrawal Requests
              {pendingWithdrawals > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-xs font-medium text-red-600 dark:bg-red-900/30 dark:text-red-400">
                  {pendingWithdrawals}
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

        {activeTab === 'withdrawals' && <WithdrawalRequestsTab />}

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
    department: '',
    batch: '',
    enrollment_date: new Date().toISOString().split('T')[0],
    expected_graduation_date: '',
  });

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
        program: formData.department ? `${formData.program_level} in ${formData.department}` : formData.program_level,
      };
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
            <Input
              label="Department"
              type="text"
              placeholder="e.g. Computer Science"
              value={formData.department}
              onChange={(event) => setFormData((current) => ({ ...current, department: event.target.value }))}
              required
            />
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