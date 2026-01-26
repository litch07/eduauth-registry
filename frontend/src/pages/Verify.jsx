import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, AlertCircle, Lock, Mail, Info, User, LogIn, UserPlus } from 'lucide-react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import DarkModeToggle from '../components/DarkModeToggle';
import VerificationForm from '../components/VerificationForm';

const Verify = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [prefill, setPrefill] = useState(() => ({
    serial: searchParams.get('serial') || '',
    dob: searchParams.get('dob') || ''
  }));
  const [formKey, setFormKey] = useState(0);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [requestModal, setRequestModal] = useState({ open: false, purpose: '', reason: '' });
  const [requestLoading, setRequestLoading] = useState(false);

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT':
        return '/student/dashboard';
      case 'UNIVERSITY':
        return '/university/dashboard';
      case 'VERIFIER':
        return '/verifier/dashboard';
      case 'ADMIN':
        return '/admin/dashboard';
      default:
        return '/';
    }
  };

  const handleVerify = async ({ serial, dateOfBirth }) => {
    setError(null);
    setResult(null);
    setLoading(true);

    try {
      const response = await api.post('/verify/certificate', {
        serial,
        dateOfBirth
      });
      setResult(response.data);

      if (user?.role === 'VERIFIER' && response.data?.verified && response.data?.certificate?.id) {
        try {
          await api.post('/verifier/save-verification', { 
            certificateId: response.data.certificate.id,
            serial: response.data.certificate.serial
          });
        } catch (saveError) {
          console.error('Failed to save verification history:', saveError);
        }
      }
    } catch (err) {
      if (err.response?.status === 404 && err.response?.data) {
        setResult({ verified: false, message: err.response.data.message || 'Certificate not found or details do not match.' });
      } else {
        const message = err.response?.data?.error || 'Verification failed. Please try again.';
        setError(message);
      }
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setError(null);
    setPrefill({ serial: '', dob: '' });
    setFormKey((key) => key + 1);
  };

  const openRequestModal = () => {
    setRequestModal({ open: true, purpose: '', reason: '' });
  };

  const closeRequestModal = () => {
    setRequestModal({ open: false, purpose: '', reason: '' });
  };

  const submitAccessRequest = async () => {
    if (!requestModal.purpose) {
      setError('Please select a purpose.');
      return;
    }
    if (!requestModal.reason || requestModal.reason.trim().length < 20) {
      setError('Reason must be at least 20 characters.');
      return;
    }

    setRequestLoading(true);
    try {
      await api.post('/verifier/request-single-certificate', {
        serial: result?.serial,
        purpose: requestModal.purpose,
        reason: requestModal.reason.trim()
      });
      setError(null);
      closeRequestModal();
      navigate('/verifier/requests');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send request');
      console.error('Error:', err);
    } finally {
      setRequestLoading(false);
    }
  };

  const certificate = result?.certificate;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-10 text-slate-900 dark:text-white">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            onClick={() => navigate('/')}
            className="text-lg font-bold text-slate-900 dark:text-white"
          >
            EduAuth Registry
          </button>
          <div className="flex items-center gap-3">
            <DarkModeToggle />
            {!user ? (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary text-sm"
                >
                  Login
                </button>
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary text-sm"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-gray-300">
                  <User className="h-4 w-4" />
                  <span className="font-semibold">{user.name || user.email}</span>
                  <span className="rounded-full bg-slate-200 dark:bg-gray-700 px-2 py-0.5 text-xs font-semibold text-slate-700 dark:text-gray-200">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => navigate(getDashboardPath())}
                  className="btn-primary text-sm"
                >
                  Dashboard
                </button>
              </>
            )}
          </div>
        </div>

        {(!user || user.role !== 'VERIFIER') && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-1">
                  Anyone can verify certificates. No account needed.
                </h3>
                <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                  Instantly verify university certificates using serial number and date of birth.
                </p>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-blue-700 dark:text-blue-300">Want more features?</span>
                  <a
                    href="/login"
                    className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline"
                  >
                    <LogIn className="w-4 h-4" />
                    Login
                  </a>
                  <span className="text-blue-600 dark:text-blue-400">or</span>
                  <a
                    href="/register/verifier"
                    className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200 underline"
                  >
                    <UserPlus className="w-4 h-4" />
                    Register as verifier
                  </a>
                  <span className="text-blue-700 dark:text-blue-300">to:</span>
                </div>
                <ul className="mt-2 text-sm text-blue-700 dark:text-blue-300 space-y-1">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Save verification history automatically
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Request access to private certificates
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                    Track all your verification activities
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white md:text-4xl">Verify University Certificate</h1>
          <p className="mt-2 text-slate-600 dark:text-gray-300">Enter the certificate serial and date of birth to verify instantly.</p>
        </header>

        <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
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
          <VerificationForm
            key={formKey}
            onSubmit={handleVerify}
            initialSerial={prefill.serial}
            initialDob={prefill.dob}
            submitLabel="Verify Certificate"
            loading={loading}
          />
        </div>

        {result && result.verified && certificate && (
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-green-100 dark:ring-green-900">
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide">CERTIFICATE VERIFIED</p>
                  <p className="text-xs text-emerald-100">Verified via serial and date of birth</p>
                </div>
              </div>
            </div>
            <div className="grid gap-6 p-6 md:grid-cols-2">
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Certificate Details</h3>
                <div className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                  <p><span className="font-semibold">Serial:</span> {certificate.serial}</p>
                  <p><span className="font-semibold">Certificate:</span> {certificate.certificateName}</p>
                  <p><span className="font-semibold">Level:</span> {certificate.certificateLevel}</p>
                  <p><span className="font-semibold">Department:</span> {certificate.department || 'N/A'}</p>
                  <p><span className="font-semibold">Major:</span> {certificate.major || 'N/A'}</p>
                  <p><span className="font-semibold">Session:</span> {certificate.session || 'N/A'}</p>
                  <p><span className="font-semibold">Roll Number:</span> {certificate.rollNumber || 'N/A'}</p>
                  <p><span className="font-semibold">CGPA:</span> {certificate.cgpa ?? 'N/A'}</p>
                  <p><span className="font-semibold">Degree Class:</span> {certificate.degreeClass || 'N/A'}</p>
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Student and Institution</h3>
                <div className="space-y-2 text-sm text-slate-700 dark:text-gray-300">
                  <p><span className="font-semibold">Student:</span> {certificate.studentName}</p>
                  <p><span className="font-semibold">Date of Birth:</span> {certificate.studentDOB}</p>
                  <p><span className="font-semibold">Institution:</span> {certificate.institutionName || 'N/A'}</p>
                  <p><span className="font-semibold">Issue Date:</span> {certificate.issueDate}</p>
                  <p><span className="font-semibold">Convocation:</span> {certificate.convocationDate || 'N/A'}</p>
                  <p><span className="font-semibold">Authority:</span> {certificate.authorityName}</p>
                  <p><span className="font-semibold">Title:</span> {certificate.authorityTitle}</p>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-3 border-t border-slate-100 dark:border-gray-700 bg-slate-50 dark:bg-gray-900/40 px-6 py-4 md:flex-row md:justify-end">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-white transition hover:bg-slate-100 dark:hover:bg-gray-700"
              >
                Print Verification
              </button>
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Verify Another
              </button>
            </div>
          </div>
        )}

        {result && result.verified === false && (
          <div className="overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-xl ring-1 ring-red-100 dark:ring-red-900">
            <div className="bg-gradient-to-r from-red-500 to-rose-600 px-6 py-5 text-white">
              <div className="flex items-center gap-3">
                <div className="rounded-full bg-white/15 p-2">
                  <XCircle className="h-8 w-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide">CERTIFICATE NOT FOUND</p>
                  <p className="text-xs text-rose-100">Details did not match our records</p>
                </div>
              </div>
            </div>
            <div className="space-y-4 p-6 text-slate-800 dark:text-gray-200">
              <p className="text-sm">{result.message || 'Certificate not found or verification details do not match.'}</p>
              {result.isPrivate && result.certificateExists && (
                <div className="space-y-4 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 px-4 py-3">
                  <div className="flex items-center gap-2 text-blue-900 dark:text-blue-100">
                    <Lock className="h-4 w-4" />
                    <span className="font-semibold">Certificate Access Restricted</span>
                  </div>
                  <p className="text-sm text-blue-800 dark:text-blue-200">This certificate requires student approval to view.</p>
                  {user?.role === 'VERIFIER' ? (
                    <button
                      onClick={openRequestModal}
                      className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                    >
                      <Mail className="h-4 w-4" /> Request Access
                    </button>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-sm text-blue-800 dark:text-blue-200">Please login as a verifier to request access</p>
                      <button
                        onClick={() => navigate('/login')}
                        className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
                      >
                        Login as Verifier
                      </button>
                    </div>
                  )}
                </div>
              )}
              {!result.isPrivate && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-800 dark:text-amber-200">
                  <div className="mb-1 flex items-center gap-2 font-semibold">
                    <AlertCircle className="h-4 w-4" /> Possible reasons
                  </div>
                  <ul className="list-disc space-y-1 pl-5">
                    <li>Serial entered incorrectly</li>
                    <li>Date of birth does not match</li>
                    <li>Certificate not issued yet</li>
                    <li>Student disabled public sharing</li>
                  </ul>
                </div>
              )}
              <button
                onClick={handleReset}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-hover"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>

      {requestModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-lg bg-white dark:bg-gray-800 p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Request Access to Certificate</h2>
              <button
                onClick={closeRequestModal}
                className="rounded p-1 hover:bg-slate-100 dark:hover:bg-gray-700"
              >
                x
              </button>
            </div>

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

            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-gray-200">Serial</p>
                <p className="mt-1 rounded-lg bg-slate-100 dark:bg-gray-700 px-3 py-2 font-mono text-sm text-slate-800 dark:text-white">{result?.serial}</p>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Purpose</label>
                <select
                  value={requestModal.purpose}
                  onChange={(e) => setRequestModal((m) => ({ ...m, purpose: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="">Select a purpose</option>
                  <option value="Employment">Employment</option>
                  <option value="Admission">Admission</option>
                  <option value="Background Check">Background Check</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Reason (min 20 chars)</label>
                <textarea
                  value={requestModal.reason}
                  onChange={(e) => setRequestModal((m) => ({ ...m, reason: e.target.value }))}
                  className="mt-1 h-24 w-full rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Explain why you need this certificate..."
                />
                <p className="mt-1 text-xs text-slate-500 dark:text-gray-400">{requestModal.reason.length} / 500</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={closeRequestModal}
                  className="flex-1 rounded-lg border border-slate-300 dark:border-gray-600 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700"
                >
                  Cancel
                </button>
                <button
                  onClick={submitAccessRequest}
                  disabled={requestLoading}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-70"
                >
                  {requestLoading ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Verify;
