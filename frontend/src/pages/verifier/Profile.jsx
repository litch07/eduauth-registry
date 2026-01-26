import React, { useState, useEffect } from 'react';
import { Building2, Mail, Phone, Globe, FileText, XCircle, CheckCircle, Clock } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const VerifierProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/verifier/profile');
      setProfile(response.data);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load profile data.';
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
      <DashboardLayout>
        <div>
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
      <div className="space-y-6">
        {/* Profile Header Card */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
              <Building2 className="h-8 w-8" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{profileData?.companyName || 'Verifier'}</h2>
              <p className="text-sm text-blue-100">Certificate Verifier</p>
            </div>
            {profileData?.isVerified ? (
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold text-sm">Verified</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 bg-white/20 px-4 py-2 rounded-full">
                <Clock className="w-5 h-5" />
                <span className="font-semibold text-sm">Pending</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Email</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Phone</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.contactPhone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Globe className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Website</p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {profileData?.website ? (
                      <a href={profileData.website} target="_blank" rel="noopener noreferrer" className="text-primary dark:text-blue-400 hover:underline">
                        {profileData.website}
                      </a>
                    ) : (
                      'Not provided'
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Company Details</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Registration Number</p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">{profileData?.companyRegistration || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Purpose</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.purpose || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-primary dark:text-blue-400" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Verified At</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.verifiedAt || 'Not verified'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Status */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Account Status</h3>
          <div className="space-y-3">
            {profileData?.isVerified ? (
              <div className="rounded-lg bg-green-50 dark:bg-green-900/30 p-4 border border-green-200 dark:border-green-700">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                  <p className="text-sm font-semibold text-green-900 dark:text-green-100">Account Verified</p>
                </div>
                <p className="text-xs text-green-700 dark:text-green-200 mt-1">
                  Your account has been approved by the administrator. You can now request access to student certificates.
                </p>
              </div>
            ) : (
              <div className="rounded-lg bg-yellow-50 dark:bg-yellow-900/30 p-4 border border-yellow-200 dark:border-yellow-700">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  <p className="text-sm font-semibold text-yellow-900 dark:text-yellow-100">Pending Admin Approval</p>
                </div>
                <p className="text-xs text-yellow-700 dark:text-yellow-200 mt-1">
                  Your account is under review. You will be notified once an administrator approves your account.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default VerifierProfile;
