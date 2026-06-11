import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import AccessRequestCard from '../../components/access/AccessRequestCard';
import GrantedAccessCard from '../../components/access/GrantedAccessCard';
import AccessDurationSelect from '../../components/access/AccessDurationSelect';
import PurposeInput from '../../components/access/PurposeInput';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';
import EmptyState from '../../components/shared/EmptyState';
import { FileText, ShieldCheck } from 'lucide-react';

export default function StudentAccessRequests() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [grantedAccesses, setGrantedAccesses] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalType, setRequestModalType] = useState('');
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [approveDuration, setApproveDuration] = useState('30');
  const [rejectReason, setRejectReason] = useState('');
  const [historyPage, setHistoryPage] = useState(1);
  const itemsPerPage = 10;
  const { refreshCount } = useNotifications();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: requestsData }, { data: accessData }] = await Promise.all([
        api.get('/student/access-requests'),
        api.get('/student/granted-access'),
      ]);

      setPendingRequests(requestsData.pending_requests || []);
      setGrantedAccesses(accessData.accesses || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load access requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const activeAccesses = useMemo(() => {
    return grantedAccesses.filter((access) => access.is_active && !access.revoked_at && new Date(access.expires_at) > new Date());
  }, [grantedAccesses]);

  const historyAccesses = useMemo(() => {
    return grantedAccesses.filter((access) => !access.is_active || access.revoked_at || new Date(access.expires_at) <= new Date());
  }, [grantedAccesses]);

  const totalHistoryPages = Math.ceil(historyAccesses.length / itemsPerPage);
  
  const paginatedHistory = useMemo(() => {
    const startIndex = (historyPage - 1) * itemsPerPage;
    return historyAccesses.slice(startIndex, startIndex + itemsPerPage);
  }, [historyAccesses, historyPage]);

  const handleApprove = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      await api.post(`/student/access-requests/${selectedRequest.id}/approve`, {
        access_duration_days: Number(approveDuration),
      });
      toast.success('Access request approved.');
      setSelectedRequest(null);
      setRequestModalType('');
      await fetchData();
      await refreshCount();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to approve request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    setSubmitting(true);
    try {
      await api.post(`/student/access-requests/${selectedRequest.id}/reject`, {
        rejection_reason: rejectReason,
      });
      toast.success('Access request rejected.');
      setSelectedRequest(null);
      setRequestModalType('');
      setRejectReason('');
      await fetchData();
      await refreshCount();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to reject request.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async () => {
    if (!selectedAccess) return;

    setSubmitting(true);
    try {
      await api.post(`/student/granted-access/${selectedAccess.id}/revoke`);
      toast.success('Access revoked.');
      setSelectedAccess(null);
      await fetchData();
      await refreshCount();
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Unable to revoke access.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-[24px]">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Manage verifier access</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Review requests and manage active access to your certificates.</p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Section 1: Incoming Requests */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-[24px]">Incoming Requests</h2>
          <div className="space-y-[24px]">
            {pendingRequests.length > 0 ? (
              pendingRequests.map((request) => (
                <AccessRequestCard
                  key={request.id}
                  request={request}
                  onApprove={(item) => {
                    setSelectedRequest(item);
                    setRequestModalType('approve');
                    setApproveDuration('30');
                  }}
                  onReject={(item) => {
                    setSelectedRequest(item);
                    setRequestModalType('reject');
                    setRejectReason('');
                  }}
                  loading={submitting}
                />
              ))
            ) : (
              <EmptyState title="No pending requests" message="Verifier access requests will appear here when they are waiting for your approval." icon={FileText} />
            )}
          </div>
        </div>

        {/* Section 2: Granted Access */}
        <div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-[24px]">Granted Access</h2>
          <div className="space-y-[24px]">
            {activeAccesses.length > 0 ? (
              activeAccesses.map((access) => (
                <GrantedAccessCard
                  key={access.id}
                  access={access}
                  onRevoke={setSelectedAccess}
                  loading={submitting}
                />
              ))
            ) : (
              <EmptyState title="No active access" message="Once you approve a verifier, their active access will be shown here." icon={ShieldCheck} />
            )}
          </div>
        </div>

        {/* Section 3: Access History */}
        {historyAccesses.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-[24px] pt-4 border-t border-[var(--border)]">Access History</h2>
            <div className="space-y-[24px] opacity-75">
              {paginatedHistory.map((access) => (
                <GrantedAccessCard
                  key={access.id}
                  access={access}
                  onRevoke={setSelectedAccess}
                  loading={submitting}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {totalHistoryPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-6 pt-4 border-t border-[var(--border)] opacity-75">
                <span className="text-sm text-[var(--text-secondary)]">
                  Showing {(historyPage - 1) * itemsPerPage + 1} to {Math.min(historyPage * itemsPerPage, historyAccesses.length)} of {historyAccesses.length} entries
                </span>
                <div className="flex items-center gap-3">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm font-medium text-[var(--text-primary)] min-w-[5rem] text-center">
                    Page {historyPage} of {totalHistoryPages}
                  </span>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                    disabled={historyPage === totalHistoryPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <Modal
        open={!!selectedRequest && requestModalType === 'approve'}
        onClose={() => {
          setSelectedRequest(null);
          setRequestModalType('');
        }}
        title="Approve access request"
      >
        {selectedRequest ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)]">{selectedRequest.verifier?.company_name || 'Unknown company'}</p>
              <p className="mt-1 whitespace-pre-line leading-relaxed">{selectedRequest.purpose}</p>
            </div>

            <AccessDurationSelect
              value={approveDuration}
              onChange={(event) => setApproveDuration(event.target.value)}
            />

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => {
                setSelectedRequest(null);
                setRequestModalType('');
              }} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleApprove} loading={submitting} disabled={!approveDuration}>
                Confirm approve
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={!!selectedRequest && requestModalType === 'reject'}
        onClose={() => {
          setSelectedRequest(null);
          setRequestModalType('');
          setRejectReason('');
        }}
        title="Reject access request"
      >
        <div className="space-y-5">
          <PurposeInput 
            value={rejectReason} 
            onChange={(event) => setRejectReason(event.target.value)} 
            minLength={10}
            placeholder="Explain why you are rejecting this request..."
            error={rejectReason.trim().length > 0 && rejectReason.trim().length < 10 ? 'Reason must be at least 10 characters.' : ''}
          />
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="secondary" onClick={() => {
              setSelectedRequest(null);
              setRequestModalType('');
              setRejectReason('');
            }} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleReject} loading={submitting} disabled={rejectReason.trim().length < 10}>
              Confirm reject
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!selectedAccess}
        onClose={() => setSelectedAccess(null)}
        title="Revoke verifier access"
      >
        {selectedAccess ? (
          <div className="space-y-5">
            <div className="rounded-xl bg-[var(--bg-surface)] p-4 text-sm text-[var(--text-secondary)]">
              <p className="font-semibold text-[var(--text-primary)]">
                {selectedAccess.company_name || selectedAccess.verifier?.company_name || 'Unknown company'}
              </p>
              <p className="mt-1">Expires on {new Date(selectedAccess.expires_at).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-[var(--text-secondary)]">
              This will immediately stop the verifier from seeing your certificates.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <Button variant="secondary" onClick={() => setSelectedAccess(null)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="danger" onClick={handleRevoke} loading={submitting}>
                Confirm revoke
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
