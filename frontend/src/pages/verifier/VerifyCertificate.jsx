import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Search, CheckCircle, XCircle, AlertCircle,
  RotateCcw, History, Clock, Loader2, Link2, ChevronRight,
  BadgeCheck, Building2, Calendar, User, Hash, Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}
const TABS = [
  { id: 'manual', label: 'Enter Details', icon: Search },
  { id: 'link', label: 'Paste Link', icon: Link2 },
];

const STATUS_CONFIG = {
  success:          { label: 'Verified',   color: 'success', icon: CheckCircle,   bg: 'green' },
  not_found:        { label: 'Not Found',  color: 'error',   icon: XCircle,       bg: 'red'   },
  revoked:          { label: 'Revoked',    color: 'warning', icon: AlertCircle,   bg: 'amber' },
  dob_mismatch:     { label: 'Not Found',  color: 'error',   icon: XCircle,       bg: 'red'   },
  private_certificate: { label: 'Private', color: 'warning', icon: AlertCircle,   bg: 'amber' },
};


function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Badge variant={cfg.color}>{cfg.label}</Badge>;
}

function DetailRow({ label, value, icon: Icon }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
      <span className="w-36 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

function VerificationResult({ result, onReset, onRequestAccess }) {
  if (!result) return null;

  if (result.verified) {
    const cert = result.certificate;
    return (
      <div className="rounded-2xl border-2 border-green-400 bg-green-50/60 dark:bg-green-900/10 dark:border-green-600 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/40">
            <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-green-800 dark:text-green-300">Certificate Verified Successfully</h2>
            <p className="text-sm text-green-600 dark:text-green-400">This certificate is authentic and valid.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
          <DetailRow icon={Hash}      label="Serial Number"  value={cert.serial} />
          <DetailRow icon={User}      label="Student Name"   value={cert.student_name} />
          <DetailRow icon={BadgeCheck} label="Student ID"    value={cert.student_id} />
          <DetailRow icon={Award}     label="Degree"         value={cert.degree_title} />
          <DetailRow icon={Award}     label="Program"        value={cert.program_name} />
          <DetailRow icon={Award}     label="Major"          value={cert.major} />
          <DetailRow icon={Award}     label="CGPA"           value={cert.cgpa} />
          <DetailRow icon={Building2} label="Institution"    value={cert.institution} />
          <DetailRow icon={Calendar}  label="Issue Date"     value={cert.issue_date} />
          <DetailRow icon={Calendar}  label="Completion"     value={cert.completion_date} />
        </div>

        <p className="text-xs text-gray-400 dark:text-gray-500">
          Verified on {new Date().toLocaleString()}
        </p>

        <Button onClick={onReset} variant="secondary" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" />
          Verify Another Certificate
        </Button>
      </div>
    );
  }

  if (result.status === 'revoked') {
    return (
      <div className="rounded-2xl border-2 border-amber-400 bg-amber-50/60 dark:bg-amber-900/10 dark:border-amber-600 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/40">
            <AlertCircle className="h-6 w-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-amber-800 dark:text-amber-300">⚠️ Certificate Revoked</h2>
            <p className="text-sm text-amber-600 dark:text-amber-400">This certificate is no longer valid.</p>
          </div>
        </div>
        <div className="rounded-xl bg-white dark:bg-gray-900/60 border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
          <DetailRow icon={Calendar} label="Revoked On"  value={result.revoked_at} />
          <DetailRow icon={User}     label="Revoked By"  value={result.revoked_by} />
          {result.revocation_reason && (
            <DetailRow icon={AlertCircle} label="Reason" value={result.revocation_reason} />
          )}
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">For more information, contact the issuing institution.</p>
        <Button onClick={onReset} variant="secondary" className="w-full">
          <RotateCcw className="mr-2 h-4 w-4" /> Try Again
        </Button>
      </div>
    );
  }

  // Not found / dob mismatch / private
  return (
    <div className="rounded-2xl border-2 border-red-300 bg-red-50/60 dark:bg-red-900/10 dark:border-red-700 p-6 space-y-5">
      <div className="flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/40">
          <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-red-800 dark:text-red-300">❌ Certificate Not Found</h2>
          <p className="text-sm text-red-600 dark:text-red-400">{result.message || 'No certificate found with the provided details.'}</p>
        </div>
      </div>
      <ul className="text-sm text-gray-600 dark:text-gray-400 list-disc list-inside space-y-1">
        <li>The serial number might be incorrect</li>
        <li>The date of birth may not match our records</li>
        <li>The certificate may have been revoked or removed</li>
      </ul>
      <Button onClick={onReset} variant="secondary" className="w-full">
        <RotateCcw className="mr-2 h-4 w-4" /> Try Again
      </Button>
    </div>
  );
}

export default function VerifierVerifyCertificate() {
  const [searchParams] = useSearchParams();
  const [tab, setTab] = useState('manual');
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [linkInput, setLinkInput] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [recentLoading, setRecentLoading] = useState(true);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState({});
  const serialRef = useRef(null);
  const hasAutoVerified = useRef(false);

  const fetchRecent = useCallback(async () => {
    try {
      setRecentLoading(true);
      const { data } = await api.get('/verifier/verifications/recent');
      setRecentVerifications(data.verifications || []);
    } catch {
      // silently fail
    } finally {
      setRecentLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRecent();
    if (serialRef.current) serialRef.current.focus();
  }, [fetchRecent]);

  // Auto-verify from share link in URL params
  useEffect(() => {
    if (hasAutoVerified.current) return;
    const s = searchParams.get('s');
    const v = searchParams.get('v');
    if (s && v) {
      hasAutoVerified.current = true;
      handleLinkVerify(s, v);
    }
  }, [searchParams]);

  const handleLinkVerify = async (s, v) => {
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const { data } = await api.get('/verify-link', { params: { s, v } });
      setResult(data);
      fetchRecent();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid or expired verification link.');
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setValidationErrors({});
    if (!formData.serial.trim()) { setValidationErrors({ serial: ['Serial number is required'] }); return; }
    if (!formData.date_of_birth) { setValidationErrors({ date_of_birth: ['Date of birth is required'] }); return; }
    setLoading(true);
    try {
      const { data } = await api.post('/verifier/verify', formData);
      setResult(data);
      fetchRecent();
    } catch (err) {
      const status = err.response?.status;
      const msg = err.response?.data?.message;
      if (status === 422) {
        setValidationErrors(err.response?.data?.errors || {});
        setError('Please check your input.');
      } else if (status === 400) {
        setResult({ verified: false, message: 'Invalid certificate serial number format.' });
      } else if (status === 404) {
        setResult({ verified: false, message: msg || 'Certificate not found.' });
      } else if (status === 401) {
        setResult({ verified: false, message: 'Date of birth does not match our records.' });
      } else if (status === 403) {
        setResult({ verified: false, message: 'This certificate is private and cannot be verified.' });
      } else {
        setResult({ verified: false, status: err.response?.data?.status, ...err.response?.data });
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
        await handleLinkVerify(s, v);
      } else {
        setError('Invalid share link format. Make sure you copied the full link.');
      }
    } catch {
      setError('Invalid URL. Please paste a valid certificate verification link.');
    }
  };

  const handleReset = () => {
    setResult(null);
    setError('');
    setValidationErrors({});
    setFormData({ serial: '', date_of_birth: '' });
    setLinkInput('');
    hasAutoVerified.current = false;
    if (serialRef.current) serialRef.current.focus();
  };

  const handleLoadFromHistory = (item) => {
    setResult(null);
    setError('');
    setFormData({ serial: item.serial, date_of_birth: '' });
    setTab('manual');
    setTimeout(() => serialRef.current?.focus(), 100);
  };

  const updateField = (field) => (e) => {
    const value = field === 'serial' ? e.target.value.toUpperCase() : e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (validationErrors[field]) setValidationErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Verification</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Verify Certificate</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Enter certificate details to instantly confirm authenticity.
          </p>
        </div>

        {/* Verification form + result on the left, recent verifications on the right */}
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
          {/* Verification Form */}
          <div className="space-y-6">
            <Card>
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

              {/* Error banner */}
              {error && !result && (
                <div className="mb-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-start gap-3">
                  <XCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              {/* Manual Entry Tab */}
              {tab === 'manual' && (
                <form onSubmit={handleManualVerify} className="space-y-4">
                  <Input
                    ref={serialRef}
                    label="Certificate Serial Number"
                    placeholder="e.g., BSC-26-000001M"
                    value={formData.serial}
                    onChange={updateField('serial')}
                    error={validationErrors.serial?.[0]}
                    required
                  />
                  <Input
                    type="date"
                    label="Student Date of Birth"
                    value={formData.date_of_birth}
                    onChange={updateField('date_of_birth')}
                    error={validationErrors.date_of_birth?.[0]}
                    required
                  />
                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={loading}>
                      {loading ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                      ) : (
                        <><ShieldCheck className="mr-2 h-4 w-4" />Verify Certificate</>
                      )}
                    </Button>
                    {(formData.serial || formData.date_of_birth) && (
                      <Button type="button" variant="secondary" onClick={handleReset}>
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </form>
              )}

              {/* Paste Link Tab */}
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
                  <Button onClick={handlePasteLinkVerify} className="w-full" disabled={loading}>
                    {loading ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                    ) : (
                      <><Link2 className="mr-2 h-4 w-4" />Verify from Link</>
                    )}
                  </Button>
                </div>
              )}
            </Card>

            {/* Verification Result */}
            {loading && !result && (
              <Card>
                <div className="flex flex-col items-center justify-center py-10 gap-4">
                  <div className="h-14 w-14 flex items-center justify-center rounded-full bg-primary-50 dark:bg-primary-900/30">
                    <ShieldCheck className="h-7 w-7 text-primary-600 dark:text-primary-400 animate-pulse" />
                  </div>
                  <div className="text-center">
                    <p className="font-semibold text-gray-900 dark:text-white">Verifying Certificate</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait a moment...</p>
                  </div>
                  <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
                </div>
              </Card>
            )}

            {result && (
              <VerificationResult result={result} onReset={handleReset} />
            )}

            {!result && !loading && (
              <Card>
                <div className="flex flex-col items-center py-10 gap-3 text-center">
                  <div className="h-14 w-14 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <ShieldCheck className="h-7 w-7 text-gray-300 dark:text-gray-600" />
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Verification result will appear here</p>
                </div>
              </Card>
            )}
          </div>

          {/* Recent Verifications */}
          <div className="space-y-4">
            <Card>
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-primary-600" />
                  Recent Verifications
                </h2>
                <Link
                  to="/verifier/verification-history"
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  View All <ChevronRight className="h-3 w-3" />
                </Link>
              </div>

              {recentLoading ? (
                <div className="flex justify-center py-6">
                  <LoadingSpinner />
                </div>
              ) : recentVerifications.length === 0 ? (
                <div className="flex flex-col items-center py-8 gap-3 text-center">
                  <div className="h-12 w-12 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <History className="h-6 w-6 text-gray-300 dark:text-gray-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">No verifications yet</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Start verifying certificates to see your history here</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {recentVerifications.slice(0, 3).map((item) => {
                    const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'default', bg: 'gray' };
                    const StatusIcon = cfg.icon || ShieldCheck;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleLoadFromHistory(item)}
                        className="w-full rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-700 px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                      >
                        <div className="flex items-start gap-3">
                          <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-${cfg.bg}-100 dark:bg-${cfg.bg}-900/30`}>
                            <StatusIcon className={`h-4 w-4 text-${cfg.bg}-600 dark:text-${cfg.bg}-400`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">
                              {item.serial_masked || item.serial}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {item.student_name || 'Unknown Student'}
                              {item.institution && ` · ${item.institution}`}
                            </p>
                          </div>
                          <div className="flex flex-col items-end gap-1 flex-shrink-0">
                            <StatusBadge status={item.status} />
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {timeAgo(item.verified_at)}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Tips card */}
            <Card>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">How to verify</h3>
              <ol className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex gap-2"><span className="font-bold text-primary-600 flex-shrink-0">1.</span>Enter the serial number (found on the certificate PDF)</li>
                <li className="flex gap-2"><span className="font-bold text-primary-600 flex-shrink-0">2.</span>Enter the student's date of birth as shown on official documents</li>
                <li className="flex gap-2"><span className="font-bold text-primary-600 flex-shrink-0">3.</span>Or paste a share link if the student shared a verification URL</li>
              </ol>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
