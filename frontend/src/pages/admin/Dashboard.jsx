import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Users, ShieldCheck, FileText, Activity, ArrowRight } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/admin/dashboard');
        setStats(data.stats);
      } catch (error) {
        console.error('Failed to fetch admin dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

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

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={<Users className="h-5 w-5" />} label="Total Users" value={stats?.total_users ?? 0} color="primary" />
          <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Pending Approvals" value={stats?.pending_approvals ?? 0} color="yellow" />
          <StatCard icon={<FileText className="h-5 w-5" />} label="Certificates" value={stats?.total_certificates ?? 0} color="blue" />
          <StatCard icon={<Activity className="h-5 w-5" />} label="Activity Logs" value={stats?.total_activity ?? 0} color="green" />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Approvals</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Review and approve pending user registrations.</p>
            </div>
            <button
              onClick={() => navigate('/admin/user-approvals')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
            >
              Review
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
