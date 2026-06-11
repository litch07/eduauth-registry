import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  ShieldCheck, Search, CheckCircle, XCircle, AlertCircle,
  RotateCcw, History, Clock, Loader2, Link2, ChevronRight,
  BadgeCheck, Building2, Calendar, User, Hash, Award, Info, Printer, Download
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { printVerificationReport, downloadVerificationPDF } from '../../utils/printVerification';

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

function Divider() {
  return <hr className="border-gray-100 dark:border-gray-800 my-1" />;
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
  const [showInstructions, setShowInstructions] = useState(false);
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
        <div className="grid gap-6 lg:grid-cols-[3fr_2fr] items-stretch">
          {/* Verification Form */}
          <div className="flex flex-col">
            <Card className="flex flex-col h-full flex-1">
              {/* Card Header matching the right side */}
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary-600" />
                  Verify Details
                </h2>
                <button 
                  onClick={() => setShowInstructions(true)} 
                  className="flex items-center gap-1 text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition-colors"
                >
                  <Info className="w-3.5 h-3.5" /> How it works
                </button>
              </div>

              {/* Tabs Segmented Control */}
              <div className="flex gap-1 p-1 bg-gray-50 border border-gray-100 dark:bg-gray-800/50 dark:border-gray-800 rounded-xl mb-6">
                {TABS.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => { setTab(id); setError(''); }}
                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ${
                      tab === id
                        ? 'bg-white text-primary-600 shadow-sm border border-gray-200/50 dark:bg-gray-800 dark:text-primary-400 dark:border-gray-700'
                        : 'text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
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

              {/* Tab Contents Area */}
              <div className="flex-1 flex flex-col mb-8">
                {/* Manual Entry Tab */}
                {tab === 'manual' && (
                  <form onSubmit={handleManualVerify} className="space-y-5">
                    <div className="space-y-5">
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
                    </div>
                    <div className="flex gap-3 pt-2">
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
                      <div className="relative group">
                        <div className="absolute top-2.5 left-3 flex items-start pointer-events-none">
                          <Link2 className="h-5 w-5 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                        </div>
                        <textarea
                          value={linkInput}
                          onChange={(e) => setLinkInput(e.target.value)}
                          placeholder="https://eduauth.app/verify?s=..."
                          rows={3}
                          className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-4 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500 resize-none transition-all"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Paste the full verification URL. It should contain both the student's serial number and the secure token.
                      </p>
                    </div>
                    <div className="flex gap-3 pt-1">
                      <Button onClick={handlePasteLinkVerify} className="flex-1" disabled={loading}>
                        {loading ? (
                          <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Verifying...</>
                        ) : (
                          <><ShieldCheck className="mr-2 h-4 w-4" />Verify from Link</>
                        )}
                      </Button>
                      {linkInput && (
                        <Button type="button" variant="secondary" onClick={handleReset}>
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Verification Footer */}
              <div className="mt-auto pt-5 border-t border-gray-100 dark:border-gray-800 flex items-start gap-3">
                <div className="mt-0.5 p-1.5 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-500" />
                </div>
                <div>
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white">Secure Verification</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-relaxed">
                    Results are cross-checked against our immutable database to ensure absolute authenticity.
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Recent Verifications */}
          <div className="flex flex-col">
            <Card className="flex flex-col h-full flex-1">
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
                <div className="flex-1 flex justify-center items-center py-10">
                  <LoadingSpinner />
                </div>
              ) : recentVerifications.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-10 gap-3 text-center">
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
                  {recentVerifications.slice(0, 5).map((item) => {
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

            {/* End Recent Verifications */}
          </div>
        </div>
      </div>

      {/* Verification Result Modal */}
      <Modal open={!!result || loading} onClose={handleReset} title={loading ? "Verifying Certificate" : "Verification Result"} size="md">
        {loading && !result ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <div className="h-16 w-16 flex items-center justify-center rounded-full bg-primary-100 dark:bg-primary-900/30">
              <ShieldCheck className="h-8 w-8 text-primary-600 dark:text-primary-400 animate-pulse" />
            </div>
            <div className="text-center">
              <p className="text-lg font-semibold text-gray-900 dark:text-white">Verifying details securely...</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Please wait a moment while we check the blockchain/database.</p>
            </div>
            <Loader2 className="h-6 w-6 mt-4 animate-spin text-primary-600" />
          </div>
        ) : result && (
          result.verified ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h2 className="text-xl font-bold text-green-600 dark:text-green-500">Certificate Verified Successfully</h2>
              </div>

              <div className="space-y-0.5 bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 rounded-xl p-4">
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
                <Button onClick={() => printVerificationReport(result)} variant="outline" className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print
                </Button>
                <Button onClick={() => downloadVerificationPDF(result)} className="flex-1">
                  <Download className="mr-2 h-4 w-4" />
                  Save PDF
                </Button>
              </div>
            </div>
          ) : result.status === 'revoked' ? (
            <div className="space-y-4 py-6 text-center">
              <AlertCircle className="w-12 h-12 text-amber-500 mx-auto" />
              <div>
                <p className="text-lg font-bold text-amber-600 dark:text-amber-500">Certificate Revoked</p>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  This certificate was revoked on {result.revoked_at}.
                </p>
                {result.revocation_reason && (
                  <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                    Reason: {result.revocation_reason}
                  </p>
                )}
              </div>
              <div className="flex gap-3 mt-4">
                <Button onClick={() => printVerificationReport(result)} variant="outline" className="flex-1">
                  <Printer className="mr-2 h-4 w-4" />
                  Print Report
                </Button>
                <Button onClick={() => downloadVerificationPDF(result)} className="flex-1 bg-amber-600 hover:bg-amber-700 text-white border-transparent">
                  <Download className="mr-2 h-4 w-4" />
                  Save PDF
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-8 text-center">
              <XCircle className="w-12 h-12 text-red-500 mx-auto" />
              <p className="text-lg font-bold text-red-600 dark:text-red-500">
                Verification Failed
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {result.message || error || 'Unable to verify this certificate'}
              </p>
              <div className="mt-4 bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-left border border-red-100 dark:border-red-900/30">
                <p className="text-sm font-semibold text-red-800 dark:text-red-300 mb-2">How to solve this:</p>
                <ul className="text-sm text-red-700 dark:text-red-400 list-disc list-inside space-y-1.5">
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

      {/* How to use Modal */}
      <Modal open={showInstructions} onClose={() => setShowInstructions(false)} title={tab === 'manual' ? "How to Verify Manually" : "How to Verify via Link"} size="sm">
        <div className="space-y-4">
          {tab === 'manual' ? (
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">1</span>
                <span><strong>Enter the serial number</strong>: Locate the serial number on the certificate (usually starts with something like BSC-).</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">2</span>
                <span><strong>Enter the date of birth</strong>: Provide the student's date of birth exactly as it appears on their official documents.</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">3</span>
                <span><strong>Verify</strong>: Click "Verify Certificate" to cross-check our secure database.</span>
              </li>
            </ol>
          ) : (
            <ol className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">1</span>
                <span><strong>Copy the link</strong>: Obtain the secure verification link shared by the student (e.g., from an email).</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">2</span>
                <span><strong>Paste the link</strong>: Insert the full URL into the input field. Make sure it contains both the serial parameter (s=...) and the verification token (v=...).</span>
              </li>
              <li className="flex gap-3 items-start">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">3</span>
                <span><strong>Verify</strong>: Click "Verify from Link" to instantly validate the certificate.</span>
              </li>
            </ol>
          )}
          <div className="pt-4 flex justify-end">
            <Button onClick={() => setShowInstructions(false)} variant="secondary">
              Got it
            </Button>
          </div>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
