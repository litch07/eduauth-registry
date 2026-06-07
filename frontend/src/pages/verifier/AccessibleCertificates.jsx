import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-hot-toast';
import { Download, Eye, CalendarDays, Building2, User2, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
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
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [error, setError] = useState('');
  const [expandedStudents, setExpandedStudents] = useState({});

  const fetchData = async () => {
    try {
      setLoading(true);
      const [accessesRes, requestsRes] = await Promise.all([
        api.get('/verifier/accessible-students'),
        api.get('/verifier/access-requests')
      ]);
      setAccesses(accessesRes.data.accesses || []);
      setPendingRequests(
        (requestsRes.data.requests || []).filter(req => req.status === 'pending')
      );
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Failed to load accessible certificates and requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const toggleStudent = (studentId) => {
    setExpandedStudents(prev => ({
      ...prev,
      [studentId]: !prev[studentId]
    }));
  };

  const handleCancelRequest = async (requestId) => {
    setActionLoading(`cancel-${requestId}`);
    try {
      await api.delete(`/verifier/access-requests/${requestId}`);
      toast.success('Access request cancelled.');
      setPendingRequests(prev => prev.filter(req => req.id !== requestId));
    } catch (requestError) {
      toast.error(requestError.response?.data?.message || 'Failed to cancel request.');
    } finally {
      setActionLoading(null);
    }
  };

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

  const hasNoData = accesses.length === 0 && pendingRequests.length === 0;

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Accessible Certificates</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Certificates you can access</h1>
        </div>

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        )}

        {hasNoData && !error && (
          <EmptyState
            title="No accessible students"
            description="You don't have access to any student certificates yet, and there are no pending requests."
            icon={<User2 className="h-8 w-8 text-gray-400" />}
          />
        )}

        {pendingRequests.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pending Requests</h2>
            <div className="space-y-4">
              {pendingRequests.map(request => (
                <Card key={request.id} className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-gray-200/80 shadow-sm dark:border-gray-700">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <User2 className="h-4 w-4 text-primary-600" />
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {request.student?.full_name || request.student?.user?.name || 'Unknown Student'}
                      </h3>
                      {request.student?.student_id && (
                        <Badge variant="secondary">{request.student.student_id}</Badge>
                      )}
                    </div>
                    <p className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Clock className="h-4 w-4" />
                      Requested on {formatDate(request.created_at)}
                    </p>
                  </div>
                  <div>
                    <Button
                      variant="danger"
                      onClick={() => handleCancelRequest(request.id)}
                      disabled={actionLoading === `cancel-${request.id}`}
                    >
                      {actionLoading === `cancel-${request.id}` ? 'Cancelling...' : 'Cancel Request'}
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {accesses.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Accessible Students</h2>
            <div className="space-y-6">
              {accesses.map((access) => {
                const isExpired = !access.is_active || new Date(access.expires_at) < new Date();
                const isExpanded = expandedStudents[access.id];

                return (
                  <Card key={access.id} className={`space-y-0 border shadow-sm transition-colors ${isExpired ? 'border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-gray-900/50' : 'border-gray-200/80 dark:border-gray-700'}`}>
                    <div 
                      className="flex cursor-pointer flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-4"
                      onClick={() => toggleStudent(access.id)}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Building2 className={`h-4 w-4 ${isExpired ? 'text-gray-400' : 'text-primary-600'}`} />
                          <h2 className={`text-lg font-semibold ${isExpired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
                            {access.student_name || 'Unknown student'}
                          </h2>
                          {access.student_identifier && (
                            <Badge variant="secondary">{access.student_identifier}</Badge>
                          )}
                        </div>
                        <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <CalendarDays className="h-4 w-4 text-gray-400" />
                          Access {isExpired ? 'expired on' : 'expires on'} {formatDate(access.expires_at)}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant={isExpired ? 'default' : 'success'}>
                          {isExpired ? 'Expired' : 'Active'}
                        </Badge>
                        <button className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                          {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="space-y-3 p-4 border-t border-gray-100 dark:border-gray-800">
                        {access.certificates?.length > 0 ? (
                          access.certificates.map((certificate) => (
                            <div
                              key={certificate.id}
                              className={`rounded-xl border p-4 ${isExpired ? 'border-gray-200 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50' : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'}`}
                            >
                              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                                <div className="space-y-1">
                                  <p className={`font-semibold ${isExpired ? 'text-gray-500 dark:text-gray-400' : 'text-gray-900 dark:text-white'}`}>
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

                                {!isExpired && (
                                  <div className="flex flex-wrap gap-3">
                                    <Button
                                      variant="secondary"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleViewPdf(certificate);
                                      }}
                                      disabled={!!actionLoading || !!certificate.revoked_at}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      {actionLoading === `view-${certificate.id}` ? 'Opening...' : 'View PDF'}
                                    </Button>
                                    <Button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDownloadPdf(certificate);
                                      }}
                                      disabled={!!actionLoading || !!certificate.revoked_at}
                                    >
                                      <Download className="mr-2 h-4 w-4" />
                                      {actionLoading === `download-${certificate.id}` ? 'Downloading...' : 'Download PDF'}
                                    </Button>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="rounded-xl border border-dashed border-gray-200 px-4 py-6 text-sm text-gray-500 dark:border-gray-700 dark:text-gray-400 text-center">
                            No certificates are available for this student yet.
                          </div>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
