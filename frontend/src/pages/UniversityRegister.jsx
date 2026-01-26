import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Loader2, ArrowLeft, XCircle } from 'lucide-react';
import api from '../services/api';
import EmailVerificationModal from '../components/EmailVerificationModal';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const UniversityRegister = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState('');
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    registrationNumber: '',
    establishedYear: '',
    phone: '',
    address: '',
    website: '',
    email: '',
    password: '',
    confirmPassword: '',
    authorityName: '',
    authorityTitle: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.name || !formData.registrationNumber || !formData.establishedYear || 
        !formData.phone || !formData.address || !formData.email || !formData.password || 
        !formData.confirmPassword || !formData.authorityName || !formData.authorityTitle) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address.');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }

    const currentYear = new Date().getFullYear();
    if (formData.establishedYear < 1800 || formData.establishedYear > currentYear) {
      setError(`Established year must be between 1800 and ${currentYear}.`);
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess('');

    if (!validateForm()) return;

    setLoading(true);
    try {
      await api.post('/auth/register/university', formData);
      setRegisteredEmail(formData.email);
      setShowVerificationModal(true);
      setRegistrationSuccess(false);
      setSuccess('Registration successful! Check your email for the verification code.');
      await api.post('/auth/send-verification-code', { email: formData.email });
    } catch (err) {
      const message = err.response?.data?.error || 'Registration failed. Please try again.';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = 'w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15';
  const labelClass = 'text-sm font-semibold text-slate-700 dark:text-gray-200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-10 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="mb-6 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-green-500 to-green-600 shadow-lg">
              <Building className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">University Registration</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Register your institution</p>
        </div>

        {/* Registration Form */}
        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
          {success && (
            <div className="mb-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-200">
              {success}
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Institution Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Institution Information</h3>
              
              <div>
                <label className={labelClass}>University Name *</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={inputClass}
                  required
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Registration Number *</label>
                  <input
                    type="text"
                    name="registrationNumber"
                    value={formData.registrationNumber}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Established Year *</label>
                  <input
                    type="number"
                    name="establishedYear"
                    value={formData.establishedYear}
                    onChange={handleChange}
                    className={inputClass}
                    min="1800"
                    max={new Date().getFullYear()}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Address *</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  className={inputClass}
                  rows="2"
                  required
                />
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Contact Information</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Official Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Website (Optional)</label>
                <input
                  type="url"
                  name="website"
                  value={formData.website}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="https://example.edu.bd"
                />
              </div>
            </div>

            {/* Authority Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Authorized Representative</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Authority Name *</label>
                  <input
                    type="text"
                    name="authorityName"
                    value={formData.authorityName}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
                <div>
                  <label className={labelClass}>Authority Title *</label>
                  <input
                    type="text"
                    name="authorityTitle"
                    value={formData.authorityTitle}
                    onChange={handleChange}
                    className={inputClass}
                    placeholder="e.g., Registrar, Vice-Chancellor"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Account Security */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white uppercase tracking-wide">Account Security</h3>
              
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={inputClass}
                    minLength="8"
                    required
                  />
                  <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">Minimum 8 characters</p>
                </div>
                <div>
                  <label className={labelClass}>Confirm Password *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                'Create University Account'
              )}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-slate-600 dark:text-gray-300">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
              Sign In
            </Link>
          </div>

          {registrationSuccess && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mt-4">
              <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                Email Verified Successfully!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-300">
                Your account is now pending admin approval. You will receive an email notification once your account is approved.
              </p>
              <button
                onClick={() => navigate('/login')}
                className="mt-3 text-blue-600 hover:underline text-sm font-medium"
                type="button"
              >
                Go to Login -&gt;
              </button>
            </div>
          )}
        </div>

        {/* Back Link */}
        <div className="mt-4 text-center">
          <Link 
            to="/register" 
            className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-secondary-hover"
          >
            <ArrowLeft className="h-4 w-4" />
            Choose Different Role
          </Link>
        </div>
      </div>

      <EmailVerificationModal
        isOpen={showVerificationModal}
        onClose={() => setShowVerificationModal(false)}
        email={registeredEmail}
        onVerified={() => {
          setRegistrationSuccess(true);
        }}
      />
    </div>
  );
};

export default UniversityRegister;
