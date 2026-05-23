import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { FileText, CheckCircle, XCircle, Download, Eye, Filter } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';

const statusVariants = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
};

const roleLabels = {
  student: 'Student',
  university: 'University',
  verifier: 'Verifier',
};

export default function ProfileChangeRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [pendingCount, setPendingCount] = useState(0);
  const [filterStatus, setFilterStatus] = useState('pending');
  const [filterRole, setFilterRole] = useState('');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectNotes, setRejectNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchRequests = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page };
      if (filterStatus) params.status = filterStatus;
      if (filterRole) params.role = filterRole;

      const { data } = await api.get('/admin/profile-change-requests', { params });
      setRequests(data.requests || []);
      setPagination(data.pagination || { current_page: 1, last_page: 1, total: 0 });
      setPendingCount(data.pending_count || 0);
    } catch (_err) {
      toast.error('Failed to load change requests.');
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterRole]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleApprove = async (id) => {
    setProcessing(true);
    try {
      await api.post(`/admin/profile-change-requests/${id}/approve`);
      toast.success('Change request approved and applied.');
      setSelectedRequest(null);
      fetchRequests(pagination.current_page);
      window.dispatchEvent(new CustomEvent('profile_requests_updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    setProcessing(true);
    try {
      await api.post(`/admin/profile-change-requests/${rejectModal.id}/reject`, {
        review_notes: rejectNotes,
      });
      toast.success('Change request rejected.');
      setRejectModal(null);
      setRejectNotes('');
      setSelectedRequest(null);
      fetchRequests(pagination.current_page);
      window.dispatchEvent(new CustomEvent('profile_requests_updated'));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setProcessing(false);
    }
  };

  const viewDetails = async (id) => {
    try {
      const { data } = await api.get(`/admin/profile-change-requests/${id}`);
      setSelectedRequest(data.request);
    } catch (_err) {
      toast.error('Failed to load request details.');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Administration</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Profile Change Requests</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Review and manage user profile change requests
            {pendingCount > 0 && (
              <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                {pendingCount} pending
              </span>
            )}
          </p>
        </div>

        {/* Filters */}
        <Card>
          <div className="flex flex-wrap items-center gap-3">
            <Filter className="h-4 w-4 text-gray-400" />
            <div className="flex flex-wrap gap-2">
              {['', 'pending', 'approved', 'rejected'].map((status) => (
                <button
                  key={status || 'all'}
                  onClick={() => setFilterStatus(status)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filterStatus === status
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {status ? status.charAt(0).toUpperCase() + status.slice(1) : 'All'}
                </button>
              ))}
            </div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <div className="flex flex-wrap gap-2">
              {['', 'student', 'university', 'verifier'].map((role) => (
                <button
                  key={role || 'all-roles'}
                  onClick={() => setFilterRole(role)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                    filterRole === role
                      ? 'bg-primary-600 text-white shadow-sm'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700'
                  }`}
                >
                  {role ? roleLabels[role] : 'All Roles'}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Requests List */}
        <Card>
          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center"><LoadingSpinner /></div>
          ) : requests.length === 0 ? (
            <EmptyState icon={FileText} message="No change requests found for the selected filters." />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead>
                    <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
                      <th className="py-3 pr-4">User</th>
                      <th className="py-3 pr-4">Role</th>
                      <th className="py-3 pr-4">Field</th>
                      <th className="py-3 pr-4">Change</th>
                      <th className="py-3 pr-4">Status</th>
                      <th className="py-3 pr-4">Date</th>
                      <th className="py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm dark:divide-gray-800">
                    {requests.map((req) => (
                      <tr key={req.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-900/20">
                        <td className="py-3 pr-4">
                          <p className="font-medium text-gray-900 dark:text-white">{req.user_name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{req.user_email}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant="secondary">{roleLabels[req.user_role] || req.user_role}</Badge>
                        </td>
                        <td className="py-3 pr-4 font-medium text-gray-800 dark:text-gray-200">{req.field_label}</td>
                        <td className="py-3 pr-4">
                          <p className="text-xs">
                            <span className="text-gray-400 line-through">{req.current_value || 'N/A'}</span>
                            <span className="mx-1">→</span>
                            <span className="font-medium text-primary-600 dark:text-primary-400">{req.requested_value}</span>
                          </p>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={statusVariants[req.status]}>{req.status.toUpperCase()}</Badge>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-500">{formatDate(req.created_at)}</td>
                        <td className="py-3">
                          <button
                            onClick={() => viewDetails(req.id)}
                            className="rounded-lg p-1.5 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20"
                            title="View details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="mt-4 flex items-center justify-between">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Page {pagination.current_page} of {pagination.last_page} ({pagination.total} total)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => fetchRequests(pagination.current_page - 1)}
                    disabled={pagination.current_page <= 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => fetchRequests(pagination.current_page + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </Card>

        {/* Detail Modal */}
        {selectedRequest && (
          <Modal
            open={true}
            onClose={() => setSelectedRequest(null)}
            title="Change Request Details"
            size="lg"
          >
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">User</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.user_name}</p>
                  <p className="text-xs text-gray-500">{selectedRequest.user_email}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Role</p>
                  <p className="mt-1">
                    <Badge variant="secondary">{roleLabels[selectedRequest.user_role] || selectedRequest.user_role}</Badge>
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Field</p>
                  <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{selectedRequest.field_label}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Status</p>
                  <p className="mt-1">
                    <Badge variant={statusVariants[selectedRequest.status]}>{selectedRequest.status.toUpperCase()}</Badge>
                  </p>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-900/40">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase text-gray-400">Current Value</p>
                    <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{selectedRequest.current_value || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase text-primary-500">Requested Value</p>
                    <p className="mt-1 text-sm font-semibold text-primary-700 dark:text-primary-300">{selectedRequest.requested_value}</p>
                  </div>
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">Reason</p>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 italic">"{selectedRequest.reason}"</p>
              </div>

              {/* Documents */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                    Supporting Documents
                  </p>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc) => (
                      <a
                        key={doc.index}
                        href={`${api.defaults.baseURL}${doc.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white p-3 text-sm text-primary-600 hover:bg-primary-50 dark:border-gray-700 dark:bg-gray-900 dark:hover:bg-primary-900/20"
                      >
                        <Download className="h-4 w-4" />
                        {doc.filename}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Review notes if already reviewed */}
              {selectedRequest.review_notes && (
                <div className={`rounded-xl p-4 border ${
                  selectedRequest.status === 'approved'
                    ? 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-900/30'
                    : 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900/30'
                }`}>
                  <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Admin Notes</p>
                  <p className={`text-sm ${
                    selectedRequest.status === 'approved' ? 'text-green-800 dark:text-green-300' : 'text-red-800 dark:text-red-300'
                  }`}>"{selectedRequest.review_notes}"</p>
                </div>
              )}

              {/* Action buttons — only for pending */}
              {selectedRequest.status === 'pending' && (
                <div className="flex gap-3 pt-2">
                  <Button
                    variant="danger"
                    onClick={() => {
                      setRejectModal(selectedRequest);
                      setRejectNotes('');
                    }}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={() => handleApprove(selectedRequest.id)}
                    loading={processing}
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Approve & Apply
                  </Button>
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* Reject Modal */}
        {rejectModal && (
          <Modal open={true} onClose={() => setRejectModal(null)} title="Reject Change Request">
            <div className="space-y-4">
              <div className="rounded-xl bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-800 dark:text-red-200">
                  You are about to reject the {rejectModal.field_label} change request for <strong>{rejectModal.user_name}</strong>.
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                  Rejection Reason <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white min-h-[100px]"
                  value={rejectNotes}
                  onChange={(e) => setRejectNotes(e.target.value)}
                  placeholder="Please explain why this request is being rejected..."
                  required
                  minLength={5}
                />
              </div>
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setRejectModal(null)}>Cancel</Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={handleReject}
                  loading={processing}
                  disabled={rejectNotes.length < 5}
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </div>
    </DashboardLayout>
  );
}
