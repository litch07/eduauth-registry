import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      setMessage(response.data.message || 'Password reset successfully.');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Reset Password</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
          Enter a new password for your account.
        </p>

        {message && (
          <div className="mt-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-200 flex items-start gap-2">
            <CheckCircle className="h-4 w-4 mt-0.5" />
            <span>{message}</span>
          </div>
        )}

        {error && (
          <div className="mt-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Lock className="mr-2 h-4 w-4 text-slate-400 dark:text-gray-400" />
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full py-2 text-sm text-slate-800 dark:text-white dark:bg-gray-700 placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none"
              placeholder="New password"
            />
          </div>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Lock className="mr-2 h-4 w-4 text-slate-400 dark:text-gray-400" />
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full py-2 text-sm text-slate-800 dark:text-white dark:bg-gray-700 placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none"
              placeholder="Confirm new password"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
