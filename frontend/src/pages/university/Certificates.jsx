import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import {
  Eye, Download, ShieldX, AlertCircle, X, CheckCircle,
  Search, RotateCcw, ShieldAlert, Clock, Shield, Award
} from 'lucide-react';
import RevocationModal from '../../components/shared/RevocationModal';

/* ─────────────────────────────────────────────────────────────
   UNREVOKE MODAL
   ───────────────────────────────────────────────────────────── */
function UnrevokeModal({ certificate, onClose, onConfirm, loading }) {
  const [reason, setReason] = useState('');
  const isValid = reason.trim().length >= 10;

  if (!certificate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl border border-gray-100 dark:border-gray-700">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <RotateCcw className="h-4 w-4 text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-base font-bold text-gray-900 dark:text-white">Unrevoke Certificate</h2>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <X className="h-4 w-4 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          <div className="rounded-xl border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20 px-4 py-3">
            <p className="text-sm font-semibold text-green-800 dark:text-green-300">
              {certificate.certificate_name}
            </p>
            <p className="mt-0.5 text-xs text-green-600 dark:text-green-400 font-mono">
              {certificate.serial}
            </p>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Provide a reason for restoring this certificate. This will be recorded in the
            revocation history.
          </p>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
              Reason <span className="text-red-500">*</span>
              <span className="ml-1 text-xs font-normal text-gray-400">(min 10 characters)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Explain why this certificate is being restored..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500 focus:border-green-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white resize-none transition"
            />
            <p className={`mt-1 text-xs ${reason.length > 0 && !isValid ? 'text-red-500' : 'text-gray-400'}`}>
              {reason.length}/10 minimum characters
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700 px-6 py-4">
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={() => onConfirm(reason)}
            disabled={!isValid || loading}
            loading={loading}
            className="bg-green-600 hover:bg-green-700 text-white border-green-600"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Restore Certificate
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   REVOCATION HISTORY TIMELINE (inside details modal)
   ───────────────────────────────────────────────────────────── */
function RevocationHistoryTimeline({ history, issueDate }) {
  if (!history || history.length === 0) return null;

  const formatTS = (ts) => {
    if (!ts) return '—';
    try {
      return new Date(ts).toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
      });
    } catch { return ts; }
  };

  const ACTION_CONFIG = {
    revoked:   { label: 'Revoked',   color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',    dot: 'bg-red-500' },
    unrevoked: { label: 'Unrevoked', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', dot: 'bg-green-500' },
    restored:  { label: 'Restored',  color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', dot: 'bg-green-500' },
    issued:    { label: 'Issued',    color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',  dot: 'bg-blue-500' },
  };

  // Most recent first
  const sorted = [...history].reverse();

  return (
    <div className="mt-6 pt-5 border-t border-gray-100 dark:border-gray-700">
      <h3 className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white mb-4">
        <Clock className="h-4 w-4 text-gray-400" />
        Revocation History
      </h3>
      <div className="relative">
        <div className="absolute left-3.5 top-0 bottom-0 w-px bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-4">
          {/* Issued entry */}
          {issueDate && (
            <div className="relative flex gap-4">
              <div className="relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-blue-500 ring-2 ring-white dark:ring-gray-800">
                <Shield className="h-3 w-3 text-white" />
              </div>
              <div className="flex-1 min-w-0 pb-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    Issued
                  </span>
                  <span className="text-xs text-gray-400">System</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Certificate issued on {formatDate(issueDate)}
                </p>
              </div>
            </div>
          )}

          {sorted.map((entry, i) => {
            const cfg = ACTION_CONFIG[entry.action] ?? ACTION_CONFIG.issued;
            const actor = entry.performed_by_name ?? `User #${entry.performed_by ?? entry.actor_id}`;
            const role  = entry.role ?? entry.actor_role ?? '—';
            const ts    = formatTS(entry.timestamp);
            const reason = entry.reason ?? '—';

            return (
              <div key={i} className="relative flex gap-4">
                <div className={`relative z-10 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full ${cfg.dot} ring-2 ring-white dark:ring-gray-800`}>
                  {entry.action === 'revoked' ? (
                    <ShieldX className="h-3 w-3 text-white" />
                  ) : (
                    <RotateCcw className="h-3 w-3 text-white" />
                  )}
                </div>
                <div className="flex-1 min-w-0 pb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      by <span className="font-medium text-gray-700 dark:text-gray-300">{actor}</span>
                      {' '}<span className="italic text-gray-400">({role})</span>
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                    <span className="font-medium">Reason:</span> {reason}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{ts}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   CERTIFICATE DETAILS MODAL
   ───────────────────────────────────────────────────────────── */
function CertificateDetailsPanel({ certificateId, onClose, onDownload }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    api.get(`/university/certificates/${certificateId}`)
      .then(res => {
        setCert(res.data.certificate);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load certificate details.');
        setLoading(false);
      });
  }, [certificateId]);

  return (
    <>
      <div 
        className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col transform transition-transform duration-300 translate-x-0 border-l border-gray-100 dark:border-gray-800">
        
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4 shrink-0 bg-gray-50/50 dark:bg-gray-800/50">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Certificate Details</h2>
            {!loading && !error && cert && (
              cert.revoked_at ? (
                <Badge variant="danger">Revoked</Badge>
              ) : (
                <Badge variant="success">Active</Badge>
              )
            )}
          </div>
          <button 
            onClick={onClose} 
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex h-full items-center justify-center">
              <LoadingSpinner />
            </div>
          ) : error || !cert ? (
            <div className="p-6 text-center text-red-500">{error || 'Certificate not found'}</div>
          ) : (
            <div className="p-6 space-y-8">
              
              <div className="text-center pb-6 border-b border-gray-100 dark:border-gray-800">
                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 mb-4">
                  <Award className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{cert.student_name}</h3>
                <p className="text-sm text-gray-500 font-mono mt-1">{cert.serial}</p>
                <div className="mt-4">
                  <Button 
                    onClick={() => onDownload(cert)} 
                    variant="primary" 
                    className="w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" /> Download PDF
                  </Button>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Student Information</h4>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Student ID</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{cert.roll_number || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Academic Session</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{cert.session}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Academic Details</h4>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Program</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{cert.certificate_name}</span>
                    </div>
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Department</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{cert.department}</span>
                    </div>
                    {cert.major && (
                      <div className="flex justify-between text-sm gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Major</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right">{cert.major}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">CGPA</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{cert.cgpa || 'N/A'}</span>
                    </div>
                    {cert.degree_class && (
                      <div className="flex justify-between text-sm gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Class</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right">{cert.degree_class}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Issuance Information</h4>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/30 p-4 space-y-3">
                    <div className="flex justify-between text-sm gap-4">
                      <span className="text-gray-500 dark:text-gray-400">Issue Date</span>
                      <span className="font-medium text-gray-900 dark:text-white text-right">{formatDate(cert.issue_date)}</span>
                    </div>
                    {cert.convocation_date && (
                      <div className="flex justify-between text-sm gap-4">
                        <span className="text-gray-500 dark:text-gray-400">Convocation Date</span>
                        <span className="font-medium text-gray-900 dark:text-white text-right">{formatDate(cert.convocation_date)}</span>
                      </div>
                    )}
                    <div className="pt-3 mt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Signed By</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{cert.authority_name}</p>
                      <p className="text-xs text-gray-500">{cert.authority_title}</p>
                    </div>
                  </div>
                </div>

                {cert.revoked_at && (
                  <div className="rounded-xl border border-red-200 bg-red-50 p-4 dark:border-red-900/30 dark:bg-red-900/10">
                    <h3 className="text-sm font-bold text-red-700 dark:text-red-400 mb-3 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" /> Revoked
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between gap-4">
                        <span className="text-red-600/70 dark:text-red-400/70">Date</span>
                        <span className="font-medium text-red-700 dark:text-red-300 text-right">{formatDate(cert.revoked_at)}</span>
                      </div>
                      <div className="flex justify-between gap-4">
                        <span className="text-red-600/70 dark:text-red-400/70">By</span>
                        <span className="font-medium text-red-700 dark:text-red-300 text-right">
                          {cert.revoked_by_name} <span className="opacity-70 text-xs">({cert.revoked_by_role ?? 'unknown'})</span>
                        </span>
                      </div>
                      {cert.revocation_reason && (
                        <div className="pt-2">
                          <span className="block text-xs text-red-600/70 dark:text-red-400/70 mb-1">Reason</span>
                          <span className="block font-medium text-red-700 dark:text-red-300">{cert.revocation_reason}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <RevocationHistoryTimeline
                  history={cert.revocation_history}
                  issueDate={cert.issue_date}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────
   MAIN PAGE
   ───────────────────────────────────────────────────────────── */
export default function UniversityCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedForRevoke, setSelectedForRevoke] = useState(null);
  const [selectedForUnrevoke, setSelectedForUnrevoke] = useState(null);
  const [unrevokeLoading, setUnrevokeLoading] = useState(false);
  const [selectedForDetails, setSelectedForDetails] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCertificates = certificates.filter((cert) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (cert.student_name && cert.student_name.toLowerCase().includes(q)) ||
      (cert.serial && cert.serial.toLowerCase().includes(q)) ||
      (cert.certificate_name && cert.certificate_name.toLowerCase().includes(q)) ||
      (cert.issue_date && formatDate(cert.issue_date).toLowerCase().includes(q))
    );
  });

  useEffect(() => {
    api.get('/university/certificates')
      .then(response => {
        setCertificates(response.data.certificates);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to fetch certificates.');
        setLoading(false);
      });
  }, []);

  /* ── Revoke ─────────────────────────────────────────────────── */
  const handleRevokeClick = (certificate) => {
    setSelectedForRevoke(certificate);
  };

  const handleRevocation = (reason) => {
    if (!selectedForRevoke) return;

    api.post(`/university/certificates/${selectedForRevoke.id}/revoke`, { reason })
      .then(() => {
        setCertificates(certs => certs.map(c =>
          c.id === selectedForRevoke.id
            ? { ...c, revoked_at: new Date().toISOString(), revocation_reason: reason, revoked_by_role: 'university' }
            : c
        ));
        toast.success('Certificate revoked successfully.');
        setSelectedForRevoke(null);
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to revoke certificate.');
      });
  };

  /* ── Unrevoke ───────────────────────────────────────────────── */
  const handleUnrevokeClick = (certificate) => {
    setSelectedForUnrevoke(certificate);
  };

  const handleUnrevoke = (reason) => {
    if (!selectedForUnrevoke) return;
    setUnrevokeLoading(true);

    api.post(`/university/certificates/${selectedForUnrevoke.id}/unrevoke`, { reason })
      .then(() => {
        setCertificates(certs => certs.map(c =>
          c.id === selectedForUnrevoke.id
            ? { ...c, revoked_at: null, revocation_reason: null, revoked_by_role: null }
            : c
        ));
        toast.success('Certificate successfully restored.');
        setSelectedForUnrevoke(null);
      })
      .catch(err => {
        const msg = err.response?.data?.message || err.response?.data?.error || 'Failed to unrevoke certificate.';
        toast.error(msg);
      })
      .finally(() => {
        setUnrevokeLoading(false);
      });
  };

  /* ── Download PDF ───────────────────────────────────────────── */
  const downloadPdf = async (certificate) => {
    setDownloadingId(certificate.id);
    try {
      const response = await api.get(`/university/certificates/${certificate.id}/download`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${certificate.serial}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      let errorMsg = 'Failed to download certificate PDF.';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || errorMsg;
        } catch (e) {
          // fallback to default
        }
      } else {
        errorMsg = err?.response?.data?.error || err?.response?.data?.message || err?.message || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Certificates</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Issued Certificates</h1>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3" />
            {error}
          </div>
        )}

        {/* Search bar */}
        <div className="relative max-w-xl">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by student name, serial, certificate level, or issue date..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          />
        </div>

        {filteredCertificates.length === 0 ? (
          <Card>
            <div className="flex flex-col items-center justify-center min-h-[200px] text-center">
              <Shield className="h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
              <p className="text-gray-500 dark:text-gray-400">No certificates found.</p>
            </div>
          </Card>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto min-h-[320px] rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 shadow-sm">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/50">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Certificate</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Student</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Issue Date</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Status</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {filteredCertificates.map((certificate) => {
                    const isRevoked = !!certificate.revoked_at;
                    const revokedByAdmin = isRevoked && certificate.revoked_by_role === 'admin';
                    const revokedByUni = isRevoked && certificate.revoked_by_role === 'university';

                    return (
                      <tr key={certificate.id} className={`hover:bg-gray-50 dark:hover:bg-gray-800/50 transition ${isRevoked ? 'opacity-75 bg-red-50/20 dark:bg-red-900/5' : ''}`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900 dark:text-white">{certificate.certificate_name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-0.5">{certificate.serial}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{certificate.student_name}</div>
                          {certificate.issued_name && (
                            <div className="text-xs text-gray-400 italic mt-0.5">{certificate.issued_name}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(certificate.issue_date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {isRevoked ? (
                              <Badge variant="danger">REVOKED</Badge>
                            ) : (
                              <Badge variant="success">ACTIVE</Badge>
                            )}
                            {revokedByAdmin && (
                              <div className="relative group inline-flex">
                                <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border border-red-200 dark:border-red-800 cursor-default">
                                  <ShieldAlert className="h-3 w-3" />
                                  Admin
                                </span>
                                <div className="pointer-events-none absolute bottom-full left-0 mb-2 w-48 rounded-lg bg-gray-900 px-3 py-2 text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg whitespace-normal">
                                  Revoked by platform administrator.
                                  <div className="absolute top-full left-4 -mt-px border-4 border-transparent border-t-gray-900" />
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button variant="ghost" className="!px-2 !py-1 text-xs" onClick={() => setSelectedForDetails(certificate.id)}>
                              <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                            </Button>
                            <Button
                              variant="ghost"
                              className="!px-2 !py-1 text-xs"
                              onClick={() => downloadPdf(certificate)}
                              disabled={downloadingId === certificate.id}
                            >
                              {downloadingId === certificate.id ? (
                                <LoadingSpinner size="sm" className="mr-1.5" />
                              ) : (
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                              )}
                              Download
                            </Button>

                            {!isRevoked && (
                              <Button variant="ghost" className="!px-2 !py-1 text-xs text-red-600 dark:text-red-400" onClick={() => handleRevokeClick(certificate)}>
                                <ShieldX className="w-3.5 h-3.5 mr-1.5" /> Revoke
                              </Button>
                            )}

                            {revokedByUni && (
                              <Button variant="ghost" className="!px-2 !py-1 text-xs text-green-600 dark:text-green-400" onClick={() => handleUnrevokeClick(certificate)}>
                                <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Unrevoke
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredCertificates.map(certificate => {
                const isRevoked = !!certificate.revoked_at;
                const revokedByAdmin = isRevoked && certificate.revoked_by_role === 'admin';
                const revokedByUni = isRevoked && certificate.revoked_by_role === 'university';

                return (
                  <Card key={certificate.id} className={`${isRevoked ? 'opacity-80 bg-red-50/10 border-red-100 dark:bg-red-900/5 dark:border-red-900/20' : ''}`}>
                    <div className="flex flex-col gap-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-bold text-gray-900 dark:text-white">{certificate.certificate_name}</p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">{certificate.serial}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {isRevoked ? <Badge variant="danger">REVOKED</Badge> : <Badge variant="success">ACTIVE</Badge>}
                          {revokedByAdmin && <Badge variant="danger" className="text-[10px] py-0">Admin</Badge>}
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-gray-900 dark:text-gray-100 font-medium">{certificate.student_name}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">Issued: {formatDate(certificate.issue_date)}</p>
                      </div>

                      {isRevoked && (
                        <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700 dark:bg-red-900/20 dark:text-red-300">
                          Revoked on {formatDate(certificate.revoked_at)}
                        </div>
                      )}

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                        <Button variant="secondary" size="sm" onClick={() => setSelectedForDetails(certificate.id)}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => downloadPdf(certificate)}
                          disabled={downloadingId === certificate.id}
                        >
                          <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                        </Button>

                        {!isRevoked && (
                          <Button variant="danger" size="sm" onClick={() => handleRevokeClick(certificate)}>
                            <ShieldX className="w-3.5 h-3.5 mr-1.5" /> Revoke
                          </Button>
                        )}
                        {revokedByUni && (
                          <Button variant="success" size="sm" onClick={() => handleUnrevokeClick(certificate)}>
                            <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> Unrevoke
                          </Button>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Revoke Modal */}
      {selectedForRevoke && (
        <RevocationModal
          certificate={selectedForRevoke}
          onClose={() => setSelectedForRevoke(null)}
          onConfirm={handleRevocation}
        />
      )}

      {/* Unrevoke Modal */}
      <UnrevokeModal
        certificate={selectedForUnrevoke}
        onClose={() => setSelectedForUnrevoke(null)}
        onConfirm={handleUnrevoke}
        loading={unrevokeLoading}
      />

      {/* Details Panel */}
      {selectedForDetails && (
        <CertificateDetailsPanel
          certificateId={selectedForDetails}
          onClose={() => setSelectedForDetails(null)}
          onDownload={downloadPdf}
        />
      )}
    </DashboardLayout>
  );
}
