import React, { useEffect, useState } from 'react';
import { Save, Lock, Mail, CheckCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';

const Profile = () => {
  const { updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({});
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [emailChange, setEmailChange] = useState({
    newEmail: '',
    code: ''
  });

  const [saving, setSaving] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/profile');
        const data = response.data.profile;
        setProfile(data);
        setFormData({
          firstName: data.firstName || '',
          middleName: data.middleName || '',
          lastName: data.lastName || '',
          phone: data.phone || '',
          address: data.address || '',
          name: data.name || '',
          website: data.website || '',
          authorityName: data.authorityName || '',
          authorityTitle: data.authorityTitle || '',
          companyName: data.companyName || '',
          contactPhone: data.contactPhone || ''
        });
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load profile.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess('');

    try {
      await api.put('/profile', formData);
      setSuccess('Profile updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile.');
      console.error('Error:', err);
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    setPasswordLoading(true);
    try {
      await api.post('/profile/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setSuccess('Password changed successfully.');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to change password.');
      console.error('Error:', err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleRequestEmailChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setEmailLoading(true);

    try {
      await api.post('/profile/request-email-change', { newEmail: emailChange.newEmail });
      setSuccess('Verification code sent to the new email address.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request email change.');
      console.error('Error:', err);
    } finally {
      setEmailLoading(false);
    }
  };

  const handleVerifyEmailChange = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');
    setCodeLoading(true);

    try {
      const response = await api.post('/profile/verify-email-change', { code: emailChange.code });
      const newEmail = response.data.newEmail;
      setProfile((prev) => ({ ...prev, email: newEmail }));
      updateUser({ email: newEmail });
      setEmailChange({ newEmail: '', code: '' });
      setSuccess('Email updated successfully.');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to verify email change.');
      console.error('Error:', err);
    } finally {
      setCodeLoading(false);
    }
  };

  const inputClass =
    'w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="py-16">
          <LoadingSpinner message="Loading profile..." />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Profile</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300">Manage your personal information and security.</p>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {success && (
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <div className="flex items-start">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-green-900 dark:text-green-100">Success</div>
                <div className="text-sm text-green-700 dark:text-green-300">{success}</div>
              </div>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Profile Details</h2>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Email</label>
                <input className={inputClass} value={profile?.email || ''} readOnly />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Role</label>
                <input className={inputClass} value={profile?.role || ''} readOnly />
              </div>
            </div>

            {profile?.role === 'STUDENT' && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">First Name</label>
                    <input name="firstName" value={formData.firstName} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Middle Name</label>
                    <input name="middleName" value={formData.middleName} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Last Name</label>
                    <input name="lastName" value={formData.lastName} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">NID</label>
                    <input className={inputClass} value={profile?.nid || ''} readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Date of Birth</label>
                    <input className={inputClass} value={profile?.dateOfBirth || ''} readOnly />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Student ID</label>
                    <input className={inputClass} value={profile?.studentId || ''} readOnly />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Address</label>
                    <input name="address" value={formData.address} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
              </>
            )}

            {profile?.role === 'UNIVERSITY' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Institution Name</label>
                    <input name="name" value={formData.name} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Registration Number</label>
                    <input className={inputClass} value={profile?.registrationNumber || ''} readOnly />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Phone</label>
                    <input name="phone" value={formData.phone} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Website</label>
                    <input name="website" value={formData.website} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Address</label>
                  <input name="address" value={formData.address} onChange={handleInputChange} className={inputClass} />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Authority Name</label>
                    <input name="authorityName" value={formData.authorityName} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Authority Title</label>
                    <input name="authorityTitle" value={formData.authorityTitle} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
              </>
            )}

            {profile?.role === 'VERIFIER' && (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Company Name</label>
                    <input name="companyName" value={formData.companyName} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Contact Phone</label>
                    <input name="contactPhone" value={formData.contactPhone} onChange={handleInputChange} className={inputClass} />
                  </div>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Website</label>
                    <input name="website" value={formData.website} onChange={handleInputChange} className={inputClass} />
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Purpose</label>
                    <input className={inputClass} value={profile?.purpose || ''} readOnly />
                  </div>
                </div>
              </>
            )}

            {profile?.role === 'ADMIN' && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Name</label>
                  <input name="name" value={formData.name} onChange={handleInputChange} className={inputClass} />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {profile?.role !== 'ADMIN' && (
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Email Change</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <form onSubmit={handleRequestEmailChange} className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">New Email</label>
                <input
                  type="email"
                  value={emailChange.newEmail}
                  onChange={(e) => setEmailChange((prev) => ({ ...prev, newEmail: e.target.value }))}
                  className={inputClass}
                  placeholder="new@email.com"
                />
                <button
                  type="submit"
                  disabled={emailLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <Mail className="h-4 w-4" />
                  {emailLoading ? 'Sending...' : 'Send Verification Code'}
                </button>
              </form>

              <form onSubmit={handleVerifyEmailChange} className="space-y-3">
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Verification Code</label>
                <input
                  type="text"
                  maxLength={6}
                  value={emailChange.code}
                  onChange={(e) => setEmailChange((prev) => ({ ...prev, code: e.target.value.replace(/\D/g, '') }))}
                  className={inputClass}
                  placeholder="6-digit code"
                />
                <button
                  type="submit"
                  disabled={codeLoading}
                  className="btn-secondary flex items-center gap-2"
                >
                  <CheckCircle className="h-4 w-4" />
                  {codeLoading ? 'Verifying...' : 'Verify Code'}
                </button>
              </form>
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Change Password</h2>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Current Password</label>
                <input
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">New Password</label>
                <input
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) => setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                  className={inputClass}
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="btn-primary flex items-center gap-2"
                >
                  <Lock className="h-4 w-4" />
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Profile;
