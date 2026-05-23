import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserCheck, RefreshCw } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import EmptyState from '../../components/shared/EmptyState';
import api from '../../services/api';

export default function UserApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

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
      toast.error(err.response?.data?.message || 'Failed to approve user.');
    } finally {
      setProcessingId(null);
    }
  };

  const rejectUser = async (id) => {
    const reason = window.prompt('Reason for rejection');
    if (!reason) return;
    setProcessingId(id);
    try {
      await api.post(`/admin/reject-user/${id}`, { reason });
      toast.success('User rejected.');
      setUsers((current) => current.filter((user) => user.id !== id));
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to reject user.');
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
          <div className="grid gap-4">
            {users.map((user) => (
              <Card key={user.id} className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{user.email}</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Role: {user.role}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => approveUser(user.id)} 
                      loading={processingId === user.id}
                      disabled={processingId !== null && processingId !== user.id}
                    >
                      Approve
                    </Button>
                    <Button 
                      variant="danger" 
                      onClick={() => rejectUser(user.id)}
                      disabled={processingId !== null}
                    >
                      Reject
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
