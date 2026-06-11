import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserCheck, RefreshCw, XCircle, Clock, Eye } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import EmptyState from '../../components/shared/EmptyState';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { useNavigate } from 'react-router-dom';

export default function UserApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  const navigate = useNavigate();
  const [rejectModalId, setRejectModalId] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get('/admin/pending-users');
      setUsers(data.pending_users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch pending users.');
      toast.error('Failed to load pending users.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const approveUser = async (id) => {
    setProcessingId(id);
    try {
      await api.post(`/admin/approve-user/${id}`);
      toast.success('User approved successfully.');
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve user.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectUser = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please enter a rejection reason.');
      return;
    }
    setProcessingId(rejectModalId);
    try {
      await api.post(`/admin/reject-user/${rejectModalId}`, { reason: rejectReason });
      toast.success('User rejected.');
      setUsers((current) => current.filter((user) => user.id !== rejectModalId));
      setRejectModalId(null);
      setRejectReason('');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject user.');
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Approvals</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Pending user registrations</h1>
          </div>
          <Button variant="outline" onClick={fetchUsers} loading={loading} className="!p-2">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><LoadingSpinner /></div>
        ) : error ? (
          <ErrorMessage message={error} retry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState 
            title="No pending users" 
            message="There are currently no new users waiting for approval." 
            icon={UserCheck}
          />
        ) : (
          <Card>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Email / Name', 'Role', 'Status', 'Registered', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {users.map((user) => (
                    <tr key={user.id} className="h-12 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="px-3 py-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                      </td>
                      <td className="px-3 py-0">
                        <Badge variant={user.role === 'university' ? 'success' : user.role === 'verifier' ? 'warning' : 'primary'}>
                          {user.role}
                        </Badge>
                      </td>
                      <td className="px-3 py-0">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-amber-500" />
                          <span className="text-xs text-gray-600 dark:text-gray-400">Pending</span>
                        </div>
                      </td>
                      <td className="px-3 py-0 text-xs text-gray-500 dark:text-gray-400">
                        {user.created_at ? formatDate(user.created_at) : '—'}
                      </td>
                      <td className="px-3 py-0 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${user.id}`)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 transition"
                          >
                            <Eye className="h-3.5 w-3.5" /> Details
                          </button>
                          <button
                            onClick={() => approveUser(user.id)}
                            disabled={processingId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:hover:bg-green-900/40 px-2.5 py-1 text-xs font-medium transition"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => setRejectModalId(user.id)}
                            disabled={processingId === user.id}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 px-2.5 py-1 text-xs font-medium transition"
                          >
                            <XCircle className="h-3.5 w-3.5" /> Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Modal open={!!rejectModalId} onClose={() => { setRejectModalId(null); setRejectReason(''); }} title="Reject User" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">Please provide a reason for rejecting this application.</p>
          <textarea
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Reason for rejection..."
            rows={3}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white resize-none"
          />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => { setRejectModalId(null); setRejectReason(''); }}>Cancel</Button>
            <Button variant="danger" onClick={rejectUser} loading={processingId === rejectModalId} disabled={!rejectReason.trim()}>Reject User</Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
