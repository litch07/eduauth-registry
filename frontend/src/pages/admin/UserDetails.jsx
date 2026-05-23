import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import {
  ArrowLeft, GraduationCap, Building2, ShieldCheck, UserCog, Eye,
  CheckCircle, XCircle, Clock, Mail, Calendar, Hash, User, Award,
  FileText, Activity, BookOpen, ExternalLink, UserCheck, ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';

const ROLE_CONFIG = {
  student:    { label: 'Student',    color: 'primary', icon: GraduationCap, bg: 'primary' },
  university: { label: 'University', color: 'success', icon: Building2,     bg: 'green' },
  verifier:   { label: 'Verifier',   color: 'warning', icon: ShieldCheck,   bg: 'amber' },
  admin:      { label: 'Admin',      color: 'error',   icon: UserCog,       bg: 'red' },
};

function InfoRow({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
      <span className="w-40 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white break-all">{String(value)}</span>
    </div>
  );
}

function StatBox({ label, value, color = 'primary' }) {
  return (
    <div className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center">
      <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value ?? 0}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </div>
  );
}

const TABS_STUDENT = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'certificates', label: 'Certificates', icon: FileText },
  { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const TABS_UNIVERSITY = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'certificates', label: 'Certificates', icon: FileText },
  { id: 'enrollments', label: 'Enrollments', icon: BookOpen },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const TABS_VERIFIER = [
  { id: 'overview', label: 'Overview', icon: ShieldCheck },
  { id: 'activity', label: 'Activity', icon: Activity },
];

const TABS_DEFAULT = [
  { id: 'overview', label: 'Overview', icon: User },
  { id: 'activity', label: 'Activity', icon: Activity },
];

function getTabs(role) {
  if (role === 'student') return TABS_STUDENT;
  if (role === 'university') return TABS_UNIVERSITY;
  if (role === 'verifier') return TABS_VERIFIER;
  return TABS_DEFAULT;
}

export default function AdminUserDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [actionLoading, setActionLoading] = useState(false);

  // Tab data
  const [certificates, setCertificates] = useState([]);
  const [certsPage, setCertsPage] = useState(1);
  const [certsLastPage, setCertsLastPage] = useState(1);
  const [certsTotal, setCertsTotal] = useState(0);
  const [certsLoading, setCertsLoading] = useState(false);

  const [enrollments, setEnrollments] = useState([]);
  const [enrollPage, setEnrollPage] = useState(1);
  const [enrollLastPage, setEnrollLastPage] = useState(1);
  const [enrollTotal, setEnrollTotal] = useState(0);
  const [enrollLoading, setEnrollLoading] = useState(false);

  const [activities, setActivities] = useState([]);
  const [activityPage, setActivityPage] = useState(1);
  const [activityLastPage, setActivityLastPage] = useState(1);
  const [activityTotal, setActivityTotal] = useState(0);
  const [activityLoading, setActivityLoading] = useState(false);

  // Certificate detail modal
  const [certDetail, setCertDetail] = useState(null);
  const [certDetailLoading, setCertDetailLoading] = useState(false);

  // Reject modal
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const fetchUser = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${id}`);
      setUser(data.user);
    } catch {
      toast.error('Failed to load user.');
      navigate('/admin/users');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const fetchCertificates = useCallback(async (page = 1) => {
    setCertsLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${id}/certificates`, { params: { page } });
      setCertificates(data.data || []);
      setCertsPage(data.current_page || 1);
      setCertsLastPage(data.last_page || 1);
      setCertsTotal(data.total || 0);
    } catch {
      toast.error('Failed to load certificates.');
    } finally {
      setCertsLoading(false);
    }
  }, [id]);

  const fetchEnrollments = useCallback(async (page = 1) => {
    setEnrollLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${id}/enrollments`, { params: { page } });
      setEnrollments(data.data || []);
      setEnrollPage(data.current_page || 1);
      setEnrollLastPage(data.last_page || 1);
      setEnrollTotal(data.total || 0);
    } catch {
      toast.error('Failed to load enrollments.');
    } finally {
      setEnrollLoading(false);
    }
  }, [id]);

  const fetchActivity = useCallback(async (page = 1) => {
    setActivityLoading(true);
    try {
      const { data } = await api.get(`/admin/users/${id}/activity`, { params: { page } });
      setActivities(data.data || []);
      setActivityPage(data.current_page || 1);
      setActivityLastPage(data.last_page || 1);
      setActivityTotal(data.total || 0);
    } catch {
      toast.error('Failed to load activity.');
    } finally {
      setActivityLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  useEffect(() => {
    if (!user) return;
    if (tab === 'certificates') fetchCertificates(1);
    if (tab === 'enrollments') fetchEnrollments(1);
    if (tab === 'activity') fetchActivity(1);
  }, [tab, user]);

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/approve-user/${id}`);
      toast.success('User approved.');
      setUser((u) => ({ ...u, is_approved: true, approved_at: new Date().toISOString() }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/reject-user/${id}`, { reason: rejectReason });
      toast.success('User rejected.');
      navigate('/admin/users');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject.');
    } finally {
      setActionLoading(false);
    }
  };

  const openCertDetail = async (certId) => {
    setCertDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/certificates/${certId}/details`);
      setCertDetail(data.certificate);
    } catch {
      toast.error('Failed to load certificate details.');
    } finally {
      setCertDetailLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div>
      </DashboardLayout>
    );
  }

  if (!user) return null;

  const roleCfg = ROLE_CONFIG[user.role] || {};
  const RIcon = roleCfg.icon || User;
  const tabs = getTabs(user.role);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Back */}
        <button
          onClick={() => navigate('/admin/users')}
          className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary-600 transition"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Users
        </button>

        {/* User header card */}
        <Card>
          <div className="flex flex-col lg:flex-row lg:items-center gap-6">
            {/* Avatar */}
            <div className={`flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl bg-${roleCfg.bg || 'gray'}-100 dark:bg-${roleCfg.bg || 'gray'}-900/30`}>
              <RIcon className={`h-10 w-10 text-${roleCfg.bg || 'gray'}-600 dark:text-${roleCfg.bg || 'gray'}-400`} />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{user.email}</p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <Badge variant={roleCfg.color}>{roleCfg.label}</Badge>
                {user.is_approved ? (
                  <Badge variant="success">Approved</Badge>
                ) : (
                  <Badge variant="warning">Pending Approval</Badge>
                )}
                {user.email_verified_at ? (
                  <Badge variant="success">Email Verified</Badge>
                ) : (
                  <Badge variant="error">Email Unverified</Badge>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              {!user.is_approved && user.role !== 'admin' && (
                <>
                  <Button onClick={handleApprove} loading={actionLoading}>
                    <UserCheck className="mr-2 h-4 w-4" /> Approve
                  </Button>
                  <Button variant="danger" onClick={() => setShowReject(true)}>
                    <XCircle className="mr-2 h-4 w-4" /> Reject
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          {tabs.map(({ id: tabId, label, icon: TIcon }) => (
            <button
              key={tabId}
              onClick={() => setTab(tabId)}
              className={`flex items-center justify-center gap-2 flex-1 rounded-lg px-4 py-2.5 text-sm font-medium transition ${
                tab === tabId
                  ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              <TIcon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && <OverviewTab user={user} />}
        {tab === 'certificates' && (
          <CertificatesTab
            certificates={certificates}
            loading={certsLoading}
            total={certsTotal}
            currentPage={certsPage}
            lastPage={certsLastPage}
            onPageChange={fetchCertificates}
            onViewDetails={openCertDetail}
            role={user.role}
          />
        )}
        {tab === 'enrollments' && (
          <EnrollmentsTab
            enrollments={enrollments}
            loading={enrollLoading}
            total={enrollTotal}
            currentPage={enrollPage}
            lastPage={enrollLastPage}
            onPageChange={fetchEnrollments}
            role={user.role}
          />
        )}
        {tab === 'activity' && (
          <ActivityTab
            activities={activities}
            loading={activityLoading}
            total={activityTotal}
            currentPage={activityPage}
            lastPage={activityLastPage}
            onPageChange={fetchActivity}
          />
        )}
      </div>

      {/* Reject Modal */}
      <Modal open={showReject} onClose={() => { setShowReject(false); setRejectReason(''); }} title="Reject User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">This will permanently remove the user and their data.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowReject(false); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actionLoading} disabled={!rejectReason.trim()}>Reject User</Button>
          </div>
        </div>
      </Modal>

      {/* Certificate Details Modal */}
      <Modal open={!!certDetail} onClose={() => setCertDetail(null)} title="Certificate Details" size="lg">
        {certDetailLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : certDetail ? (
          <CertificateDetailContent cert={certDetail} onViewStudent={(uid) => { setCertDetail(null); navigate(`/admin/users/${uid}`); }} />
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function OverviewTab({ user }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Profile info */}
      <Card>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {user.role === 'student' ? 'Personal Information' : user.role === 'university' ? 'Institution Information' : user.role === 'verifier' ? 'Company Information' : 'Account Information'}
        </h2>
        {user.profile ? (
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            {Object.entries(user.profile).map(([key, value]) => {
              if (key === 'nid_set') {
                return <InfoRow key={key} icon={Hash} label="NID/Birth Cert" value={value ? 'Set ✓' : 'Not Set'} />;
              }
              const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
              return <InfoRow key={key} icon={User} label={label} value={value} />;
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">No profile data available.</p>
        )}
      </Card>

      {/* Account Info */}
      <div className="space-y-6">
        <Card>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={Calendar} label="Registered" value={user.created_at ? new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'} />
            <InfoRow icon={Mail} label="Email Verified" value={user.email_verified_at ? new Date(user.email_verified_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Not verified'} />
            <InfoRow icon={CheckCircle} label="Approved" value={user.approved_at ? new Date(user.approved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'Pending'} />
            {user.approved_by_name && <InfoRow icon={UserCog} label="Approved By" value={user.approved_by_name} />}
          </div>
        </Card>

        {/* Stats */}
        {user.stats && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistics</h2>
            <div className="grid grid-cols-2 gap-3">
              {Object.entries(user.stats).map(([key, value]) => {
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return <StatBox key={key} label={label} value={typeof value === 'number' && key.includes('rate') ? `${value}%` : value} />;
              })}
            </div>
          </Card>
        )}

        {/* Enrollment summary for students */}
        {user.enrollments_summary && user.enrollments_summary.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Enrollment</h2>
            {user.enrollments_summary.filter((e) => e.status === 'active').map((e) => (
              <div key={e.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">{e.institution}</p>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{e.program} · Batch {e.batch}</p>
                <p className="text-xs text-gray-400">Enrolled: {e.enrollment_date} · Expected: {e.expected_grad || 'TBD'}</p>
              </div>
            ))}
          </Card>
        )}
      </div>
    </div>
  );
}

function CertificatesTab({ certificates, loading, total, currentPage, lastPage, onPageChange, onViewDetails, role }) {
  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {role === 'university' ? 'Certificates Issued' : 'Certificates'}
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
      </div>

      {certificates.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <FileText className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No certificates found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {['Serial', 'Certificate', role === 'university' ? 'Student' : 'Institution', 'Level', 'CGPA', 'Issue Date', 'Status', ''].map((h) => (
                    <th key={h} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {certificates.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-3 px-3 font-mono text-xs text-gray-900 dark:text-white">{c.serial}</td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300 text-xs">{c.certificate_name}</td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs">{role === 'university' ? c.student_name : c.institution_name}</td>
                    <td className="py-3 px-3"><Badge variant="default">{c.certificate_level}</Badge></td>
                    <td className="py-3 px-3 text-gray-700 dark:text-gray-300 text-xs">{c.cgpa || '—'}</td>
                    <td className="py-3 px-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{c.issue_date}</td>
                    <td className="py-3 px-3">
                      {c.revoked_at ? <Badge variant="error">Revoked</Badge> : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onViewDetails(c.id)}
                        className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 transition"
                      >
                        <Eye className="h-3 w-3" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar currentPage={currentPage} lastPage={lastPage} onPageChange={onPageChange} />
        </>
      )}
    </Card>
  );
}

function EnrollmentsTab({ enrollments, loading, total, currentPage, lastPage, onPageChange, role }) {
  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const STATUS_COLORS = { active: 'success', graduated: 'primary', withdrawn: 'error' };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enrollments</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
      </div>

      {enrollments.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <BookOpen className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No enrollments found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  {[role === 'university' ? 'Student' : 'Institution', 'Program', 'Batch', 'Enrollment #', 'Status', 'Enrolled', 'Expected Grad'].map((h) => (
                    <th key={h} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {enrollments.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="py-3 px-3 text-sm text-gray-900 dark:text-white">{role === 'university' ? e.student_name : e.institution_name}</td>
                    <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300">{e.program}</td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">{e.batch || '—'}</td>
                    <td className="py-3 px-3 text-xs font-mono text-gray-500 dark:text-gray-400">{e.enrollment_number || '—'}</td>
                    <td className="py-3 px-3"><Badge variant={STATUS_COLORS[e.status] || 'default'}>{e.status}</Badge></td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.enrollment_date || '—'}</td>
                    <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.expected_grad || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <PaginationBar currentPage={currentPage} lastPage={lastPage} onPageChange={onPageChange} />
        </>
      )}
    </Card>
  );
}

function ActivityTab({ activities, loading, total, currentPage, lastPage, onPageChange }) {
  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const ACTION_COLORS = {
    user_approved: 'success',
    user_rejected: 'error',
    certificate_issued: 'primary',
    certificate_revoked: 'error',
    login: 'default',
    profile_updated: 'warning',
  };

  return (
    <Card>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Activity Log</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">{total} entries</p>
      </div>

      {activities.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-center">
          <Activity className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="flex items-start gap-3 rounded-xl border border-gray-100 dark:border-gray-800 p-3 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <div className="flex-shrink-0 mt-0.5">
                  <Badge variant={ACTION_COLORS[a.action] || 'default'}>{a.action?.replace(/_/g, ' ')}</Badge>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">{a.description}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {a.created_at}{a.ip_address ? ` · ${a.ip_address}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <PaginationBar currentPage={currentPage} lastPage={lastPage} onPageChange={onPageChange} />
        </>
      )}
    </Card>
  );
}

function PaginationBar({ currentPage, lastPage, onPageChange }) {
  if (lastPage <= 1) return null;
  return (
    <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
      <p className="text-sm text-gray-500 dark:text-gray-400">Page {currentPage} of {lastPage}</p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Prev
        </Button>
        <Button variant="secondary" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage >= lastPage}>
          Next <ChevronRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   CERTIFICATE DETAILS MODAL CONTENT
   ═══════════════════════════════════════════════════════════════════════ */

function CertificateDetailContent({ cert, onViewStudent }) {
  return (
    <div className="space-y-5">
      {/* Status banner */}
      <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
        cert.revoked_at
          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
      }`}>
        {cert.revoked_at ? (
          <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
        ) : (
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
        )}
        <div>
          <p className={`text-sm font-semibold ${cert.revoked_at ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
            {cert.revoked_at ? 'Certificate Revoked' : 'Certificate Active'}
          </p>
          {cert.revoked_at && cert.revocation_reason && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reason: {cert.revocation_reason}</p>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
        {/* Left: Certificate info */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Certificate Information</h3>
          <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
            <InfoRow icon={Hash} label="Serial Number" value={cert.serial} />
            <InfoRow icon={Award} label="Certificate" value={cert.certificate_name} />
            <InfoRow icon={Award} label="Level" value={cert.certificate_level} />
            <InfoRow icon={Award} label="Department" value={cert.department} />
            <InfoRow icon={Award} label="Major" value={cert.major} />
            <InfoRow icon={Award} label="Session" value={cert.session} />
            <InfoRow icon={Award} label="CGPA" value={cert.cgpa} />
            <InfoRow icon={Award} label="Degree Class" value={cert.degree_class} />
            <InfoRow icon={Calendar} label="Issue Date" value={cert.issue_date} />
            <InfoRow icon={Calendar} label="Convocation" value={cert.convocation_date} />
            <InfoRow icon={User} label="Authority" value={cert.authority_name ? `${cert.authority_name} (${cert.authority_title})` : null} />
          </div>
        </div>

        {/* Right: Student + Institution + Verification */}
        <div className="space-y-5">
          {cert.student && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Student</h3>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                <InfoRow icon={User} label="Name" value={cert.student.full_name} />
                <InfoRow icon={Hash} label="Student ID" value={cert.student.student_id} />
                <InfoRow icon={Calendar} label="DOB" value={cert.student.dob_masked} />
              </div>
              {cert.student.user_id && (
                <button
                  onClick={() => onViewStudent(cert.student.user_id)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  <ExternalLink className="h-3 w-3" /> View Student Profile
                </button>
              )}
            </div>
          )}

          {cert.institution && (
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Institution</h3>
              <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                <InfoRow icon={Building2} label="Name" value={cert.institution.name} />
              </div>
              {cert.institution.user_id && (
                <button
                  onClick={() => onViewStudent(cert.institution.user_id)}
                  className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                >
                  <ExternalLink className="h-3 w-3" /> View Institution Profile
                </button>
              )}
            </div>
          )}

          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verification</h3>
            <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
              <InfoRow icon={ShieldCheck} label="Times Verified" value={cert.verification_count} />
              <InfoRow icon={Clock} label="Last Verified" value={cert.last_verified_at ? new Date(cert.last_verified_at).toLocaleString() : 'Never'} />
              <InfoRow icon={User} label="Issued By" value={cert.issued_by_name} />
              <InfoRow icon={Eye} label="Publicly Shareable" value={cert.is_publicly_shareable ? 'Yes' : 'No'} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
