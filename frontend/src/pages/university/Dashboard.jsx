import { useEffect, useState } from 'react';
import { FilePlus2, School, ShieldCheck, AlertTriangle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';

export default function UniversityDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">University Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Institution overview</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Total Certificates</p><p className="mt-2 text-3xl font-bold">{stats?.stats?.total_certificates ?? 0}</p></div><School className="h-12 w-12 text-primary-600" /></div></Card>
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Active Certificates</p><p className="mt-2 text-3xl font-bold">{stats?.stats?.active_certificates ?? 0}</p></div><ShieldCheck className="h-12 w-12 text-green-600" /></div></Card>
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Revoked Certificates</p><p className="mt-2 text-3xl font-bold">{stats?.stats?.revoked_certificates ?? 0}</p></div><AlertTriangle className="h-12 w-12 text-yellow-600" /></div></Card>
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Issue a new certificate</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Generate and assign a certificate for an enrolled student.</p>
            </div>
            <button onClick={() => navigate('/university/issue-certificate')} className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-4 py-2 font-medium text-white hover:bg-primary-700">
              <FilePlus2 className="h-4 w-4" />
              Issue
            </button>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
}
