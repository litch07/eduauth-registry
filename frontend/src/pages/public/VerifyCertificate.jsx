import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Search, CheckCircle, XCircle, AlertCircle, Copy, Loader2, ShieldCheck, Link2 } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import PublicNavbar from '../../components/layout/PublicNavbar';
import api from '../../services/api';

const TABS = [
  { id: 'manual', label: 'Enter Details', icon: Search },
  { id: 'link', label: 'Paste Link', icon: Link2 },
];

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('manual');
  const [linkInput, setLinkInput] = useState('');
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const hasAutoVerified = useRef(false);

  useEffect(() => {
    // Prevent double-execution in React StrictMode
    if (hasAutoVerified.current) return;

    const serial = searchParams.get('s');
    const token = searchParams.get('v');

    if (serial && token) {
      // Encrypted share link — auto-verify
      hasAutoVerified.current = true;
      autoVerifyFromLink(serial, token);
    } else {
      // Legacy link format — pre-fill serial only
      const legacySerial = searchParams.get('serial');
      if (legacySerial) {
        setFormData((current) => ({ ...current, serial: legacySerial.toUpperCase() }));
      }
    }
  }, [searchParams]);

  const autoVerifyFromLink = async (serial, token) => {
    setAutoVerifying(true);
    setError('');
    setResult(null);

    try {
      const { data } = await api.get('/verify-link', {
        params: { s: serial, v: token },
      });
      setResult(data);
    } catch (requestError) {
      const errorData = requestError.response?.data;

      if (requestError.response?.status === 422) {
        setError('Invalid verification link. Please check the URL and try again.');
      } else if (requestError.response?.status === 400) {
        setError('This verification link is invalid or has expired.');
      } else if (requestError.response?.status === 404) {
        setError('Certificate not found. The link may be outdated.');
      } else if (requestError.response?.status === 401) {
        setError('Verification failed. The link data does not match our records.');
      } else if (requestError.response?.status === 403) {
        setError('This certificate is private and cannot be verified.');
      } else {
        setError(errorData?.message || errorData?.error || 'Verification failed. Please try again.');
      }
    } finally {
      setAutoVerifying(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setValidationErrors({});
    setLoading(true);

    try {
      const { data } = await api.post('/verify/certificate', formData);
      setResult(data);
    } catch (requestError) {
      const errorData = requestError.response?.data;
      
      if (requestError.response?.status === 422) {
        setValidationErrors(errorData.errors || {});
        setError('Please check your input and try again');
      } else if (requestError.response?.status === 404) {
        setError('Certificate not found. Please check the serial number and try again.');
      } else if (requestError.response?.status === 401) {
        setError('Date of birth does not match our records. Please try again.');
      } else if (requestError.response?.status === 403) {
        setError('This certificate is private and cannot be verified. The student has restricted access to this certificate.');
      } else if (requestError.response?.status === 409) {
        setError('This certificate has been revoked and is no longer valid.');
      } else {
        setError(errorData?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasteLinkVerify = async () => {
    if (!linkInput.trim()) { setError('Please paste a verification link.'); return; }
    try {
      const url = new URL(linkInput.trim());
      const s = url.searchParams.get('s');
      const v = url.searchParams.get('v');
      if (s && v) {
        await autoVerifyFromLink(s, v);
      } else {
        setError('Invalid share link format. Make sure you copied the full link.');
      }
    } catch {
      setError('Invalid URL. Please paste a valid certificate verification link.');
    }
  };

  const handleReset = () => {
    setFormData({ serial: '', date_of_birth: '' });
    setLinkInput('');
    setResult(null);
    setError('');
    setValidationErrors({});
    hasAutoVerified.current = false;
  };

  const getVerificationUrl = (serial) => `${window.location.origin}/verify?serial=${encodeURIComponent(serial)}`;

  const handleCopyLink = async (serial) => {
    try {
      await navigator.clipboard.writeText(getVerificationUrl(serial));
    } catch (err) {
      console.error('Failed to copy verification link:', err);
    }
  };

  const updateField = (field) => (event) => {
    const value = field === 'serial' ? event.target.value.toUpperCase() : event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors((current) => {
        const updated = { ...current };
        delete updated[field];
        return updated;
      });
    }
  };

  // Auto-verification loading state
  if (autoVerifying) {
    return (
      <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_40%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
        <PublicNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <Card className="max-w-md w-full text-center space-y-6 py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/40">
              <ShieldCheck className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Verifying Certificate</h2>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Please wait while we verify this certificate...
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-primary-600 mx-auto" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_40%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <PublicNavbar />
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Form Card */}
          <Card className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Public Verification</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Verify Certificate
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter the serial number and student's date of birth to check authenticity.
              </p>
            </div>

            <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setError(''); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === id
                      ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-white'
                      : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {error && !result && (
              <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-start">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
              </div>
            )}

            {tab === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  label="Serial Number"
                  placeholder="e.g., BSC-25-000001M"
                  value={formData.serial}
                  onChange={updateField('serial')}
                  error={validationErrors.serial?.[0]}
                  required
                />

                <Input
                  type="date"
                  label="Date of Birth"
                  value={formData.date_of_birth}
                  onChange={updateField('date_of_birth')}
                  error={validationErrors.date_of_birth?.[0]}
                  required
                />

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center"
                >
                  <Search className="w-5 h-5 mr-2" />
                  {loading ? 'Verifying...' : 'Verify Certificate'}
                </Button>
              </form>
            )}

            {tab === 'link' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                    Certificate Share Link
                  </label>
                  <textarea
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste the share link here (e.g., https://eduauth.app/verify?s=BSC-26-...&v=...)"
                    rows={3}
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 resize-none"
                  />
                </div>
                <Button onClick={handlePasteLinkVerify} className="w-full" disabled={autoVerifying}>
                  {autoVerifying ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                  ) : (
                    <><Link2 className="mr-2 h-4 w-4" />Verify from Link</>
                  )}
                </Button>
              </div>
            )}
          </Card>

          {/* Result Card */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Result</h2>

            {!result ? (
              <div className="space-y-3 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <AlertCircle className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Results will appear here after verification
                </p>
              </div>
            ) : result.verified ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <Badge variant="success">Certificate Valid</Badge>
                </div>

                <div className="space-y-0.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <DetailRow label="Serial Number" value={result.certificate.serial} />
                  <DetailRow label="Student Name" value={result.certificate.student_name} />
                  <DetailRow label="Student ID" value={result.certificate.student_id} />
                  <Divider />
                  <DetailRow label="Degree Title" value={result.certificate.degree_title} />
                  <DetailRow label="Program" value={result.certificate.program_name} />
                  <DetailRow label="Major" value={result.certificate.major || 'N/A'} />
                  <Divider />
                  <DetailRow label="CGPA" value={result.certificate.cgpa || 'N/A'} />
                  <DetailRow label="Registration No" value={result.certificate.registration_no || 'N/A'} />
                  <Divider />
                  <DetailRow label="Issue Date" value={result.certificate.issue_date} />
                  <DetailRow label="Completion Date" value={result.certificate.completion_date || 'N/A'} />
                  <Divider />
                  <DetailRow label="Institution" value={result.certificate.institution} />
                  <DetailRow label="Issued By" value={result.certificate.issued_by} />
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    This confirms the certificate exists in our system. For official verification, contact the issuing institution.
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-900/60">
                  <div className="flex flex-col items-center text-center">
                    <div className="rounded-2xl border border-gray-200 bg-white p-3 shadow-lg dark:border-gray-700">
                      <QRCodeSVG
                        value={getVerificationUrl(result.certificate.serial)}
                        size={180}
                        level="H"
                        includeMargin={true}
                        fgColor="#0f172a"
                        bgColor="#ffffff"
                      />
                    </div>
                    <p className="mt-3 text-sm font-semibold text-gray-900 dark:text-white">Scan to verify</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      Opens the public verification page for this certificate.
                    </p>
                    <button
                      type="button"
                      onClick={() => handleCopyLink(result.certificate.serial)}
                      className="mt-4 inline-flex items-center rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-primary-700"
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Copy Verification Link
                    </button>
                  </div>
                </div>

                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Verify Another Certificate
                </Button>
              </div>
            ) : result.status === 'revoked' ? (
              <div className="space-y-4 py-6 text-center">
                <AlertCircle className="w-12 h-12 text-amber-600 mx-auto" />
                <div>
                  <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Certificate Revoked</p>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                    This certificate was revoked on {result.revoked_at}.
                  </p>
                  {result.revocation_reason && (
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Reason: {result.revocation_reason}
                    </p>
                  )}
                </div>
                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Verify Another Certificate
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-8 text-center">
                <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Verification Failed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {result.message || error || 'Unable to verify this certificate'}
                </p>
                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value || 'N/A'}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-200 dark:border-gray-700 my-1" />;
}
