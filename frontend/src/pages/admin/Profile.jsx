import React, { useEffect, useState } from 'react';
import { User, Mail, Shield, Calendar, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const AdminProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/admin/profile');
        setProfile(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile data.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

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
      <DashboardLayout>
        <div className="mx-auto max-w-4xl p-6">
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
      </DashboardLayout>
    );
  }

  const profileData = profile || user;

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl p-6 space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
              <Shield className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">{profileData?.name || 'Admin User'}</h2>
              <p className="text-sm text-blue-100">System Administrator</p>
            </div>
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Account Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Account Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Email</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">User ID</p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">{profileData?.id || user?.id || 'N/A'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Role</p>
                  <p className="text-sm text-slate-900 dark:text-white">{user?.role || 'ADMIN'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* System Access */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">System Access</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Account Created</p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {profileData?.createdAt || 'N/A'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Shield className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Permissions</p>
                  <p className="text-sm text-slate-900 dark:text-white">Full System Access</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Capabilities */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Administrator Capabilities</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">✓ Manage Users</p>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">View and manage all system users</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">✓ Verification Analytics</p>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">Access system-wide verification data</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">✓ Activity Logs</p>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">Monitor all system activities</p>
            </div>
            <div className="rounded-lg bg-blue-50 dark:bg-blue-900/30 p-4 border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">✓ Approve Verifiers</p>
              <p className="text-xs text-blue-700 dark:text-blue-200 mt-1">Review and approve verifier registrations</p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminProfile;
