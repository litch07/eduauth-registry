import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Users, Calendar, FileText, XCircle } from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';

const Profile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/student/profile');
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
      <div>

        {/* Profile Header Card */}
        <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light p-6 text-white shadow-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-white">
              <User className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">
                {profileData?.firstName} {profileData?.middleName && `${profileData?.middleName} `}
                {profileData?.lastName}
              </h2>
              <p className="text-sm text-blue-100">Student Profile</p>
            </div>
          </div>
        </div>

        {/* Profile Information Cards */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Contact Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Email</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Phone</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.phone || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Address</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.presentAddress || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Personal Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Personal Information</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Calendar className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Date of Birth</p>
                  <p className="text-sm text-slate-900 dark:text-white">
                    {profileData?.dateOfBirth
                      ? new Date(profileData.dateOfBirth).toLocaleDateString('en-GB')
                      : 'Not provided'}
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">NID Number</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.nid || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <User className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Student ID</p>
                  <p className="text-sm font-mono text-slate-900 dark:text-white">{profileData?.studentId || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Family Information */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 md:col-span-2">
            <h3 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">Family Information</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Father's Name</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.fatherName || 'Not provided'}</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold text-slate-600 dark:text-gray-300">Mother's Name</p>
                  <p className="text-sm text-slate-900 dark:text-white">{profileData?.motherName || 'Not provided'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
