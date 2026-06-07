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
import MyAccessRequestCard from '../../components/access/MyAccessRequestCard';
import AccessDurationSelect from '../../components/access/AccessDurationSelect';
import PurposeInput from '../../components/access/PurposeInput';
import api from '../../services/api';
import { useNotifications } from '../../contexts/NotificationContext';

const tabs = [
  { id: 'pending', label: 'Pending Requests' },
  { id: 'granted', label: 'Granted Access' },
  { id: 'history', label: 'Request History' },
];

export default function StudentAccessRequests() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(() => {
    const tab = searchParams.get('tab');
    return tab && ['pending', 'granted', 'history'].includes(tab) ? tab : 'pending';
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pendingRequests, setPendingRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [grantedAccesses, setGrantedAccesses] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [requestModalType, setRequestModalType] = useState('');
  const [selectedAccess, setSelectedAccess] = useState(null);
  const [approveDuration, setApproveDuration] = useState('30');
  const [rejectReason, setRejectReason] = useState('');
  const { refreshCount } = useNotifications();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [{ data: requestsData }, { data: accessData }] = await Promise.all([
        api.get('/student/access-requests'),
        api.get('/student/granted-access'),
      ]);

      setPendingRequests(requestsData.pending_requests || []);
      setHistoryRequests(requestsData.history || []);
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

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['pending', 'granted', 'history'].includes(tab)) {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const activeAccesses = useMemo(() => {
    return grantedAccesses.filter((access) => access.is_active && !access.revoked_at && new Date(access.expires_at) > new Date());
  }, [grantedAccesses]);

  const handleApprove = async () => {
    if (!selectedRequest) {
      return;
    }

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
    if (!selectedRequest) {
      return;
    }

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
    if (!selectedAccess) {
      return;
    }

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

  const renderEmptyState = (title, description) => (
    <Card>
      <div className="py-10 text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{description}</p>
      </div>
    </Card>
  );

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
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Access Requests</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Manage verifier access</h1>
          </div>
          <Badge variant="primary">{pendingRequests.length} pending</Badge>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-2 dark:border-gray-800">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSearchParams({ tab: tab.id });
              }}
              className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'pending' ? (
          <div className="space-y-4">
            {pendingRequests.length > 0
              ? pendingRequests.map((request) => (
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
              : renderEmptyState('No pending requests', 'Verifier access requests will appear here when they are waiting for your approval.')}
          </div>
        ) : null}

        {activeTab === 'granted' ? (
          <div className="space-y-4">
            {activeAccesses.length > 0
              ? activeAccesses.map((access) => (
                  <GrantedAccessCard
                    key={access.id}
                    access={access}
                    onRevoke={setSelectedAccess}
                    loading={submitting}
                  />
                ))
              : renderEmptyState('No active access', 'Once you approve a verifier, their active access will be shown here.')}
          </div>
        ) : null}

        {activeTab === 'history' ? (
          <div className="space-y-4">
            {historyRequests.length > 0
              ? historyRequests.map((request) => (
                  <MyAccessRequestCard key={request.id} request={request} />
                ))
              : renderEmptyState('No history yet', 'Approved and rejected requests will appear here for your review.')}
          </div>
        ) : null}
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
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">{selectedRequest.verifier?.company_name || 'Unknown company'}</p>
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
            <div className="rounded-xl bg-gray-50 p-4 text-sm text-gray-600 dark:bg-gray-900/60 dark:text-gray-300">
              <p className="font-semibold text-gray-900 dark:text-white">
                {selectedAccess.company_name || selectedAccess.verifier?.company_name || 'Unknown company'}
              </p>
              <p className="mt-1">Expires on {new Date(selectedAccess.expires_at).toLocaleDateString()}</p>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
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
