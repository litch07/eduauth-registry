import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { Search, CheckCircle, XCircle, AlertCircle, Copy, Loader2, ShieldCheck, Link2, Printer, Download } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import PublicNavbar from '../../components/layout/PublicNavbar';
import api from '../../services/api';
import { printVerificationReport, downloadVerificationPDF } from '../../utils/printVerification';
import Footer from '../../components/layout/Footer';

const TABS = [
  { id: 'manual', label: 'Enter Details', icon: Search },
  { id: 'link', label: 'Paste Link', icon: Link2 },
];

export default function VerifyCertificate() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
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
      // Legacy link format or internal navigation
      const legacySerial = searchParams.get('serial');
      const dobState = location.state?.dob;
      const dobParam = searchParams.get('dob');
      const dob = dobState || dobParam;

      if (legacySerial || dob) {
        setFormData((current) => ({ 
          ...current, 
          ...(legacySerial && { serial: legacySerial.toUpperCase() }),
          ...(dob && { date_of_birth: dob })
        }));

        if (location.state?.autoVerify && legacySerial && dob) {
          hasAutoVerified.current = true;
          autoVerifyManual(legacySerial, dob);
        }
      }
    }
  }, [searchParams, location.state]);

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
        setResult({ verified: false, message: 'Invalid verification link. Please check the URL and try again.' });
      } else if (requestError.response?.status === 400) {
        setResult({ verified: false, message: 'This verification link is invalid or has expired.' });
      } else if (requestError.response?.status === 404) {
        setResult({ verified: false, message: 'Certificate not found. The link may be outdated.' });
      } else if (requestError.response?.status === 401) {
        setResult({ verified: false, message: 'Verification failed. The link data does not match our records.' });
      } else if (requestError.response?.status === 403) {
        setResult({ verified: false, message: 'This certificate is private and cannot be verified.' });
      } else {
        setResult({ verified: false, message: errorData?.message || errorData?.error || 'Verification failed. Please try again.' });
      }
    } finally {
      setAutoVerifying(false);
    }
  };

  const autoVerifyManual = async (serial, dob) => {
    setError('');
    setResult(null);
    setValidationErrors({});
    setLoading(true);

    try {
      const { data } = await api.post('/verify/certificate', { serial, date_of_birth: dob });
      setResult(data);
    } catch (requestError) {
      const errorData = requestError.response?.data;
      
      if (requestError.response?.status === 422) {
        const errs = errorData.errors || {};
        const msg = Object.values(errs).flat().join(' ');
        setValidationErrors(errs);
        setResult({ verified: false, message: `Format issues: ${msg}` });
      } else if (requestError.response?.status === 404) {
        setResult({ verified: false, message: 'Certificate not found. Please check the serial number and try again.' });
      } else if (requestError.response?.status === 401) {
        setResult({ verified: false, message: 'Date of birth does not match our records. Please try again.' });
      } else if (requestError.response?.status === 403) {
        setResult({ verified: false, message: 'This certificate is private and cannot be verified. The student has restricted access to this certificate.' });
      } else if (requestError.response?.status === 409) {
        setResult({ verified: false, message: 'This certificate has been revoked and is no longer valid.' });
      } else {
        setResult({ verified: false, message: errorData?.message || 'Verification failed. Please try again.' });
      }
    } finally {
      setLoading(false);
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
        const errs = errorData.errors || {};
        const msg = Object.values(errs).flat().join(' ');
        setValidationErrors(errs);
        setResult({ verified: false, message: `Format issues: ${msg}` });
      } else if (requestError.response?.status === 404) {
        setResult({ verified: false, message: 'Certificate not found. Please check the serial number and try again.' });
      } else if (requestError.response?.status === 401) {
        setResult({ verified: false, message: 'Date of birth does not match our records. Please try again.' });
      } else if (requestError.response?.status === 403) {
        setResult({ verified: false, message: 'This certificate is private and cannot be verified. The student has restricted access to this certificate.' });
      } else if (requestError.response?.status === 409) {
        setResult({ verified: false, message: 'This certificate has been revoked and is no longer valid.' });
      } else {
        setResult({ verified: false, message: errorData?.message || 'Verification failed. Please try again.' });
      }
    } finally {
      setLoading(false);
    }
  };

  const handlePasteLinkVerify = async () => {
    if (!linkInput.trim()) { setResult({ verified: false, message: 'Please paste a verification link.' }); return; }
    try {
      const url = new URL(linkInput.trim());
      const s = url.searchParams.get('s');
      const v = url.searchParams.get('v');
      if (s && v) {
        await autoVerifyFromLink(s, v);
      } else {
        setResult({ verified: false, message: 'Invalid share link format. Make sure you copied the full link.' });
      }
    } catch {
      setResult({ verified: false, message: 'Invalid URL. Please paste a valid certificate verification link.' });
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
      <div className="min-h-screen bg-[var(--bg-base)]">
        <PublicNavbar />
        <div className="flex min-h-[70vh] items-center justify-center px-4">
          <Card className="max-w-md w-full text-center space-y-6 py-12">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)]">
              <ShieldCheck className="h-8 w-8 text-[var(--brand)] animate-pulse" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)]">Verifying Certificate</h2>
              <p className="mt-2 text-sm text-[var(--text-muted)]">
                Please wait while we verify this certificate...
              </p>
            </div>
            <Loader2 className="h-6 w-6 animate-spin text-[var(--brand)] mx-auto" />
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <PublicNavbar />
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-xl">
          {/* Form Card */}
          <Card className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Public Verification</p>
              <h1 className="mt-2 text-2xl font-bold text-[var(--text-primary)] sm:text-3xl">
                Verify Certificate
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                Enter the serial number and student's date of birth to check authenticity.
              </p>
            </div>

            <div className="flex gap-1 p-1 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl mb-5">
              {TABS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => { setTab(id); setError(''); }}
                  className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                    tab === id
                      ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-sm border border-[var(--border)]'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface)]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {error && !result && (
              <div className="rounded-xl bg-[var(--danger)]/10 border border-[var(--danger)]/30 px-4 py-3 flex items-start">
                <XCircle className="w-5 h-5 text-[var(--danger)] mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-[var(--danger)]">{error}</p>
              </div>
            )}

            {tab === 'manual' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  type="text"
                  name="serial"
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
                  <label className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                    Certificate Share Link
                  </label>
                  <textarea
                    value={linkInput}
                    onChange={(e) => setLinkInput(e.target.value)}
                    placeholder="Paste the share link here (e.g., https://eduauth.app/verify?s=BSC-26-...&v=...)"
                    rows={3}
                    className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-surface)] px-4 py-3 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-1 focus:ring-[var(--brand)] focus:border-[var(--brand)] resize-none"
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

          {/* Verification Result Modal */}
          <Modal open={!!result || loading} onClose={handleReset} title={loading ? "Verifying Certificate" : "Verification Result"} size="md">
            {loading && !result ? (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="h-16 w-16 flex items-center justify-center rounded-full bg-[var(--brand)]/10">
                  <ShieldCheck className="h-8 w-8 text-[var(--brand)] animate-pulse" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-[var(--text-primary)]">Verifying details securely...</p>
                  <p className="text-sm text-[var(--text-muted)] mt-1">Please wait a moment while we check the blockchain/database.</p>
                </div>
                <Loader2 className="h-6 w-6 mt-4 animate-spin text-[var(--brand)]" />
              </div>
            ) : result && (
              result.verified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-6 h-6 text-[var(--success)]" />
                    <h2 className="text-xl font-bold text-[var(--success)]">Certificate Verified Successfully</h2>
                  </div>

                  <div className="space-y-0.5 bg-[var(--bg-elevated)] border border-[var(--border)] rounded-xl p-4">
                    <DetailRow label="Serial Number" value={result.certificate.serial} />
                    <DetailRow label="Student Name" value={result.certificate.student_name} />
                    <DetailRow label="Student ID" value={result.certificate.student_id} />
                    <Divider />
                    <DetailRow label="Degree Title" value={result.certificate.certificate_level || result.certificate.degree_title} />
                    <DetailRow label="Program" value={result.certificate.program || result.certificate.program_name} />
                    <DetailRow label="Major" value={result.certificate.major || 'N/A'} />
                    <Divider />
                    <DetailRow label="CGPA" value={result.certificate.cgpa || 'N/A'} />
                    <DetailRow label="Registration No" value={result.certificate.registration_no || 'N/A'} />
                    <Divider />
                    <DetailRow label="Issue Date" value={result.certificate.issue_date} />
                    <DetailRow label="Completion Date" value={result.certificate.completion_date || 'N/A'} />
                    <Divider />
                    <DetailRow label="Institution" value={result.certificate.institution} />
                  </div>



                  <div className="flex gap-3">
                    <Button onClick={() => printVerificationReport(result)} variant="outline" className="flex-1 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]">
                      <Printer className="mr-2 h-4 w-4" />
                      Print
                    </Button>
                    <Button onClick={() => downloadVerificationPDF(result)} variant="primary" className="flex-1">
                      <Download className="mr-2 h-4 w-4" />
                      Save PDF
                    </Button>
                  </div>
                </div>
              ) : result.status === 'revoked' ? (
                <div className="space-y-4 py-6 text-center">
                  <AlertCircle className="w-12 h-12 text-[var(--warning)] mx-auto" />
                  <div>
                    <p className="text-lg font-bold text-[var(--warning)]">Certificate Revoked</p>
                    <p className="mt-1 text-sm text-[var(--text-secondary)]">
                      This certificate was revoked on {result.revoked_at}.
                    </p>
                    {result.revocation_reason && (
                      <p className="mt-2 text-sm text-[var(--text-muted)]">
                        Reason: {result.revocation_reason}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button onClick={() => printVerificationReport(result)} variant="outline" className="flex-1 bg-[var(--bg-surface)] border-[var(--border)] text-[var(--text-primary)]">
                      <Printer className="mr-2 h-4 w-4" />
                      Print Report
                    </Button>
                    <Button onClick={() => downloadVerificationPDF(result)} variant="primary" className="flex-1 bg-[var(--warning)] hover:bg-[var(--warning)]/90">
                      <Download className="mr-2 h-4 w-4" />
                      Save PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 py-8 text-center">
                  <XCircle className="w-12 h-12 text-[var(--danger)] mx-auto" />
                  <p className="text-lg font-bold text-[var(--danger)]">
                    Verification Failed
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    {result.message || error || 'Unable to verify this certificate'}
                  </p>
                  <div className="mt-4 bg-[var(--danger)]/10 rounded-xl p-4 text-left border border-[var(--danger)]/30">
                    <p className="text-sm font-semibold text-[var(--danger)] mb-2">How to solve this:</p>
                    <ul className="text-sm text-[var(--danger)] list-disc list-inside space-y-1.5">
                      <li>Double check the serial number for typos</li>
                      <li>Ensure the date of birth is exactly as registered</li>
                      <li>If using a share link, it might be expired or invalid</li>
                      <li>Contact the issuing institution if the issue persists</li>
                    </ul>
                  </div>
                  <Button onClick={handleReset} variant="secondary" className="w-full">
                    Close
                  </Button>
                </div>
              )
            )}
          </Modal>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2.5">
      <span className="text-sm text-[var(--text-muted)]">{label}</span>
      <span className="text-sm font-medium text-[var(--text-primary)] text-right">{value || 'N/A'}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-[var(--border)] my-1" />;
}
