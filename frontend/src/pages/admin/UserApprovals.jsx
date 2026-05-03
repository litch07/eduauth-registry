import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

export default function UserApprovals() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await api.get('/admin/pending-users');
        setUsers(data.pending_users || []);
      } catch (error) {
        console.error('Failed to fetch pending users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const approveUser = async (id) => {
    await api.post(`/admin/approve-user/${id}`);
    setUsers((current) => current.filter((user) => user.id !== id));
  };

  const rejectUser = async (id) => {
    const reason = window.prompt('Reason for rejection');
    if (!reason) return;
    await api.post(`/admin/reject-user/${id}`, { reason });
    setUsers((current) => current.filter((user) => user.id !== id));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Approvals</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Pending user registrations</h1>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><LoadingSpinner /></div>
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
                    <Button onClick={() => approveUser(user.id)}>Approve</Button>
                    <Button variant="danger" onClick={() => rejectUser(user.id)}>Reject</Button>
                  </div>
                </div>
              </Card>
            ))}
            {users.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No pending users.</p> : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
