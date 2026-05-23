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
import api from '../../services/api';
import { downloadCertificatePDF, previewCertificatePDF } from '../../services/certificateService';
import { FileText, Eye, Download, Share2, Calendar, Building, AlertCircle, Lock, Unlock, Loader2, X, Copy, RefreshCw, Search } from 'lucide-react';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloadingId, setDownloadingId] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState(searchParams.get('filter') || 'all');

  const [searchQuery, setSearchQuery] = useState('');

  const filteredCertificates = certificates.filter((cert) => {
    // Apply visibility filter
    if (filter === 'public' && !cert.is_public) return false;
    if (filter === 'private' && cert.is_public) return false;

    // Apply search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchesSearch = 
        (cert.institution_name && cert.institution_name.toLowerCase().includes(q)) ||
        (cert.serial && cert.serial.toLowerCase().includes(q)) ||
        (cert.degree_title && cert.degree_title.toLowerCase().includes(q)) ||
        (cert.certificate_name && cert.certificate_name.toLowerCase().includes(q));
      
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
        setCertificates(data.certificates || []);
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

  useEffect(() => {
    const filterParam = searchParams.get('filter');
    if (filterParam && ['all', 'public', 'private'].includes(filterParam)) {
      setFilter(filterParam);
    }
  }, [searchParams]);

  const handleDownloadPdf = async (certificate) => {
    try {
      setDownloadingId(certificate.id);
      await downloadCertificatePDF(certificate.id, certificate.serial);
      toast.success('Certificate downloaded successfully');
    } catch (err) {
      console.error('Failed to download certificate:', err);
      toast.error(err?.response?.data?.error || err.message || 'Failed to download certificate');
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
      toast.error(err?.message || 'Failed to preview certificate');
    }
  };

  const getVerificationUrl = (certificate) => certificate.share_link || `${window.location.origin}/verify?serial=${encodeURIComponent(certificate.serial)}`;

  const handleCopyVerificationLink = async (certificate) => {
    try {
      await navigator.clipboard.writeText(getVerificationUrl(certificate));
      toast.success('Share link copied to clipboard');
    } catch (err) {
      console.error('Failed to copy share link:', err);
      toast.error('Failed to copy share link');
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
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Certificates</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Your Certificate Library</h1>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="primary">
              {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
            </Badge>
            <Button variant="outline" onClick={fetchCertificates} loading={loading} className="!p-2" aria-label="Refresh certificates">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} retry={fetchCertificates} />
        ) : certificates.length === 0 ? (
          <EmptyState
            title="No Certificates Found"
            message="You don't have any certificates issued yet. Check back later!"
            icon={FileText}
          />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1 max-w-xl">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="h-4 w-4 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search by university, sequence, or type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-3 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => { setFilter('all'); setSearchParams({}); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition ${filter === 'all' ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 border border-transparent'}`}
                >
                  All
                </button>
                <button
                  onClick={() => { setFilter('public'); setSearchParams({ filter: 'public' }); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition border ${filter === 'public' ? 'bg-green-600 text-white border-green-600 dark:bg-green-600' : 'border-green-200 bg-green-50 text-green-700 hover:bg-green-100 dark:border-green-900/30 dark:bg-green-900/10 dark:text-green-400 dark:hover:bg-green-900/30'}`}
                >
                  Public
                </button>
                <button
                  onClick={() => { setFilter('private'); setSearchParams({ filter: 'private' }); }}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition border ${filter === 'private' ? 'bg-yellow-600 text-white border-yellow-600 dark:bg-yellow-600' : 'border-yellow-200 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-900/30 dark:bg-yellow-900/10 dark:text-yellow-400 dark:hover:bg-yellow-900/30'}`}
                >
                  Private
                </button>
              </div>
            </div>

            {filteredCertificates.length === 0 ? (
              <EmptyState
                title="No Certificates Found"
                message={searchQuery.trim() ? `No certificates match your search "${searchQuery}".` : `You don't have any ${filter} certificates.`}
                icon={FileText}
              />
            ) : (
              <div className="grid grid-cols-1 gap-6">
                {filteredCertificates.map((certificate) => (
                  <Card key={certificate.id} className="hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary-100 dark:bg-primary-900 p-3 rounded-lg">
                          <FileText className="w-8 h-8 text-primary-600 dark:text-primary-400" />
                        </div>

                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            {certificate.degree_title}
                          </h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Serial: <span className="font-mono font-medium">{certificate.serial}</span>
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-end">
                        <Badge
                          variant={certificate.is_public ? 'warning' : 'success'}
                          className="transition-colors duration-300"
                        >
                          {certificate.is_public ? 'Public' : 'Private'}
                        </Badge>
                        {certificate.revoked_at && <Badge variant="danger">Revoked</Badge>}
                      </div>
                    </div>

                    {certificate.revoked_at && (
                      <div className="my-4 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-800 dark:bg-red-900/20">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-red-800 dark:text-red-300">
                              This certificate was revoked on {new Date(certificate.revoked_at).toLocaleDateString()}.
                            </h3>
                            {certificate.revocation_reason && (
                              <div className="mt-2 text-sm text-red-700 dark:text-red-400">
                                <p>Reason: {certificate.revocation_reason}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {certificate.institution_name && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Building className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>{certificate.institution_name}</span>
                        </div>
                      )}

                      {certificate.issue_date && (
                        <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                          <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span>Issued: {new Date(certificate.issue_date).toLocaleDateString()}</span>
                        </div>
                      )}

                      {certificate.program_name && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Program:</strong> {certificate.program_name}
                        </div>
                      )}

                      {certificate.major && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Major:</strong> {certificate.major}
                        </div>
                      )}

                      {certificate.cgpa && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>CGPA:</strong> {certificate.cgpa}
                        </div>
                      )}

                      {certificate.registration_no && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          <strong>Registration:</strong> {certificate.registration_no}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <Button
                        variant="outline"
                        onClick={() => handlePreviewPdf(certificate)}
                        disabled={downloadingId === certificate.id}
                        className="!px-3 !py-1.5 min-h-[44px]"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Preview
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => openCertificateDetails(certificate)}
                        className="!px-3 !py-1.5 min-h-[44px]"
                      >
                        <FileText className="w-4 h-4 mr-1" />
                        Details
                      </Button>

                      <Button
                        variant="outline"
                        onClick={() => handleDownloadPdf(certificate)}
                        disabled={downloadingId === certificate.id}
                        className="!px-3 !py-1.5 min-h-[44px]"
                      >
                        {downloadingId === certificate.id ? (
                          <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                        ) : (
                          <Download className="w-4 h-4 mr-1" />
                        )}
                        {downloadingId === certificate.id ? 'Generating...' : 'Download'}
                      </Button>

                      {certificate.is_public && (
                        <div className="flex items-center text-sm text-green-600 dark:text-green-400 px-2 min-h-[44px]">
                          <Share2 className="w-4 h-4 mr-1" />
                          Sharable
                        </div>
                      )}

                      <Button
                        variant="outline"
                        onClick={() => toggleVisibility(certificate.id)}
                        className={`ml-auto !px-3 !py-1.5 min-h-[44px] ${certificate.is_public
                          ? '!text-yellow-700 !border-yellow-200 !bg-yellow-50 hover:!bg-yellow-100 dark:!text-yellow-400 dark:!border-yellow-800 dark:!bg-yellow-900/20'
                          : '!text-green-700 !border-green-200 !bg-green-50 hover:!bg-green-100 dark:!text-green-400 dark:!border-green-800 dark:!bg-green-900/20'
                          }`}
                      >
                        {certificate.is_public ? (
                          <><Lock className="w-4 h-4 mr-1" /> Make Private</>
                        ) : (
                          <><Unlock className="w-4 h-4 mr-1" /> Make Public</>
                        )}
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
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
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
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
                <p className="mt-1 font-mono text-lg font-semibold text-gray-900 dark:text-white">{selectedCertificate.serial}</p>
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">
                  Use the QR code to open the public verification page for this certificate.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <DetailTile label="Institution" value={selectedCertificate.institution_name} />
                <DetailTile label="Issue Date" value={selectedCertificate.issue_date ? new Date(selectedCertificate.issue_date).toLocaleDateString() : 'N/A'} />
                <DetailTile label="Program" value={selectedCertificate.program_name || 'N/A'} />
                <DetailTile label="Major" value={selectedCertificate.major || 'N/A'} />
                <DetailTile label="CGPA" value={selectedCertificate.cgpa || 'N/A'} />
                <DetailTile label="Registration No" value={selectedCertificate.registration_no || 'N/A'} />
              </div>

              <div className="rounded-2xl border border-gray-200 p-5 dark:border-gray-800">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-gray-500 dark:text-gray-400">Verification Link</h3>
                <p className="mt-2 break-all text-sm text-gray-700 dark:text-gray-300">{getVerificationUrl(selectedCertificate)}</p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button
                    onClick={() => handleCopyVerificationLink(selectedCertificate)}
                  >
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Share Link
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => handlePreviewPdf(selectedCertificate)}
                    disabled={downloadingId === selectedCertificate.id}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Preview PDF
                  </Button>
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center rounded-3xl border border-gray-200 bg-white p-6 text-center shadow-sm dark:border-gray-800 dark:bg-gray-950/40">
              <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-lg dark:border-gray-800">
                <QRCodeSVG
                  value={getVerificationUrl(selectedCertificate)}
                  size={220}
                  level="H"
                  includeMargin={true}
                  fgColor="#0f172a"
                  bgColor="#ffffff"
                />
              </div>
              <p className="mt-4 text-sm font-semibold text-gray-900 dark:text-white">Scan to verify</p>
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
