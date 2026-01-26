import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Award, TrendingUp, UserPlus, FileText, List, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setError(null);
      const response = await api.get('/university/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load dashboard data.';
      setError(message);
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

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 p-6">
        <div className="mx-auto max-w-7xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: 'Total Enrolled Students',
      value: dashboardData?.totalStudents || 0,
      icon: Users,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/university/students')
    },
    {
      label: 'Certificates Issued',
      value: dashboardData?.totalCertificates || 0,
      icon: Award,
      color: 'bg-green-50 text-green-600',
      onClick: () => navigate('/university/certificates')
    },
    {
      label: "Today's Certificates",
      value: dashboardData?.todayCertificates || 0,
      icon: TrendingUp,
      color: 'bg-purple-50 text-purple-600',
      onClick: () => navigate('/university/certificates?today=1')
    }
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-6 p-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 py-5 text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome, {dashboardData?.institutionName || user?.name || 'University'}!
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              Manage enrollments, issue certificates, and monitor activities.
            </p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 ${
                stat.onClick ? 'cursor-pointer transition hover:shadow-md hover:ring-primary/30' : ''
              }`}
              onClick={stat.onClick}
              role={stat.onClick ? 'button' : undefined}
              tabIndex={stat.onClick ? 0 : undefined}
              onKeyDown={stat.onClick ? (e) => { if (e.key === 'Enter') stat.onClick(); } : undefined}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{stat.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Quick Actions</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <button
              onClick={() => navigate('/university/enroll-student')}
              className="flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-primary-hover"
            >
              <UserPlus className="h-4 w-4" />
              Enroll New Student
            </button>
            <button
              onClick={() => navigate('/university/issue-certificate')}
              className="flex items-center justify-center gap-2 rounded-lg bg-secondary px-4 py-3 text-sm font-semibold text-white shadow transition hover:bg-secondary-hover"
            >
              <FileText className="h-4 w-4" />
              Issue Certificate
            </button>
            <button
              onClick={() => navigate('/university/students')}
              className="flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-white shadow-sm transition hover:bg-slate-50 dark:hover:bg-gray-600"
            >
              <List className="h-4 w-4" />
              View All Students
            </button>
          </div>
        </div>

        {/* Recent Certificates */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Recently Issued Certificates</h2>
          {dashboardData?.recentCertificates && dashboardData.recentCertificates.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">
                  <tr>
                    <th className="pb-3">Serial</th>
                    <th className="pb-3">Student Name</th>
                    <th className="pb-3">Certificate Name</th>
                    <th className="pb-3">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dashboardData.recentCertificates.map((cert, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                      <td className="py-3 font-mono font-semibold text-primary dark:text-blue-400">{cert.serial}</td>
                      <td className="py-3 text-slate-800 dark:text-gray-200">{cert.studentName}</td>
                      <td className="py-3 text-slate-800 dark:text-gray-200">{cert.certificateName}</td>
                      <td className="py-3 text-slate-600 dark:text-gray-300">{cert.issueDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-gray-700 px-4 py-8 text-center text-sm text-slate-600 dark:text-gray-300">
              No certificates issued yet. Start by enrolling students and issuing certificates.
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
