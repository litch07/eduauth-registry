import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { GraduationCap, AlertCircle, LogOut, Clock, Building2 } from 'lucide-react';
import Modal from '../../components/shared/Modal';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

export default function MyUniversity() {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: profileData } = await api.get('/profile');
      setProfile(profileData.profile);

      try {
        const { data: wData } = await api.get('/student/withdrawal/requests');
        setWithdrawalRequests(wData.requests || []);
      } catch (_err) { /* ignore */ }
    } catch (_error) {
      toast.error('Failed to load university information.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

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
                      <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-800/40">
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
            <div className="py-12 text-center">
              <AlertCircle className="mx-auto mb-4 h-16 w-16 text-gray-400" />
              <p className="text-gray-600 dark:text-gray-400">You are not currently enrolled in any university</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-500">Contact a university to request enrollment</p>
            </div>
          )}
        </Card>

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
