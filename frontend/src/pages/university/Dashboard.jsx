import { useEffect, useState } from 'react';
import { FilePlus2, School, ShieldCheck, AlertTriangle, MessageSquare, ArrowRight, Users, UserCheck, Award, Calendar, BookOpen } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UniversityDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/university/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardLayout><div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">University Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Total Enrolled Students" 
            value={stats?.stats?.total_enrolled ?? 0} 
            color="primary" 
            to="/university/enrollments?filter=active" 
          />
          <StatCard 
            icon={<UserCheck className="h-5 w-5" />} 
            label="Graduated Students" 
            value={stats?.stats?.graduated_students ?? 0} 
            color="green" 
            to="/university/enrollments?filter=graduated" 
          />
          <StatCard 
            icon={<Award className="h-5 w-5" />} 
            label="Certificates Issued" 
            value={stats?.stats?.total_certificates ?? 0} 
            color="blue" 
            to="/university/certificates" 
          />
          <StatCard 
            icon={<AlertTriangle className="h-5 w-5" />} 
            label="Pending Withdrawals" 
            value={stats?.stats?.pending_withdrawals ?? 0} 
            color="orange" 
            to="/university/withdrawal/pending" 
            urgentCount={stats?.stats?.pending_withdrawals ?? 0}
            tooltip="Click to manage pending requests"
          />
          <StatCard 
            icon={<Calendar className="h-5 w-5" />} 
            label="This Month's Certificates" 
            value={stats?.stats?.this_month_certificates ?? 0} 
            color="emerald" 
            to="/university/certificates?filter=this_month" 
          />
          <StatCard 
            icon={<BookOpen className="h-5 w-5" />} 
            label="Active Programs" 
            value={stats?.stats?.active_programs ?? 0} 
            color="yellow" 
            to="/university/enrollments?view=programs" 
          />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Issue a new certificate</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate and assign a certificate for an enrolled student.</p>
            </div>
            <button
              onClick={() => navigate('/university/issue-certificate')}
              className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700 hover:-translate-y-0.5 hover:shadow-lg"
            >
              <FilePlus2 className="h-4 w-4" />
              Issue
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
