import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Users, ShieldCheck, FileText, Activity, ArrowRight, UserPlus, UserCog, GraduationCap, Building2, CheckCircle } from 'lucide-react';
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
            icon={<Users className="h-5 w-5" />} 
            label="Total Users" 
            value={stats?.total_users ?? 0} 
            color="primary" 
            to="/admin/users" 
          />
          <StatCard 
            icon={<FileText className="h-5 w-5" />} 
            label="Total Certificates" 
            value={stats?.total_certificates ?? 0} 
            color="blue" 
            to="/admin/certificates" 
          />
          <StatCard 
            icon={<UserCog className="h-5 w-5" />} 
            label="Pending Profile Changes" 
            value={stats?.pending_profile_changes ?? 0} 
            color="yellow" 
            to="/admin/profile-change-requests" 
            urgentCount={stats?.pending_profile_changes ?? 0}
            tooltip="Click to manage profile change requests"
          />
          <StatCard 
            icon={<Building2 className="h-5 w-5" />} 
            label="Total Universities" 
            value={stats?.total_universities ?? 0} 
            color="emerald" 
            to="/admin/users?role=university" 
          />
          <StatCard 
            icon={<GraduationCap className="h-5 w-5" />} 
            label="Total Students" 
            value={stats?.total_students ?? 0} 
            color="primary" 
            to="/admin/users?role=student" 
          />
          <StatCard 
            icon={<Activity className="h-5 w-5" />} 
            label="System Activity Today" 
            value={stats?.activity_today ?? 0} 
            color="green" 
            to="/admin/activity-logs?filter=today" 
          />
          <StatCard 
            icon={<CheckCircle className="h-5 w-5" />} 
            label="Recent Verifications" 
            value={stats?.recent_verifications ?? 0} 
            color="emerald" 
            to="/admin/verification-logs" 
          />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Manage Users</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">View, search, and manage all registered users.</p>
            </div>
            <button
              onClick={() => navigate('/admin/users')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-lg"
            >
              View Users
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
