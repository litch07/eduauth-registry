import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, School, Clock, Copy, Eye, EyeOff, CheckCircle, Bell, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import { logError } from '../../services/errorLogger';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  const fetchDashboard = useCallback(async () => {
    try {
      const response = await api.get('/student/dashboard');
      setDashboardData(response.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load dashboard data.';
      setError(message);
      logError('StudentDashboard.fetchDashboard', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleCopySerial = useCallback(async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
      setSuccessMessage(`Serial ${serial} copied to clipboard!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      logError('StudentDashboard.handleCopySerial', err);
    }
  }, []);

  const handleToggleSharing = useCallback(async (certificateId) => {
    try {
      const response = await api.put(`/student/certificates/${certificateId}/toggle-sharing`);
      const newStatus = response.data.isPubliclyShareable;
      
      // Update the certificate in the dashboard data
      setDashboardData((prev) => ({
        ...prev,
        recentCertificates: prev.recentCertificates.map((cert) =>
          cert.id === certificateId
            ? { ...cert, isPubliclyShareable: newStatus }
            : cert
        )
      }));

      setSuccessMessage(
        newStatus
          ? 'Certificate is now publicly shareable'
          : 'Certificate is now private'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to update sharing status.';
      setError(message);
      setTimeout(() => setError(null), 3000);
      logError('StudentDashboard.handleToggleSharing', err);
    }
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center py-20">
          <LoadingSpinner message="Loading dashboard..." />
        </div>
      </DashboardLayout>
    );
  }

  const stats = [
    {
      label: 'Institutions Enrolled',
      value: dashboardData?.totalEnrollments || 0,
      icon: School,
      color: 'bg-blue-50 text-blue-600',
      onClick: () => navigate('/student/enrollments')
    },
    {
      label: 'Certificates Received',
      value: dashboardData?.totalCertificates || 0,
      icon: Award,
      color: 'bg-green-50 text-green-600',
      onClick: () => navigate('/student/certificates')
    },
    {
      label: 'Pending Requests',
      value: dashboardData?.pendingRequestsCount || 0,
      icon: Clock,
      color: 'bg-amber-50 text-amber-600',
      onClick: () => navigate('/student/certificate-requests')
    }
  ];

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 py-5 text-white shadow-lg">
          <div>
            <h1 className="text-2xl font-bold md:text-3xl">
              Welcome, {dashboardData?.studentName || user?.name || 'Student'}!
            </h1>
            <p className="mt-1 text-sm text-blue-100">
              View your certificates, manage sharing settings, and track your academic progress.
            </p>
          </div>
        </div>

        {/* Pending Requests Alert */}
        {dashboardData?.pendingRequestsCount > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/30 px-5 py-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
                <Bell className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-100">
                  You have {dashboardData.pendingRequestsCount} pending certificate access request{dashboardData.pendingRequestsCount > 1 ? 's' : ''}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-200">
                  Review and approve or reject requests from verifiers
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/student/certificate-requests')}
              className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Review Requests
            </button>
          </div>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="flex items-center gap-2 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-200">
            <CheckCircle className="h-4 w-4" />
            {successMessage}
          </div>
        )}

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

        {/* Statistics Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className={`rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 ${stat.onClick ? 'cursor-pointer transition hover:shadow-md hover:ring-primary/30' : ''}`}
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

        {/* Recent Certificates */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">My Certificates</h2>
            <button
              onClick={() => navigate('/student/certificates')}
              className="text-sm font-semibold text-primary transition hover:text-primary-hover"
            >
              View All →
            </button>
          </div>

          {dashboardData?.recentCertificates && dashboardData.recentCertificates.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {dashboardData.recentCertificates.map((cert) => (
                <div
                  key={cert.id}
                  className="rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-4 shadow-sm transition hover:shadow-md"
                >
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Award className="h-5 w-5" />
                    </div>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-semibold ${
                        cert.isPubliclyShareable
                          ? 'bg-green-100 text-green-700'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cert.isPubliclyShareable ? 'Public' : 'Private'}
                    </span>
                  </div>

                  <h3 className="mb-1 font-semibold text-slate-900 dark:text-white line-clamp-2">
                    {cert.certificateName}
                  </h3>
                  <p className="mb-2 text-xs text-slate-600 dark:text-gray-300">{cert.institutionName}</p>

                  <div className="mb-3 flex items-center gap-2 text-xs">
                    <span className="rounded bg-slate-200 px-2 py-1 font-mono font-semibold text-slate-800">
                      {cert.serial}
                    </span>
                    <span className="text-slate-500">{cert.issueDate}</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleCopySerial(cert.serial)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                      title="Copy Serial"
                    >
                      <Copy className="h-3 w-3" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleToggleSharing(cert.id, cert.isPubliclyShareable)}
                      className="btn-secondary flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                      title="Toggle Sharing"
                    >
                      {cert.isPubliclyShareable ? (
                        <>
                          <EyeOff className="h-3 w-3" />
                          Private
                        </>
                      ) : (
                        <>
                          <Eye className="h-3 w-3" />
                          Public
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 dark:bg-gray-700 px-4 py-8 text-center">
              <Award className="mx-auto mb-2 h-12 w-12 text-slate-400 dark:text-gray-500" />
              <p className="text-sm text-slate-600 dark:text-gray-300">
                No certificates yet. Once your institution issues certificates, they will appear here.
              </p>
            </div>
          )}
        </div>
          </div>
    </DashboardLayout>
  );
};

export default Dashboard;
