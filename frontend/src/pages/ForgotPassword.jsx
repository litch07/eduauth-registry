import React, { useState } from 'react';
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import api from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await api.post('/auth/forgot-password', { email });
      setMessage(response.data.message || 'If an account exists, a reset link has been sent.');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to request password reset.');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Forgot Password</h1>
        <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
          Enter your email to receive a reset link.
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
            <Mail className="mr-2 h-4 w-4 text-slate-400 dark:text-gray-400" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full py-2 text-sm text-slate-800 dark:text-white dark:bg-gray-700 placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPassword;
