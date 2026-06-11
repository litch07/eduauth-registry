import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import {
  ArrowLeft, GraduationCap, Building2, ShieldCheck, UserCog, Eye,
  CheckCircle, XCircle, Clock, Mail, Calendar, Hash, User, Award,
  FileText, Activity, BookOpen, ExternalLink, UserCheck, ChevronLeft,
  ChevronRight, RotateCcw, Copy, Check,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import RestoreModal from '../../components/shared/RestoreModal';
import StatusTimeline from '../../components/shared/StatusTimeline';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

const ROLE_CONFIG = {
  student:    { label: 'Student',    color: 'primary', icon: GraduationCap, bg: 'primary' },
  university: { label: 'University', color: 'success', icon: Building2,     bg: 'green' },
  verifier:   { label: 'Verifier',   color: 'warning', icon: ShieldCheck,   bg: 'amber' },
  admin:      { label: 'Admin',      color: 'error',   icon: UserCog,       bg: 'red' },
};

function InfoRow({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
      <span className="w-40 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white break-words">{String(value)}</span>
    </div>
  );
}

function StatBox({ label, value, color = 'primary', onClick }) {
  const Component = onClick ? 'button' : 'div';
  return (
    <Component 
      onClick={onClick}
      className={`rounded-xl border border-gray-100 dark:border-gray-800 p-4 text-center ${onClick ? 'hover:border-primary-300 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition cursor-pointer w-full focus:outline-none' : ''}`}
    >
      <p className={`text-2xl font-bold text-${color}-600 dark:text-${color}-400`}>{value ?? 0}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{label}</p>
    </Component>
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

  // Filters
  const [certsFilter, setCertsFilter] = useState('all');
  const [enrollsFilter, setEnrollsFilter] = useState('all');

  // Certificate detail modal
  const [certDetail, setCertDetail] = useState(null);
  const [certDetailLoading, setCertDetailLoading] = useState(false);

  // Restore modal
  const [restoreTarget, setRestoreTarget] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  // Revoke modal
  const [revokeTarget, setRevokeTarget] = useState(null);
  const [revokeLoading, setRevokeLoading] = useState(false);
  const [certRevokeReason, setCertRevokeReason] = useState('');

  // Reject modal
  const [showReject, setShowReject] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Suspend modal
  const [showSuspend, setShowSuspend] = useState(false);
  const [suspendReason, setSuspendReason] = useState('');

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
      const params = { page };
      if (certsFilter !== 'all') params.status = certsFilter;
      const { data } = await api.get(`/admin/users/${id}/certificates`, { params });
      setCertificates(data.data || []);
      setCertsPage(data.current_page || 1);
      setCertsLastPage(data.last_page || 1);
      setCertsTotal(data.total || 0);
    } catch {
      toast.error('Failed to load certificates.');
    } finally {
      setCertsLoading(false);
    }
  }, [id, certsFilter]);

  const fetchEnrollments = useCallback(async (page = 1) => {
    setEnrollLoading(true);
    try {
      const params = { page };
      if (enrollsFilter !== 'all') params.status = enrollsFilter;
      const { data } = await api.get(`/admin/users/${id}/enrollments`, { params });
      setEnrollments(data.data || []);
      setEnrollPage(data.current_page || 1);
      setEnrollLastPage(data.last_page || 1);
      setEnrollTotal(data.total || 0);
    } catch {
      toast.error('Failed to load enrollments.');
    } finally {
      setEnrollLoading(false);
    }
  }, [id, enrollsFilter]);

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
  }, [tab, user, fetchCertificates, fetchEnrollments, fetchActivity]);

  const handleStatClick = (statKey) => {
    if (statKey.includes('certificate')) {
      if (statKey.includes('revoked')) setCertsFilter('revoked');
      else setCertsFilter('all');
      setTab('certificates');
    } else if (statKey.includes('enroll')) {
      if (statKey.includes('active')) setEnrollsFilter('active');
      else if (statKey.includes('withdrawn')) setEnrollsFilter('withdrawn');
      else if (statKey.includes('graduated')) setEnrollsFilter('graduated');
      else setEnrollsFilter('all');
      setTab('enrollments');
    } else if (statKey.includes('activit') || statKey.includes('verification')) {
      setTab('activity');
    }
  };

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

  const handleSuspend = async () => {
    if (!suspendReason.trim()) return;
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${id}/suspend`, { reason: suspendReason });
      toast.success('User suspended.');
      setUser((u) => ({ ...u, suspended_at: new Date().toISOString(), suspension_reason: suspendReason }));
      setShowSuspend(false);
      setSuspendReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to suspend.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnsuspend = async () => {
    setActionLoading(true);
    try {
      await api.post(`/admin/users/${id}/unsuspend`);
      toast.success('User unsuspended.');
      setUser((u) => ({ ...u, suspended_at: null, suspension_reason: null }));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to unsuspend.');
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

  const handleRestoreClick = (cert) => {
    setRestoreTarget(cert);
  };

  const handleRestore = (reason) => {
    if (!restoreTarget) return;
    setRestoreLoading(true);

    api.post(`/admin/certificates/${restoreTarget.id}/restore`, { reason })
      .then(({ data }) => {
        toast.success('Certificate restored successfully');
        // Update certDetail state so UI reflects the change without reload
        setCertDetail(prev => ({
          ...prev,
          revoked_at: null,
          revocation_reason: null,
          revoked_by_name: null,
          revocation_history: data.certificate?.revocation_history ?? prev.revocation_history,
        }));
        // Update the certificates list in the Certificates tab
        setCertificates(prev => prev.map(c =>
          c.id === restoreTarget.id
            ? { ...c, revoked_at: null, revocation_reason: null }
            : c
        ));
        setRestoreTarget(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to restore certificate.');
      })
      .finally(() => {
        setRestoreLoading(false);
      });
  };

  const handleRevokeClick = (cert) => {
    setRevokeTarget(cert);
    setCertRevokeReason('');
  };

  const handleRevokeCert = () => {
    if (!revokeTarget || !certRevokeReason.trim()) return;
    setRevokeLoading(true);

    api.post(`/admin/certificates/${revokeTarget.id}/revoke`, { reason: certRevokeReason })
      .then(({ data }) => {
        toast.success('Certificate revoked successfully');
        setCertDetail(prev => ({
          ...prev,
          revoked_at: new Date().toISOString(),
          revocation_reason: certRevokeReason,
          revoked_by_name: 'Admin', // optimistic update
          revocation_history: data.certificate?.revocation_history ?? prev.revocation_history,
        }));
        setCertificates(prev => prev.map(c =>
          c.id === revokeTarget.id
            ? { ...c, revoked_at: new Date().toISOString(), revocation_reason: certRevokeReason }
            : c
        ));
        setRevokeTarget(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to revoke certificate.');
      })
      .finally(() => {
        setRevokeLoading(false);
      });
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
              {user.is_approved && !user.suspended_at && user.role !== 'admin' && (
                <Button variant="danger" onClick={() => setShowSuspend(true)}>
                  <XCircle className="mr-2 h-4 w-4" /> Suspend Account
                </Button>
              )}
              {user.suspended_at && (
                <Button variant="success" onClick={handleUnsuspend} loading={actionLoading}>
                  <CheckCircle className="mr-2 h-4 w-4" /> Unsuspend Account
                </Button>
              )}
            </div>
          </div>
        </Card>

        {/* Warning Banner */}
        {user.suspended_at && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/40 dark:bg-red-900/20">
            <div className="flex items-start gap-3">
              <XCircle className="mt-0.5 h-5 w-5 text-red-600 dark:text-red-400" />
              <div>
                <h3 className="text-sm font-medium text-red-800 dark:text-red-300">Account Suspended</h3>
                <p className="mt-1 text-sm text-red-700 dark:text-red-400">
                  Reason: {user.suspension_reason}
                </p>
              </div>
            </div>
          </div>
        )}

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
        {tab === 'overview' && <OverviewTab user={user} onStatClick={handleStatClick} />}
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
            filter={certsFilter}
            onFilterChange={setCertsFilter}
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
            filter={enrollsFilter}
            onFilterChange={setEnrollsFilter}
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
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowReject(false); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} loading={actionLoading} disabled={!rejectReason.trim()}>Reject User</Button>
          </div>
        </div>
      </Modal>

      {/* Suspend Modal */}
      <Modal open={showSuspend} onClose={() => { setShowSuspend(false); setSuspendReason(''); }} title="Suspend User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">This will suspend the user, preventing them from logging in.</p>
          <textarea
            value={suspendReason}
            onChange={(e) => setSuspendReason(e.target.value)}
            placeholder="Reason for suspension..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setShowSuspend(false); setSuspendReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleSuspend} loading={actionLoading} disabled={!suspendReason.trim()}>Suspend User</Button>
          </div>
        </div>
      </Modal>

      {/* Restore Certificate Modal */}
      <RestoreModal
        certificate={restoreTarget}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        loading={restoreLoading}
      />

      {/* Revoke Certificate Modal */}
      <Modal open={!!revokeTarget} onClose={() => { setRevokeTarget(null); setCertRevokeReason(''); }} title="Revoke Certificate" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Please provide a reason for revoking this certificate.</p>
          <textarea
            value={certRevokeReason}
            onChange={(e) => setCertRevokeReason(e.target.value)}
            placeholder="Reason for revocation..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setRevokeTarget(null); setCertRevokeReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={handleRevokeCert} loading={revokeLoading} disabled={!certRevokeReason.trim()}>Revoke Certificate</Button>
          </div>
        </div>
      </Modal>

      {/* Certificate Details Modal */}
      <Modal open={!!certDetail} onClose={() => setCertDetail(null)} title="Certificate Details" size="xl">
        {certDetailLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : certDetail ? (
          <CertificateDetailContent
            cert={certDetail}
            onViewStudent={(uid) => { setCertDetail(null); navigate(`/admin/users/${uid}`); }}
            onRestoreClick={handleRestoreClick}
            onRevokeClick={handleRevokeClick}
          />
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   TAB COMPONENTS
   ═══════════════════════════════════════════════════════════════════════ */

function OverviewTab({ user, onStatClick }) {
  return (
    <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
      {/* Left Column */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Profile info */}
        <Card className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {user.role === 'student' ? 'Personal Information' : user.role === 'university' ? 'Institution Information' : user.role === 'verifier' ? 'Company Information' : 'Account Information'}
          </h2>
          {user.profile ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {Object.entries(user.profile).map(([key, value]) => {
                if (key === 'nid_display') {
                  const isLegacy = typeof value === 'string' && (
                    value.startsWith('NID on file') || value === 'Not Set' || value === '[Encrypted]'
                  );
                  return (
                    <div key={key} className="py-1.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
                      <div className="flex items-start gap-3">
                        <Hash className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                        <div className="flex-1">
                          <span className="text-sm text-gray-500 dark:text-gray-400 block mb-1.5">
                            NID / Birth Certificate (Full)
                          </span>
                          {isLegacy ? (
                            <span className="text-sm italic text-gray-400 dark:text-gray-500">{value}</span>
                          ) : (
                            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-900/20 px-3 py-2">
                              <p className="text-[10px] font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400 mb-1">
                                Sensitive — Admin Only
                              </p>
                              <span className="font-mono text-sm font-semibold text-amber-900 dark:text-amber-200 tracking-wider">
                                {value}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                }
                const label = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
                return <InfoRow key={key} icon={User} label={label} value={value} />;
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">No profile data available.</p>
          )}
        </Card>

        {/* Enrollment summary for students */}
        {user.enrollments_summary && user.enrollments_summary.length > 0 && (
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Current Enrollment</h2>
            {user.enrollments_summary.filter((e) => e.status === 'active').map((e) => (
              <div key={e.id} className="rounded-xl border border-gray-100 dark:border-gray-800 p-4 space-y-2 mt-2">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-gray-900 dark:text-white">{e.institution}</p>
                  <Badge variant="success">Active</Badge>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">{e.program} · Batch {e.batch} · Student ID: {e.roll_number || '—'}</p>
                <p className="text-xs text-gray-400">Enrolled: {e.enrollment_date} · Expected: {e.expected_grad || 'TBD'}</p>
              </div>
            ))}
          </Card>
        )}
      </div>

      {/* Right Column */}
      <div className="space-y-6 flex flex-col h-full">
        {/* Account Info */}
        <Card className="flex-1">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Account Information</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <InfoRow icon={Calendar} label="Registered" value={user.created_at ? formatDate(user.created_at) : '—'} />
            <InfoRow icon={Mail} label="Email Verified" value={user.email_verified_at ? formatDate(user.email_verified_at) : 'Not verified'} />
            <InfoRow icon={CheckCircle} label="Approved" value={user.approved_at ? formatDate(user.approved_at) : 'Pending'} />
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
                return <StatBox key={key} label={label} value={typeof value === 'number' && key.includes('rate') ? `${value}%` : value} onClick={() => onStatClick(key)} />;
              })}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function CertificatesTab({ certificates, loading, total, currentPage, lastPage, onPageChange, onViewDetails, role, filter, onFilterChange }) {
  const filteredCertificates = filter === 'revoked' 
     ? certificates.filter(c => c.revoked_at) 
     : filter === 'active' 
     ? certificates.filter(c => !c.revoked_at) 
     : certificates;

  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {role === 'university' ? 'Certificates Issued' : 'Certificates'}
        </h2>
        <div className="flex items-center gap-3">
          <select 
            value={filter} 
            onChange={(e) => onFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>
      </div>

      {filteredCertificates.length === 0 ? (
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
                {filteredCertificates.map((c) => (
                  <tr key={c.id} className="h-12 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-3 py-0 font-mono text-xs text-gray-900 dark:text-white">{c.serial}</td>
                    <td className="px-3 py-0 text-gray-700 dark:text-gray-300 text-xs">{c.certificate_name}</td>
                    <td className="px-3 py-0 text-gray-500 dark:text-gray-400 text-xs">{role === 'university' ? c.student_name : c.institution_name}</td>
                    <td className="px-3 py-0"><Badge variant="default">{c.certificate_level}</Badge></td>
                    <td className="px-3 py-0 text-gray-700 dark:text-gray-300 text-xs">{c.cgpa || '—'}</td>
                    <td className="px-3 py-0 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{c.issue_date}</td>
                    <td className="px-3 py-0">
                      {c.revoked_at ? <Badge variant="error">Revoked</Badge> : <Badge variant="success">Active</Badge>}
                    </td>
                    <td className="px-3 py-0 text-right">
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

function EnrollmentsTab({ enrollments, loading, total, currentPage, lastPage, onPageChange, role, filter, onFilterChange }) {
  if (loading) return <div className="flex justify-center py-16"><LoadingSpinner /></div>;

  const STATUS_COLORS = { active: 'success', graduated: 'primary', withdrawn: 'error' };

  const filteredEnrollments = filter === 'all' 
    ? enrollments 
    : enrollments.filter(e => e.status === filter);

  return (
    <Card>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Enrollments</h2>
        <div className="flex items-center gap-3">
          <select 
            value={filter} 
            onChange={(e) => onFilterChange(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="graduated">Graduated</option>
            <option value="withdrawn">Withdrawn</option>
          </select>
          <p className="text-sm text-gray-500 dark:text-gray-400">{total} total</p>
        </div>
      </div>

      {filteredEnrollments.length === 0 ? (
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
                  {[role === 'university' ? 'Student' : 'Institution', 'Student ID', 'Program', 'Batch', 'Enrollment #', 'Status', 'Enrolled', 'Expected Grad'].map((h) => (
                    <th key={h} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredEnrollments.map((e) => (
                  <tr key={e.id} className="h-12 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                    <td className="px-3 py-0 text-sm text-gray-900 dark:text-white">{role === 'university' ? e.student_name : e.institution_name}</td>
                    <td className="px-3 py-0 text-xs text-gray-700 dark:text-gray-300">{e.roll_number || '—'}</td>
                    <td className="px-3 py-0 text-xs text-gray-700 dark:text-gray-300">{e.program}</td>
                    <td className="px-3 py-0 text-xs text-gray-500 dark:text-gray-400">{e.batch || '—'}</td>
                    <td className="px-3 py-0 text-xs font-mono text-gray-500 dark:text-gray-400">{e.enrollment_number || '—'}</td>
                    <td className="px-3 py-0"><Badge variant={STATUS_COLORS[e.status] || 'default'}>{e.status}</Badge></td>
                    <td className="px-3 py-0 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.enrollment_date || '—'}</td>
                    <td className="px-3 py-0 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{e.expected_grad || '—'}</td>
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

function CertificateDetailContent({ cert, onViewStudent, onRestoreClick, onRevokeClick }) {
  const [copiedSerial, setCopiedSerial] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  const getVerificationUrl = (certificate) => certificate.share_link || `${window.location.origin}/verify?serial=${encodeURIComponent(certificate.serial)}`;

  const handleCopySerial = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
      setCopiedSerial(serial);
      toast.success('Copied!');
      setTimeout(() => setCopiedSerial(null), 2000);
    } catch (err) {
      toast.error('Failed to copy serial number');
    }
  };

  const handleCopyVerificationLink = async (certificate) => {
    try {
      await navigator.clipboard.writeText(getVerificationUrl(certificate));
      setCopiedLink(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      toast.error('Failed to copy share link');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header and Serial */}
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {cert.certificate_name}
          </h2>
          {/* Restore/Revoke buttons */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {cert.revoked_at && onRestoreClick && (
              <button
                onClick={() => onRestoreClick(cert)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-100 dark:hover:bg-green-900/40 transition"
              >
                <RotateCcw className="h-3.5 w-3.5" /> Restore
              </button>
            )}
            {!cert.revoked_at && onRevokeClick && (
              <button
                onClick={() => onRevokeClick(cert)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition"
              >
                <XCircle className="h-3.5 w-3.5" /> Revoke
              </button>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/40">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant={cert.revoked_at ? 'danger' : 'success'}>
              {cert.revoked_at ? 'Revoked' : 'Active'}
            </Badge>
            <Badge variant="primary">{cert.certificate_level}</Badge>
            {cert.is_publicly_shareable && <Badge variant="warning">Public Share</Badge>}
          </div>

          {cert.revoked_at && (
            <div className="mt-3 rounded-lg bg-red-50 dark:bg-red-900/20 p-3 border border-red-100 dark:border-red-800/30">
              <p className="text-xs text-red-800 dark:text-red-300 font-medium mb-1">Revocation Details</p>
              <p className="text-xs text-red-600 dark:text-red-400">
                <span className="font-medium">By:</span> {cert.revoked_by_name} <span className="italic">({cert.revoked_by_role})</span>
              </p>
              <p className="text-xs text-red-600 dark:text-red-400 mt-0.5">
                <span className="font-medium">Reason:</span> {cert.revocation_reason}
              </p>
            </div>
          )}

          <p className="mt-4 text-sm uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Serial Number</p>
          <div className="flex items-center gap-3 mt-1">
            <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{cert.serial}</p>
            <button
              onClick={() => handleCopySerial(cert.serial)}
              className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition flex items-center gap-1"
              title="Copy serial number"
            >
              {copiedSerial === cert.serial ? (
                <>
                  <Check className="h-5 w-5 text-green-600 dark:text-green-400 animate-fade-in" />
                  <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                </>
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Certificate Details Grid */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
          <DetailTile label="Institution" value={cert.institution?.name} action={cert.institution?.user_id ? { label: "View Institution", onClick: () => onViewStudent(cert.institution.user_id) } : null} />
          <DetailTile label="Student" value={cert.student?.full_name} action={cert.student?.user_id ? { label: "View Student", onClick: () => onViewStudent(cert.student.user_id) } : null} />
          <DetailTile label="Issue Date" value={cert.issue_date} />
          <DetailTile label="Department" value={cert.department || 'N/A'} />
          <DetailTile label="Major" value={cert.major || 'N/A'} />
          <DetailTile label="Session" value={cert.session || 'N/A'} />
          <DetailTile label="CGPA" value={cert.cgpa || 'N/A'} />
          <DetailTile label="Degree Class" value={cert.degree_class || 'N/A'} />
          <DetailTile label="Convocation" value={cert.convocation_date || 'N/A'} />
        </div>
      </div>

      {/* Verification Section */}
      <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch rounded-2xl border border-gray-200 p-5 dark:border-gray-800 bg-white dark:bg-gray-900/40">
        <div className="flex-1 space-y-4 w-full">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Verification Link</h3>
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
              Use this link or the QR code to verify this certificate's authenticity.
            </p>
            <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3 border border-gray-100 dark:border-gray-700 break-all text-sm font-mono text-gray-800 dark:text-gray-200">
              {getVerificationUrl(cert)}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <Button onClick={() => handleCopyVerificationLink(cert)}>
              {copiedLink ? (
                <><Check className="mr-2 h-4 w-4" />Copied!</>
              ) : (
                <><Copy className="mr-2 h-4 w-4" />Copy Share Link</>
              )}
            </Button>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ShieldCheck className="mr-1.5 h-4 w-4" />
              <span>
                Verified <span className="font-semibold text-gray-900 dark:text-gray-200">{cert.verification_count}</span> times 
                {cert.last_verified_at && ` (Last: ${new Date(cert.last_verified_at).toLocaleDateString()})`}
              </span>
            </div>
          </div>
        </div>
        
        <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700">
          <QRCodeSVG
            value={getVerificationUrl(cert)}
            size={120}
            level="H"
            includeMargin={true}
            fgColor="#0f172a"
            bgColor="#ffffff"
          />
          <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Scan to verify</p>
        </div>
      </div>

      {/* Status Timeline */}
      <StatusTimeline
        history={cert.revocation_history}
        issueDate={cert.issue_date}
      />
    </div>
  );
}

function DetailTile({ label, value, action }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60 flex flex-col justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white truncate" title={value || 'N/A'}>{value || 'N/A'}</p>
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-primary-600 hover:text-primary-700 transition"
        >
          <ExternalLink className="h-3 w-3" /> {action.label}
        </button>
      )}
    </div>
  );
}
