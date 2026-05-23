import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Eye, CalendarDays, Building2, User2 } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

function formatDate(value) {
  if (!value) {
    return 'N/A';
  }

  return new Date(value).toLocaleDateString();
}

async function fetchCertificateBlob(id) {
  const response = await api.get(`/certificates/${id}/pdf`, { responseType: 'blob' });
  return response.data;
}

export default function AccessibleCertificates() {
  const [accesses, setAccesses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');

  const fetchAccesses = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/verifier/accessible-students');
      setAccesses(data.accesses || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load accessible certificates.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccesses();
  }, []);

  const activeAccesses = useMemo(() => {
    return accesses.filter((access) => access.is_active && !access.revoked_at && new Date(access.expires_at) > new Date());
  }, [accesses]);

  const handleViewPdf = async (certificate) => {
    setActionLoading(`view-${certificate.id}`);
    try {
      const blob = await fetchCertificateBlob(certificate.id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to open the certificate PDF.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDownloadPdf = async (certificate) => {
    setActionLoading(`download-${certificate.id}`);
    try {
      const blob = await fetchCertificateBlob(certificate.id);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${certificate.serial || 'certificate'}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      setTimeout(() => window.URL.revokeObjectURL(url), 60000);
    } catch (requestError) {
      toast.error(requestError.response?.data?.error || 'Unable to download the certificate PDF.');
    } finally {
      setActionLoading(null);
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
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Accessible Certificates</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Certificates you can access</h1>
        </div>

        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {activeAccesses.length > 0 ? (
          <div className="space-y-6">
            {activeAccesses.map((access) => (
              <Card key={access.id} className="space-y-4 border border-gray-200/80 shadow-sm dark:border-gray-700">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-primary-600" />
                      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {access.student_name || 'Unknown student'}
                      </h2>
                    </div>
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <User2 className="h-4 w-4 text-gray-400" />
                      {access.student_email || 'No email'}
                    </p>
                    <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      Access expires on {formatDate(access.expires_at)}
                    </p>
                  </div>
                  <Badge variant="success">Active access</Badge>
                </div>

                <div className="space-y-3">
                  {access.certificates?.length > 0 ? (
                    access.certificates.map((certificate) => (
                      <div
                        key={certificate.id}
                        className="rounded-xl border border-gray-200 p-4 dark:border-gray-700"
                      >
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                          <div className="space-y-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {certificate.certificate_name || certificate.degree_title}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Serial: <span className="font-mono">{certificate.serial}</span>
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              Issued: {formatDate(certificate.issue_date)}
                            </p>
                            {certificate.revoked_at ? (
                              <Badge variant="danger">Revoked</Badge>
                            ) : null}
                          </div>

                          <div className="flex flex-wrap gap-3">
                            <Button
                              variant="secondary"
                              onClick={() => handleViewPdf(certificate)}
                              disabled={!!actionLoading || !!certificate.revoked_at}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              {actionLoading === `view-${certificate.id}` ? 'Opening...' : 'View PDF'}
                            </Button>
                            <Button
                              onClick={() => handleDownloadPdf(certificate)}
                              disabled={!!actionLoading || !!certificate.revoked_at}
                            >
                              <Download className="mr-2 h-4 w-4" />
                              {actionLoading === `download-${certificate.id}` ? 'Downloading...' : 'Download PDF'}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400">
                      No certificates are available for this student yet.
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <div className="py-10 text-center">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">No active access</h3>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Once a student approves your request, their accessible certificates will show up here.
              </p>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
