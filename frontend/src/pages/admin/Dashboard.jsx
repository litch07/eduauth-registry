import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import Modal from '../../components/shared/Modal';
import { Users, ShieldCheck, FileText, Activity, ArrowRight, UserPlus, UserCog, GraduationCap, Building2, CheckCircle, Clock, XCircle, Check, X, Eye } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  
  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [selectedUserToReject, setSelectedUserToReject] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchData = async () => {
    try {
      const [dashRes, pendingRes, activityRes] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/pending-users'),
        api.get('/admin/activity-logs?per_page=5')
      ]);
      setStats(dashRes.data.stats);
      setPendingUsers(pendingRes.data.pending_users?.slice(0, 5) || []);
      setRecentActivities(activityRes.data.logs?.data?.slice(0, 5) || activityRes.data.data?.slice(0, 5) || []);
    } catch (error) {
      console.error('Failed to fetch admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleApprove = async (id) => {
    setActionLoading(`approve-${id}`);
    try {
      await api.post(`/admin/approve-user/${id}`);
      toast.success('User approved successfully.');
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to approve user.');
    } finally {
      setActionLoading(null);
    }
  };

  const openRejectModal = (u) => {
    setSelectedUserToReject(u);
    setRejectReason('');
    setRejectModalOpen(true);
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setActionLoading(`reject-${selectedUserToReject.id}`);
    try {
      await api.post(`/admin/reject-user/${selectedUserToReject.id}`, { reason: rejectReason });
      toast.success('User rejected successfully.');
      setRejectModalOpen(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to reject user.');
    } finally {
      setActionLoading(null);
    }
  };

  const formatTimeAgo = (dateString) => {
    // Check if it's backend formatted "d/m/Y H:i"
    if (dateString && typeof dateString === 'string' && dateString.includes('/')) {
      const parts = dateString.split(/[\s/:]/);
      if (parts.length >= 5) {
        // parts: 0=DD, 1=MM, 2=YYYY, 3=HH, 4=mm
        const date = new Date(parts[2], parts[1] - 1, parts[0], parts[3], parts[4]);
        const diff = Math.floor((new Date() - date) / 1000);
        if (diff < 60) return 'Just now';
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
      }
      return dateString;
    }
    const date = new Date(dateString);
    const diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
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
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Admin Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Total Users" 
            value={stats?.total_users ?? 0} 
            color="primary" 
            to="/admin/users" 
          />
          <StatCard 
            icon={<ShieldCheck className="h-5 w-5" />} 
            label="Pending Approvals" 
            value={stats?.pending_approvals ?? 0} 
            color="orange" 
            to="/admin/users?status=pending" 
            urgentCount={stats?.pending_approvals ?? 0}
            tooltip="Click to manage pending user approvals"
          />
          <StatCard 
            icon={<FileText className="h-5 w-5" />} 
            label="Total Certificates" 
            value={stats?.total_certificates ?? 0} 
            color="blue" 
            to="/admin/certificates" 
          />
          <StatCard 
            icon={<CheckCircle className="h-5 w-5" />} 
            label="Total Verifications" 
            value={stats?.recent_verifications ?? 0} 
            color="emerald" 
            to="/admin/verification-logs" 
          />
          <StatCard 
            icon={<Building2 className="h-5 w-5" />} 
            label="Active Universities" 
            value={stats?.total_universities ?? 0} 
            color="indigo" 
            to="/admin/users?role=university" 
          />
          <StatCard 
            icon={<UserCog className="h-5 w-5" />} 
            label="Pending Profile Changes" 
            value={stats?.pending_profile_changes ?? 0} 
            color="yellow" 
            to="/admin/profile-change-requests" 
            urgentCount={stats?.pending_profile_changes ?? 0}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Recent Activity */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <button 
                onClick={() => navigate('/admin/activity-logs')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View All
              </button>
            </div>
            
            <div className="flex-1">
              {recentActivities.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentActivities.map((activity) => (
                    <div key={activity.id} className="py-3 flex items-start gap-3">
                      <div className="mt-0.5 h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {activity.action_description}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {activity.user_name} • {activity.target || 'System'}
                        </p>
                      </div>
                      <span className="text-xs text-gray-400 flex-shrink-0">
                        {formatTimeAgo(activity.created_at)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                  No recent activity found.
                </div>
              )}
            </div>
          </Card>

          {/* Pending Approvals */}
          <Card className="flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-orange-500" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pending Approvals</h2>
              </div>
              <button 
                onClick={() => navigate('/admin/users?status=pending')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
              >
                View All
              </button>
            </div>

            <div className="flex-1">
              {pendingUsers.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {pendingUsers.map((u) => (
                    <div key={u.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-10 w-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 text-primary-600 dark:text-primary-400 font-bold">
                          {(u.name || u.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{u.name || 'Unknown User'}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Badge variant="secondary" className="text-[10px] uppercase tracking-wider">{u.role}</Badge>
                            <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleApprove(u.id)}
                          disabled={actionLoading !== null}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/40 transition"
                          title="Approve User"
                        >
                          <Check className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => openRejectModal(u)}
                          disabled={actionLoading !== null}
                          className="h-8 w-8 flex items-center justify-center rounded-lg bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 transition"
                          title="Reject User"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex h-32 items-center justify-center text-sm text-gray-500">
                  No pending approvals.
                </div>
              )}
            </div>
          </Card>
        </div>

      </div>

      {/* Reject Modal */}
      <Modal
        open={rejectModalOpen}
        onClose={() => setRejectModalOpen(false)}
        title="Reject User Application"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            You are about to reject the application for <strong>{selectedUserToReject?.name}</strong>. Please provide a reason below. This will be emailed to the user.
          </p>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              rows={4}
              placeholder="E.g., invalid documentation, unauthorized institution..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <Button variant="secondary" onClick={() => setRejectModalOpen(false)} disabled={actionLoading !== null}>
              Cancel
            </Button>
            <Button 
              className="bg-red-600 hover:bg-red-700 text-white" 
              onClick={handleReject}
              loading={actionLoading === `reject-${selectedUserToReject?.id}`}
            >
              Confirm Rejection
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
