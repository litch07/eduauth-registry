import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Loader2, Eye, EyeOff, XCircle } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import EmailVerificationModal from '../components/EmailVerificationModal';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showVerificationOption, setShowVerificationOption] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setShowVerificationOption(false);
    setUnverifiedEmail('');
    setLoading(true);

    try {
      // Try regular login first; if that fails, attempt admin login as fallback
      let response;
      try {
        response = await api.post('/auth/login', {
          email,
          password
        });
      } catch (regularError) {
        // Always attempt admin login once if regular login fails
        try {
          response = await api.post('/auth/admin/login', { email, password });
        } catch (adminError) {
          // If both fail, surface the admin error (likely most relevant)
          throw adminError;
        }
      }

      const { token, user } = response.data;

      // Save auth data
      login(token, user);

      // Redirect based on role returned from backend
      const roleRoutes = {
        'STUDENT': '/student/dashboard',
        'UNIVERSITY': '/university/dashboard',
        'VERIFIER': '/verifier/dashboard',
        'ADMIN': '/admin/dashboard'
      };

      navigate(roleRoutes[user.role] || '/');
    } catch (err) {
      const errorData = err.response?.data;
      if (errorData?.requiresEmailVerification) {
        setError('Please verify your email first.');
        setShowVerificationOption(true);
        setUnverifiedEmail(errorData.email || email);
      } else if (errorData?.pendingApproval) {
        setError('Your account is pending admin approval. You will be notified via email once approved.');
      } else {
        const message = errorData?.error || 'Invalid email or password. Please try again.';
        setError(message);
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center gap-3">
          <img src="/assets/logo.png" alt="EduAuth Registry" className="h-14 w-14 object-cover rounded-2xl shadow-md ring-1 ring-primary/10" />
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-blue-400">EduAuth Registry</p>
            <p className="text-base font-semibold text-slate-700 dark:text-gray-200">Secure Certificate Verification</p>
          </div>
        </div>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
          <h1 className="mb-1 text-xl font-bold text-slate-900 dark:text-white">Sign In to EduAuth Registry</h1>
          <p className="mb-6 text-sm text-slate-600 dark:text-gray-300">Access your dashboard to manage enrollments and certificates.</p>

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

          {showVerificationOption && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
              <p className="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                Your email is not verified yet.
              </p>
              <button
                onClick={async () => {
                  await api.post('/auth/send-verification-code', { email: unverifiedEmail });
                  setShowVerificationModal(true);
                }}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
                type="button"
              >
                Verify Email Now
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Email</label>
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
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Password</label>
              <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <Lock className="mr-2 h-4 w-4 text-slate-400 dark:text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full py-2 text-sm text-slate-800 dark:text-white dark:bg-gray-700 placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="ml-2 text-slate-500 dark:text-gray-400 hover:text-primary dark:hover:text-blue-400 focus:outline-none"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Lock className="h-4 w-4" />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-gray-300">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-primary dark:text-blue-400 hover:text-primary-hover dark:hover:text-blue-300">
              Register
            </Link>
          </div>

          <div className="mt-3 text-center text-sm text-slate-600 dark:text-gray-300">
            <Link to="/" className="font-semibold text-secondary dark:text-green-400 hover:text-secondary-hover dark:hover:text-green-300">
              ← Back to Home
            </Link>
          </div>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={unverifiedEmail}
        onVerified={() => {
          setShowVerificationModal(false);
          setShowVerificationOption(false);
          alert('Email verified! Your account is pending admin approval.');
        }}
      />
    </div>
  );
};

export default Login;
