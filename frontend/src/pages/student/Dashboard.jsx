import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCopy, CheckCircle2, Clock3 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/student/dashboard');
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
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Student Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={<BookCopy className="h-5 w-5" />} label="Total Certificates" value={stats?.stats?.total_certificates ?? 0} color="primary" />
          <StatCard icon={<CheckCircle2 className="h-5 w-5" />} label="Public Certificates" value={stats?.stats?.public_certificates ?? 0} color="green" />
          <StatCard icon={<Clock3 className="h-5 w-5" />} label="Private Certificates" value={stats?.stats?.private_certificates ?? 0} color="yellow" />
        </div>

        <Card>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Certificates</h2>
            {(stats?.recent_certificates?.length > 0) && (
              <button
                onClick={() => navigate('/student/certificates')}
                className="text-sm font-medium text-primary-600 hover:text-primary-700 transition"
              >
                View all →
              </button>
            )}
          </div>
          <div className="space-y-3">
            {(stats?.recent_certificates || []).map((certificate) => (
              <div key={certificate.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{certificate.degree_title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Serial: <span className="font-mono">{certificate.serial}</span></p>
                </div>
              </div>
            ))}
            {(!stats?.recent_certificates || stats.recent_certificates.length === 0) && (
              <div className="py-8 text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No certificates found yet.</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
