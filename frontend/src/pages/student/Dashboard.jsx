import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCopy, CheckCircle2, Clock3 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Student Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Your certificates at a glance</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Certificates</p>
                <p className="mt-2 text-3xl font-bold">{stats?.stats?.total_certificates ?? 0}</p>
              </div>
              <BookCopy className="h-12 w-12 text-primary-600" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Public Certificates</p>
                <p className="mt-2 text-3xl font-bold">{stats?.stats?.public_certificates ?? 0}</p>
              </div>
              <CheckCircle2 className="h-12 w-12 text-green-600" />
            </div>
          </Card>
          <Card>
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Private Certificates</p>
                <p className="mt-2 text-3xl font-bold">{stats?.stats?.private_certificates ?? 0}</p>
              </div>
              <Clock3 className="h-12 w-12 text-yellow-600" />
            </div>
          </Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Recent Certificates</h2>
          <div className="mt-4 space-y-3">
            {(stats?.recent_certificates || []).map((certificate) => (
              <div key={certificate.id} className="flex flex-col gap-2 rounded-xl border border-gray-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-gray-700">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white">{certificate.degree_title}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Serial {certificate.serial}</p>
                </div>
                <button onClick={() => navigate('/student/certificates')} className="text-sm font-medium text-primary-600 hover:text-primary-700">
                  View all
                </button>
              </div>
            ))}
            {(!stats?.recent_certificates || stats.recent_certificates.length === 0) && (
              <p className="text-sm text-gray-500 dark:text-gray-400">No certificates found yet.</p>
            )}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
