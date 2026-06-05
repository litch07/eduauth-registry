import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { GraduationCap, AlertCircle, LogOut, Clock, Building2, CalendarPlus, X, Upload, Check, XCircle, ArrowRightLeft, Send, FileText, Info } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

export default function MyUniversity() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [showExtensionModal, setShowExtensionModal] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  const [extensionRequests, setExtensionRequests] = useState([]);
  const [enrollmentApplications, setEnrollmentApplications] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profileData } = await api.get('/profile');
      setProfile(profileData.profile);

      try {
        const { data: wData } = await api.get('/student/withdrawal/requests');
        setWithdrawalRequests(wData.requests || []);
      } catch (_err) { /* ignore */ }

      try {
        const { data: eData } = await api.get('/student/extension-requests');
        setExtensionRequests(eData.requests || []);
      } catch (_err) { /* ignore */ }

      try {
        const { data: appData } = await api.get('/student/enrollment-applications');
        setEnrollmentApplications(appData.applications || []);
      } catch (_err) { /* ignore */ }
    } catch (_error) {
      toast.error('Failed to load university information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const hasPendingOrCounterOffered = extensionRequests.some(
    (r) => r.status === 'pending' || r.status === 'counter_offered'
  );

  const handleCancelExtension = async (id) => {
    try {
      const { data } = await api.delete(`/student/extension-requests/${id}`);
      toast.success(data.message || 'Extension request cancelled');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel request');
    }
  };

  const handleAcceptCounterOffer = async (id) => {
    try {
      const { data } = await api.post(`/student/extension-requests/${id}/accept`);
      toast.success(data.message || 'Counter offer accepted');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to accept counter offer');
    }
  };

  const handleDeclineCounterOffer = async (id) => {
    try {
      const { data } = await api.post(`/student/extension-requests/${id}/decline`);
      toast.success(data.message || 'Counter offer declined');
      loadData();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to decline counter offer');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Education</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            My University
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View your current enrollment and request history</p>
        </div>

        {/* ─── STUDENT ENROLLMENT SECTION ─── */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gray-500" />
              Current Enrollment
            </h2>
            {profile?.current_enrollment && (
              profile.current_enrollment.status === 'withdrawal_requested'
                ? <Badge variant="warning">WITHDRAWAL PENDING</Badge>
                : <Badge variant="success">ACTIVE</Badge>
            )}
          </div>

          {profile?.current_enrollment ? (
            <>
              {profile.current_enrollment.status === 'withdrawal_requested' && (
                <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
                      Your withdrawal request is pending review by the university.
                    </p>
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-blue-50 p-6 dark:bg-blue-900/20">
                <div className="flex items-start gap-4">
                  <div className="rounded-xl bg-blue-600 p-3">
                    <GraduationCap className="h-8 w-8 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {profile.current_enrollment.institution_name}
                    </h3>
                    <div className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Enrollment Number</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{profile.current_enrollment.enrollment_number}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Program</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{profile.current_enrollment.program}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Batch</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">{profile.current_enrollment.batch}</p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Enrollment Date</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                          {profile.current_enrollment.enrollment_date
                            ? new Date(profile.current_enrollment.enrollment_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Expected Graduation</p>
                        <p className="mt-1 font-medium text-gray-900 dark:text-white">
                          {profile.current_enrollment.expected_graduation_date
                            ? new Date(profile.current_enrollment.expected_graduation_date).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {profile.current_enrollment.status === 'active' && (
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/40 flex flex-wrap gap-3">
                        <Button variant="danger" type="button" onClick={() => setShowWithdrawalModal(true)}>
                          <LogOut className="mr-2 h-4 w-4" />
                          Request Withdrawal
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="py-8 text-center">
              <Building2 className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">You are not currently enrolled in any university</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500 mb-6">Browse approved universities and submit an enrollment application</p>
              <Button onClick={() => navigate('/student/universities')}>
                <Send className="mr-2 h-4 w-4" />
                Browse Universities & Apply
              </Button>
            </div>
          )}
        </Card>

        {/* ─── ENROLLMENT APPLICATIONS SECTION (shown when no active enrollment) ─── */}
        {!profile?.current_enrollment && enrollmentApplications.length > 0 && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <FileText className="h-5 w-5 text-gray-500" />
                My Applications
              </h2>
              <Badge variant="secondary">{enrollmentApplications.length} applications</Badge>
            </div>

            <div className="space-y-4">
              {enrollmentApplications.map((app) => {
                const statusVariant =
                  app.status === 'approved' ? 'success' :
                  app.status === 'rejected' ? 'danger' :
                  app.status === 'pending' ? 'warning' :
                  app.status === 'more_info_requested' ? 'primary' : 'secondary';

                const statusLabel =
                  app.status === 'more_info_requested' ? 'MORE INFO NEEDED' : app.status.toUpperCase();

                const canCancel = ['pending', 'more_info_requested'].includes(app.status);

                return (
                  <div key={app.id} className={`rounded-xl border p-4 space-y-3 ${
                    app.status === 'more_info_requested'
                      ? 'border-primary-200 bg-primary-50/30 dark:border-primary-800/40 dark:bg-primary-900/10'
                      : 'border-gray-100 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-900/30'
                  }`}>
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{app.institution_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {[app.program, app.batch].filter(Boolean).join(' • ') || 'No program specified'} • Applied: {formatDate(app.created_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{statusLabel}</Badge>
                        {canCancel && (
                          <Button
                            variant="danger"
                            type="button"
                            onClick={async () => {
                              try {
                                const { data } = await api.delete(`/student/enrollment-applications/${app.id}`);
                                toast.success(data.message || 'Application withdrawn');
                                loadData();
                              } catch (err) {
                                toast.error(err.response?.data?.message || 'Failed to cancel application');
                              }
                            }}
                            className="!px-3 !py-1 text-xs"
                          >
                            <X className="mr-1 h-3 w-3" />
                            Cancel
                          </Button>
                        )}
                      </div>
                    </div>

                    {app.reason && (
                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-800">
                        <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Reason for Applying</p>
                        <p className="italic">"{app.reason}"</p>
                      </div>
                    )}

                    {/* More info requested — highlight with university message */}
                    {app.status === 'more_info_requested' && app.university_response && (
                      <div className="rounded-xl border-2 border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800/40 dark:bg-primary-900/20 space-y-2">
                        <div className="flex items-center gap-2">
                          <Info className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                            University Needs More Information
                          </p>
                        </div>
                        <div className="text-sm text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                          <p className="italic">"{app.university_response}"</p>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Please contact the university directly with the requested information.
                        </p>
                      </div>
                    )}

                    {/* Show university response for rejected/approved applications */}
                    {app.status !== 'pending' && app.status !== 'more_info_requested' && app.university_response && (
                      <div className={`text-xs p-3 rounded-lg border ${
                        app.status === 'approved'
                          ? 'bg-green-50/50 border-green-100 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300'
                          : 'bg-red-50/50 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300'
                      }`}>
                        <p className="font-semibold text-[10px] uppercase tracking-wider opacity-60 mb-1">
                          Response from University {app.reviewed_at ? `(${formatDate(app.reviewed_at)})` : ''}
                        </p>
                        <p className="font-medium">"{app.university_response}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}

        {/* ─── EXTENSION REQUESTS SECTION ─── */}
        {profile?.current_enrollment && (
          <Card>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <CalendarPlus className="h-5 w-5 text-gray-500" />
                Extension Requests
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant="secondary">{extensionRequests.length} requests</Badge>
                {profile.current_enrollment.status === 'active' && !hasPendingOrCounterOffered && (
                  <Button type="button" onClick={() => setShowExtensionModal(true)}>
                    <CalendarPlus className="mr-2 h-4 w-4" />
                    Request Graduation Extension
                  </Button>
                )}
              </div>
            </div>

            {extensionRequests.length > 0 ? (
              <div className="space-y-4">
                {extensionRequests.map((req) => {
                  const statusVariant =
                    req.status === 'approved' ? 'success' :
                    req.status === 'rejected' ? 'danger' :
                    req.status === 'pending' ? 'warning' :
                    req.status === 'counter_offered' ? 'primary' : 'secondary';

                  const statusLabel =
                    req.status === 'counter_offered' ? 'COUNTER OFFERED' : req.status.toUpperCase();

                  return (
                    <div key={req.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{req.institution_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Requested: {new Date(req.requested_graduation_date).toLocaleDateString()} • Submitted: {formatDate(req.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={statusVariant}>{statusLabel}</Badge>
                          {req.status === 'pending' && (
                            <Button
                              variant="danger"
                              type="button"
                              onClick={() => handleCancelExtension(req.id)}
                              className="!px-3 !py-1 text-xs"
                            >
                              <X className="mr-1 h-3 w-3" />
                              Cancel
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-800">
                        <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Reason for Extension</p>
                        <p className="italic">"{req.reason}"</p>
                      </div>

                      {req.supporting_document_path && (
                        <div className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
                          <Upload className="h-3 w-3" />
                          <span>Supporting document attached</span>
                        </div>
                      )}

                      {/* Counter offer display */}
                      {req.status === 'counter_offered' && (
                        <div className="rounded-xl border-2 border-primary-200 bg-primary-50/50 p-4 dark:border-primary-800/40 dark:bg-primary-900/20 space-y-3">
                          <div className="flex items-center gap-2">
                            <ArrowRightLeft className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                            <p className="text-sm font-semibold text-primary-800 dark:text-primary-200">
                              University Counter Offer
                            </p>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Proposed Date</p>
                              <p className="mt-1 font-semibold text-primary-700 dark:text-primary-300">
                                {new Date(req.counter_offered_date).toLocaleDateString()}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Your Requested Date</p>
                              <p className="mt-1 font-medium text-gray-600 dark:text-gray-400 line-through">
                                {new Date(req.requested_graduation_date).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          {req.university_response && (
                            <div className="text-xs text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-100 dark:border-gray-800">
                              <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">University Message</p>
                              <p className="italic">"{req.university_response}"</p>
                            </div>
                          )}
                          <div className="flex gap-3 pt-1">
                            <Button
                              variant="success"
                              type="button"
                              onClick={() => handleAcceptCounterOffer(req.id)}
                            >
                              <Check className="mr-2 h-4 w-4" />
                              Accept Offer
                            </Button>
                            <Button
                              variant="danger"
                              type="button"
                              onClick={() => handleDeclineCounterOffer(req.id)}
                            >
                              <XCircle className="mr-2 h-4 w-4" />
                              Decline
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Show university response for rejected/approved requests */}
                      {req.status !== 'pending' && req.status !== 'counter_offered' && req.university_response && (
                        <div className={`text-xs p-3 rounded-lg border ${
                          req.status === 'approved'
                            ? 'bg-green-50/50 border-green-100 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300'
                            : 'bg-red-50/50 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300'
                        }`}>
                          <p className="font-semibold text-[10px] uppercase tracking-wider opacity-60 mb-1">
                            Response from University ({formatDate(req.reviewed_at)})
                          </p>
                          <p className="font-medium">"{req.university_response}"</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-8 text-center bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
                <p className="text-sm text-gray-500 dark:text-gray-400">No extension requests found.</p>
                {profile.current_enrollment.status === 'active' && (
                  <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
                    You can request a graduation date extension if you need more time.
                  </p>
                )}
              </div>
            )}
          </Card>
        )}

        {/* Withdrawal History */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="h-5 w-5 text-gray-500" />
              Withdrawal Request History
            </h2>
            <Badge variant="secondary">{withdrawalRequests.length} requests</Badge>
          </div>
          {withdrawalRequests.length > 0 ? (
            <div className="space-y-4">
              {withdrawalRequests.map((req) => {
                const statusVariant =
                  req.status === 'approved' ? 'success' :
                  req.status === 'rejected' ? 'danger' :
                  req.status === 'pending' ? 'warning' : 'secondary';
                return (
                  <div key={req.id} className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-800 dark:bg-gray-900/30 space-y-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{req.institution_name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{req.program} • {req.batch}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={statusVariant}>{req.status.toUpperCase()}</Badge>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(req.requested_at)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-950 p-3 rounded-lg border border-gray-150 dark:border-gray-800">
                      <p className="font-semibold text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-1">Reason for withdrawal</p>
                      <p className="italic">"{req.reason}"</p>
                    </div>
                    {req.status !== 'pending' && req.response_message && (
                      <div className={`text-xs p-3 rounded-lg border ${
                        req.status === 'approved'
                          ? 'bg-green-50/50 border-green-100 text-green-800 dark:bg-green-950/20 dark:border-green-900/30 dark:text-green-300'
                          : 'bg-red-50/50 border-red-100 text-red-800 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-300'
                      }`}>
                        <p className="font-semibold text-[10px] uppercase tracking-wider opacity-60 mb-1">
                          Response from University ({formatDate(req.responded_at)})
                        </p>
                        <p className="font-medium">"{req.response_message}"</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center bg-gray-50/30 dark:bg-gray-900/10 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
              <p className="text-sm text-gray-500 dark:text-gray-400">No withdrawal requests found.</p>
            </div>
          )}
        </Card>

        {showWithdrawalModal && profile?.current_enrollment && (
          <WithdrawalRequestModal
            enrollment={profile.current_enrollment}
            onClose={() => setShowWithdrawalModal(false)}
            onSuccess={() => {
              setShowWithdrawalModal(false);
              loadData();
            }}
          />
        )}

        {showExtensionModal && profile?.current_enrollment && (
          <ExtensionRequestModal
            enrollment={profile.current_enrollment}
            onClose={() => setShowExtensionModal(false)}
            onSuccess={() => {
              setShowExtensionModal(false);
              loadData();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── WITHDRAWAL MODAL ──────────────────────────────────────
function WithdrawalRequestModal({ enrollment, onClose, onSuccess }) {
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const { data } = await api.post('/student/withdrawal/request', {
        enrollment_id: enrollment.id,
        reason,
      });
      toast.success(data.message || 'Withdrawal request submitted');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to submit withdrawal request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Request Withdrawal">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-red-50 p-4 dark:bg-red-900/20">
          <p className="text-sm font-semibold text-red-800 dark:text-red-200">You are requesting withdrawal from:</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.institution_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.program} • {enrollment.batch}</p>
        </div>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Your withdrawal request will be sent to the university for review.
          </p>
        </div>
        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Withdrawal <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[120px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why you want to withdraw..."
            required
            minLength={20}
            maxLength={1000}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{reason.length}/1000 characters</p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="danger" loading={submitting} className="flex-1">
            <LogOut className="mr-2 h-4 w-4" />
            Submit Withdrawal Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── EXTENSION REQUEST MODAL ──────────────────────────────────────
function ExtensionRequestModal({ enrollment, onClose, onSuccess }) {
  const [requestedDate, setRequestedDate] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Compute min date for the date picker (day after current expected graduation)
  const minDate = enrollment.expected_graduation_date
    ? (() => {
        const d = new Date(enrollment.expected_graduation_date);
        d.setDate(d.getDate() + 1);
        return d.toISOString().split('T')[0];
      })()
    : new Date().toISOString().split('T')[0];

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      // Validate file size (5MB)
      if (selected.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      // Validate file type
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowed.includes(selected.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed');
        e.target.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('enrollment_id', enrollment.id);
      formData.append('requested_graduation_date', requestedDate);
      formData.append('reason', reason);
      if (file) {
        formData.append('supporting_document', file);
      }

      const { data } = await api.post('/student/extension-requests', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(data.message || 'Extension request submitted');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message
        || err.response?.data?.errors?.reason?.[0]
        || err.response?.data?.errors?.requested_graduation_date?.[0]
        || 'Failed to submit extension request';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Request Graduation Extension">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">Requesting extension for:</p>
          <p className="mt-1 font-medium text-gray-900 dark:text-white">{enrollment.institution_name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{enrollment.program} • {enrollment.batch}</p>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Current expected graduation:{' '}
            <span className="font-semibold text-gray-900 dark:text-white">
              {enrollment.expected_graduation_date
                ? new Date(enrollment.expected_graduation_date).toLocaleDateString()
                : 'N/A'}
            </span>
          </p>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Your extension request will be sent to the university for review.
            The university may approve, reject, or propose an alternative date.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Requested New Graduation Date <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
            value={requestedDate}
            onChange={(e) => setRequestedDate(e.target.value)}
            min={minDate}
            required
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Must be after current expected graduation date
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Extension <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[120px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Please explain why you need a graduation date extension (minimum 30 characters)..."
            required
            minLength={30}
          />
          <p className={`text-xs mt-1 ${reason.length < 30 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
            {reason.length}/30 minimum characters {reason.length >= 30 && '✓'}
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Supporting Document <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/30 dark:file:text-primary-300"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PDF, JPG, or PNG files up to 5MB
          </p>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Upload className="h-3 w-3" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} className="flex-1">
            <CalendarPlus className="mr-2 h-4 w-4" />
            Submit Extension Request
          </Button>
        </div>
      </form>
    </Modal>
  );
}
