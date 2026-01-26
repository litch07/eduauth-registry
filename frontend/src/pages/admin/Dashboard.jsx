import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, School, Award, Eye, TrendingUp, Clock, Building, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/dashboard');
      setStats(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch dashboard statistics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (!stats) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20 w-full">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  {error || 'Unable to load dashboard data'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const pendingTotal = stats?.pendingApprovals || 0;

  const statCards = [
    {
      title: 'Total Students',
      value: stats?.totalStudents || 0,
      icon: Users,
      color: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300',
      textColor: 'text-blue-900 dark:text-blue-200',
      clickable: true,
      onClick: () => navigate('/admin/users?role=STUDENT'),
    },
    {
      title: 'Total Universities',
      value: stats?.totalUniversities || 0,
      icon: School,
      color: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300',
      textColor: 'text-green-900 dark:text-green-200',
      clickable: true,
      onClick: () => navigate('/admin/users?role=UNIVERSITY'),
    },
    {
      title: 'Total Verifiers',
      value: stats?.totalVerifiers || 0,
      icon: Building,
      color: (stats?.totalVerifiers || 0) > 0 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300' : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300',
      textColor: (stats?.totalVerifiers || 0) > 0 ? 'text-orange-900 dark:text-orange-200' : 'text-slate-900 dark:text-white',
      clickable: true,
      onClick: () => navigate('/admin/users?role=VERIFIER'),
    },
    {
      title: 'Total Certificates',
      value: stats?.totalCertificates || 0,
      icon: Award,
      color: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300',
      textColor: 'text-purple-900 dark:text-purple-200',
      clickable: true,
      onClick: () => navigate('/admin/certificates'),
    },
    {
      title: "Today's Verifications",
      value: stats?.todayVerifications || 0,
      icon: Eye,
      color: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300',
      textColor: 'text-orange-900 dark:text-orange-200',
      clickable: true,
      onClick: () => navigate('/admin/verifications?today=1'),
    },
    {
      title: "Today's Certificates",
      value: stats?.todayCertificates || 0,
      icon: TrendingUp,
      color: 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-300',
      textColor: 'text-teal-900 dark:text-teal-200',
      clickable: true,
      onClick: () => navigate('/admin/certificates?today=1'),
    },
    {
      title: 'Pending Approvals',
      value: pendingTotal,
      icon: Clock,
      color: pendingTotal > 0 ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300',
      textColor: pendingTotal > 0 ? 'text-red-900 dark:text-red-200' : 'text-slate-900 dark:text-white',
      clickable: true,
      onClick: () => navigate('/admin/pending-approvals'),
    },
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8 px-4 py-10">
        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Header */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 py-5 text-white shadow-lg">
          <h1 className="text-2xl font-bold md:text-3xl">
            Welcome, {user?.name || user?.email || 'Admin'}!
          </h1>
          <p className="mt-1 text-sm text-blue-100">
            System overview and administration controls at a glance.
          </p>
        </div>

        <div className="flex justify-end">
          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Statistics Grid */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            const cardClass = card.clickable ? 'cursor-pointer hover:shadow-lg' : 'hover:shadow-md';
            return (
              <div
                key={index}
                onClick={card.onClick}
                className={`rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 transition ${cardClass}`}
                role={card.clickable ? 'button' : undefined}
                tabIndex={card.clickable ? 0 : undefined}
                onKeyDown={card.clickable ? (e) => { if (e.key === 'Enter') card.onClick(); } : undefined}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600 dark:text-gray-300">{card.title}</p>
                    <p className={`mt-2 text-3xl font-bold ${card.textColor}`}>
                      {card.value.toLocaleString()}
                    </p>
                  </div>
                  <div className={`rounded-lg p-3 ${card.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Quick Links */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Quick Navigation</h2>
          <div className="grid gap-3 md:grid-cols-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="rounded-lg bg-primary px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-primary-hover transition text-left"
            >
              <p className="font-semibold">View All Users</p>
              <p className="text-xs text-primary-light mt-1">Manage students and universities</p>
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="rounded-lg bg-secondary px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-secondary-hover transition text-left"
            >
              <p className="font-semibold">Verification Analytics</p>
              <p className="text-xs text-secondary-light mt-1">View verification trends</p>
            </button>
            <button
              onClick={() => navigate('/admin/logs')}
              className="rounded-lg bg-slate-700 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-slate-800 transition text-left"
            >
              <p className="font-semibold">Activity Logs</p>
              <p className="text-xs text-slate-300 mt-1">View system audit trail</p>
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="rounded-xl bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 p-6">
          <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100">System Information</h3>
          <p className="mt-2 text-sm text-blue-800 dark:text-blue-200">
            Dashboard automatically refreshes data on load. Use the Refresh button to manually update statistics.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
