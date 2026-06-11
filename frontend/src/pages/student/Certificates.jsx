import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { QRCodeSVG } from 'qrcode.react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import EmptyState from '../../components/shared/EmptyState';
import SearchBar from '../../components/shared/SearchBar';
import SelectField from '../../components/shared/SelectField';
import ToggleSwitch from '../../components/shared/ToggleSwitch';
import api from '../../services/api';
import { formatDate } from '../../utils/helpers';
import { downloadCertificatePDF, previewCertificatePDF } from '../../services/certificateService';
import { FileText, Eye, Download, Share2, Calendar, Building, AlertCircle, Lock, Unlock, Loader2, X, Copy, RefreshCw, Search, Check } from 'lucide-react';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [copiedSerial, setCopiedSerial] = useState(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Status filter and search
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCertificates = certificates.filter((cert) => {
    // Apply status filter
    if (statusFilter === 'active' && cert.revoked_at) return false;
    if (statusFilter === 'revoked' && !cert.revoked_at) return false;

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (cert.serial && cert.serial.toLowerCase().includes(q)) ||
        (cert.degree_title && cert.degree_title.toLowerCase().includes(q)) ||
        (cert.certificate_name && cert.certificate_name.toLowerCase().includes(q)) ||
        (cert.issue_date && formatDate(cert.issue_date).toLowerCase().includes(q));
      
      if (!matchesSearch) return false;
    }
    
    return true;
  });

  const fetchCertificates = useCallback(async () => {
    setLoading(true);
    try {
      setError('');
      const { data } = await api.get('/student/certificates');

      if (data.success) {
        setCertificates(data.data || []);
      } else {
        setError('Failed to load certificates');
      }
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.response?.data?.message || 'Failed to load certificates');
      toast.error('Failed to load certificates');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCertificates();
  }, [fetchCertificates]);

  const handleDownloadPdf = async (certificate) => {
    try {
      setDownloadingId(certificate.id);
      await downloadCertificatePDF(certificate.id, certificate.serial);
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error('Failed to download certificate:', err);
      let errorMsg = 'Failed to download certificate';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || errorMsg;
        } catch (e) {
          errorMsg = err.message;
        }
      } else {
        errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message || errorMsg;
      }
      toast.error(errorMsg);
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewPdf = async (certificate) => {
    try {
      await previewCertificatePDF(certificate.id);
      toast.success('Certificate preview opened in a new tab');
    } catch (err) {
      console.error('Failed to preview certificate:', err);
      let errorMsg = 'Failed to preview certificate';
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text();
          const json = JSON.parse(text);
          errorMsg = json.error || json.message || errorMsg;
        } catch (e) {
          errorMsg = err.message;
        }
      } else {
        errorMsg = err?.response?.data?.error || err?.response?.data?.message || err.message || errorMsg;
      }
      toast.error(errorMsg);
    }
  };

  const getVerificationUrl = (certificate) => certificate.share_link || `${window.location.origin}/verify?serial=${encodeURIComponent(certificate.serial)}`;

  const handleCopyVerificationLink = async (certificate) => {
    try {
      await navigator.clipboard.writeText(getVerificationUrl(certificate));
      setCopiedLink(true);
      toast.success('Share link copied to clipboard');
      setTimeout(() => {
        setCopiedLink(false);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy share link:', err);
      toast.error('Failed to copy share link');
    }
  };

  const handleCopySerial = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
      setCopiedSerial(serial);
      toast.success('Copied!');
      setTimeout(() => {
        setCopiedSerial(null);
      }, 2000);
    } catch (err) {
      console.error('Failed to copy serial:', err);
      toast.error('Failed to copy serial number');
    }
  };

  const openCertificateDetails = (certificate) => {
    setSelectedCertificate(certificate);
  };

  const closeCertificateDetails = () => {
    setSelectedCertificate(null);
  };

  const toggleVisibility = async (certificateId) => {
    try {
      const { data } = await api.post(`/student/certificates/${certificateId}/toggle-visibility`);
      if (data.success) {
        setCertificates((current) =>
          current.map((cert) =>
            cert.id === certificateId ? { ...cert, is_public: data.is_public } : cert
          )
        );
        toast.success(`Certificate marked as ${data.is_public ? 'public' : 'private'}`);
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      toast.error(err.response?.data?.message || 'Failed to update certificate visibility');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-[24px]">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">My Certificates</h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your academic certificates and control who can view them.</p>
          </div>
          <div>
            <Button variant="outline" onClick={fetchCertificates} loading={loading} aria-label="Refresh certificates">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <SearchBar 
            value={searchQuery} 
            onChange={setSearchQuery} 
            placeholder="Search by serial, certificate level, or issue date..." 
            className="flex-1"
          />
          <div className="w-full sm:w-48">
            <SelectField
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: 'all', label: 'All Status' },
                { value: 'active', label: 'Active' },
                { value: 'revoked', label: 'Revoked' },
              ]}
            />
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} retry={fetchCertificates} />
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            title="No Certificates Found"
            message={searchQuery.trim() ? `No certificates match your search.` : `You don't have any certificates issued yet.`}
            icon={FileText}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[24px]">
            {filteredCertificates.map((certificate) => (
              <Card key={certificate.id} className="flex flex-col h-full hover:shadow-lg transition-shadow">
                {/* Top */}
                <div className="flex justify-between items-start mb-4">
                  <Badge variant="primary">{certificate.degree_title}</Badge>
                  <Badge variant={certificate.revoked_at ? 'danger' : 'success'}>
                    {certificate.revoked_at ? 'Revoked' : 'Active'}
                  </Badge>
                </div>

                {/* Body */}
                <div className="flex-1 space-y-2 cursor-pointer" onClick={() => openCertificateDetails(certificate)}>
                  <p className="text-sm font-semibold text-[var(--text-primary)]">{certificate.institution_name}</p>
                  {certificate.major && (
                    <p className="text-sm text-[var(--text-secondary)]">{certificate.program_name} — {certificate.major}</p>
                  )}
                  <p className="text-xs text-[var(--text-muted)]">
                    {certificate.registration_no ? `ID: ${certificate.registration_no}` : 'ID: Not assigned'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    {certificate.batch ? `Session: ${certificate.batch}` : 'Session: N/A'}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Issued: {certificate.issue_date ? formatDate(certificate.issue_date) : 'N/A'}
                  </p>
                  <p className="font-mono text-xs text-[var(--text-muted)] truncate" title={certificate.serial}>
                    Serial: {certificate.serial}
                  </p>
                </div>

                {/* Footer */}
                <div className="mt-4 pt-4 border-t border-[var(--border)] flex justify-between items-center">
                  <div className="flex items-center">
                    <ToggleSwitch
                      checked={certificate.is_public}
                      onChange={() => toggleVisibility(certificate.id)}
                      label="Public"
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownloadPdf(certificate)}
                    disabled={downloadingId === certificate.id}
                  >
                    {downloadingId === certificate.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        open={!!selectedCertificate}
        onClose={closeCertificateDetails}
        title="Certificate Details"
        size="lg"
      >
        {selectedCertificate && (
          <div className="space-y-6">
            <div className="space-y-5">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {selectedCertificate.degree_title}
              </h2>
              <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5 dark:border-gray-800 dark:bg-gray-800/40">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant={selectedCertificate.is_public ? 'warning' : 'success'}
                    className="transition-colors duration-300"
                  >
                    {selectedCertificate.is_public ? 'Public' : 'Private'}
                  </Badge>
                  {selectedCertificate.revoked_at && <Badge variant="danger">Revoked</Badge>}
                </div>
                <p className="mt-4 text-sm uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Serial Number</p>
                <div className="flex items-center gap-3 mt-1">
                  <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white">{selectedCertificate.serial}</p>
                  <button
                    onClick={() => handleCopySerial(selectedCertificate.serial)}
                    className="p-1.5 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition flex items-center gap-1"
                    title="Copy serial number"
                  >
                    {copiedSerial === selectedCertificate.serial ? (
                      <>
                        <Check className="h-5 w-5 text-green-600 dark:text-green-400 animate-fade-in" />
                        <span className="text-xs text-green-600 dark:text-green-400 font-medium">Copied!</span>
                      </>
                    ) : (
                      <Copy className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                <DetailTile label="Institution" value={selectedCertificate.institution_name} />
                <DetailTile label="Issue Date" value={formatDate(selectedCertificate.issue_date)} />
                <DetailTile label="Program" value={selectedCertificate.program_name || 'N/A'} />
                <DetailTile label="Major" value={selectedCertificate.major || 'N/A'} />
                <DetailTile label="CGPA" value={selectedCertificate.cgpa || 'N/A'} />
                <DetailTile label="Registration No" value={selectedCertificate.registration_no || 'N/A'} />
              </div>
            </div>

            {/* Verification Section */}
            <div className="flex flex-col sm:flex-row gap-6 items-center sm:items-stretch rounded-2xl border border-gray-200 p-5 dark:border-gray-800 bg-white dark:bg-gray-900/40">
              <div className="flex-1 space-y-4 w-full">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Verification Link</h3>
                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    Use this link or the QR code to verify this certificate's authenticity.
                  </p>
                  <div className="mt-3 rounded-lg bg-gray-50 dark:bg-gray-800/80 p-3 border border-gray-100 dark:border-gray-700 break-all text-sm font-mono text-gray-800 dark:text-gray-200">
                    {getVerificationUrl(selectedCertificate)}
                  </div>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-1 whitespace-nowrap">
                  <Button
                    size="sm"
                    onClick={() => handleCopyVerificationLink(selectedCertificate)}
                    className="shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="mr-1.5 h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 h-3.5 w-3.5" />
                        Copy Share Link
                      </>
                    )}
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handlePreviewPdf(selectedCertificate)}
                    disabled={downloadingId === selectedCertificate.id}
                    className="shrink-0"
                  >
                    <Eye className="mr-1.5 h-3.5 w-3.5" />
                    Preview PDF
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleDownloadPdf(selectedCertificate)}
                    disabled={downloadingId === selectedCertificate.id}
                    className="shrink-0"
                  >
                    {downloadingId === selectedCertificate.id ? (
                      <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Download className="mr-1.5 h-3.5 w-3.5" />
                    )}
                    Download PDF
                  </Button>
                </div>
              </div>
              
              <div className="shrink-0 flex flex-col items-center justify-center rounded-xl border border-gray-200 bg-white p-3 shadow-sm dark:border-gray-700">
                <QRCodeSVG
                  value={getVerificationUrl(selectedCertificate)}
                  size={120}
                  level="H"
                  includeMargin={true}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
                <p className="mt-2 text-[10px] font-semibold uppercase tracking-wider text-gray-500">Scan to verify</p>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}

function DetailTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900/60">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">{label}</p>
      <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{value || 'N/A'}</p>
    </div>
  );
}
