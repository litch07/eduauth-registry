import { useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import ErrorMessage from '../../components/shared/ErrorMessage';
import EmptyState from '../../components/shared/EmptyState';
import Modal from '../../components/shared/Modal';
import api from '../../services/api';
import {
  FileText, ShieldX, RefreshCw, Eye, Search, X, Filter,
  Hash, Award, Calendar, User, Building2, ShieldCheck, Clock,
  CheckCircle, XCircle, ExternalLink,
} from 'lucide-react';
import RevocationModal from '../../components/shared/RevocationModal';

function InfoRow({ icon: Icon, label, value }) {
  if (value === undefined || value === null || value === '') return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
      <span className="w-36 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white break-all">{String(value)}</span>
    </div>
  );
}

export default function AdminCertificates() {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Details modal
  const [certDetail, setCertDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    api.get('/admin/certificates')
      .then(response => {
        setCertificates(response.data.certificates || []);
        setError(null);
      })
      .catch(err => {
        setError(err.response?.data?.error || 'Failed to fetch certificates.');
        toast.error('Failed to load certificates');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    let result = [...certificates];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter((c) =>
        c.serial?.toLowerCase().includes(q) ||
        c.certificate_name?.toLowerCase().includes(q) ||
        c.student_name?.toLowerCase().includes(q) ||
        c.institution_name?.toLowerCase().includes(q)
      );
    }
    if (statusFilter === 'active') {
      result = result.filter((c) => !c.revoked_at);
    } else if (statusFilter === 'revoked') {
      result = result.filter((c) => c.revoked_at);
    }
    setFiltered(result);
  }, [certificates, searchQuery, statusFilter]);

  const handleRevokeClick = (certificate) => {
    setSelectedCertificate(certificate);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedCertificate(null);
  };

  const handleRevocation = (reason) => {
    if (!selectedCertificate) return;

    api.post(`/admin/certificates/${selectedCertificate.id}/revoke`, { reason })
      .then(() => {
        toast.success('Certificate revoked successfully');
        setCertificates(certs => certs.map(c => 
          c.id === selectedCertificate.id ? { ...c, revoked_at: new Date().toISOString(), revocation_reason: reason } : c
        ));
        handleModalClose();
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to revoke certificate.');
      });
  };

  const openDetails = async (certId) => {
    setDetailLoading(true);
    try {
      const { data } = await api.get(`/admin/certificates/${certId}/details`);
      setCertDetail(data.certificate);
    } catch {
      toast.error('Failed to load certificate details.');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Admin</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl flex items-center gap-3">
              <FileText className="h-7 w-7 text-primary-600" />
              All Certificates
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : `${filtered.length} of ${certificates.length} certificates`}
            </p>
          </div>
          <Button variant="secondary" onClick={fetchData} loading={loading} className="!p-2.5" aria-label="Refresh certificates">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* Filter bar */}
        <Card>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by serial, name, student, institution..."
                  className="w-full rounded-xl border border-gray-300 bg-white pl-10 pr-10 py-2.5 text-sm text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
                {searchQuery && (
                  <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="revoked">Revoked</option>
            </select>
          </div>
        </Card>
        
        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : error ? (
          <ErrorMessage message={error} retry={fetchData} />
        ) : filtered.length === 0 ? (
          <EmptyState message={searchQuery || statusFilter !== 'all' ? 'No certificates match your filters.' : 'No certificates found in the registry.'} />
        ) : (
          <Card>
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Serial', 'Certificate', 'Student', 'University', 'Issue Date', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {filtered.map((cert) => (
                    <tr key={cert.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="py-3 px-3 font-mono text-xs text-gray-900 dark:text-white">{cert.serial}</td>
                      <td className="py-3 px-3 text-xs text-gray-700 dark:text-gray-300 max-w-[180px] truncate">{cert.certificate_name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">{cert.student_name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400">{cert.institution_name}</td>
                      <td className="py-3 px-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                        {cert.issue_date ? new Date(cert.issue_date).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3 px-3">
                        {cert.revoked_at ? (
                          <Badge variant="error">Revoked</Badge>
                        ) : (
                          <Badge variant="success">Active</Badge>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openDetails(cert.id)}
                            className="inline-flex items-center gap-1 rounded-lg border border-gray-200 dark:border-gray-700 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 transition"
                          >
                            <Eye className="h-3 w-3" /> Details
                          </button>
                          {!cert.revoked_at && (
                            <button
                              onClick={() => handleRevokeClick(cert)}
                              className="inline-flex items-center gap-1 rounded-lg border border-red-200 dark:border-red-800 px-2.5 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                            >
                              <ShieldX className="h-3 w-3" /> Revoke
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
      {isModalOpen && (
        <RevocationModal
          certificate={selectedCertificate}
          onClose={handleModalClose}
          onConfirm={handleRevocation}
        />
      )}

      {/* Certificate Details Modal */}
      <Modal open={!!certDetail} onClose={() => setCertDetail(null)} title="Certificate Details" size="lg">
        {detailLoading ? (
          <div className="flex justify-center py-10"><LoadingSpinner /></div>
        ) : certDetail ? (
          <div className="space-y-5">
            {/* Status banner */}
            <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
              certDetail.revoked_at
                ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
            }`}>
              {certDetail.revoked_at ? (
                <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              ) : (
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              )}
              <div>
                <p className={`text-sm font-semibold ${certDetail.revoked_at ? 'text-red-800 dark:text-red-300' : 'text-green-800 dark:text-green-300'}`}>
                  {certDetail.revoked_at ? 'Certificate Revoked' : 'Certificate Active'}
                </p>
                {certDetail.revoked_at && certDetail.revocation_reason && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Reason: {certDetail.revocation_reason}</p>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.4fr_0.6fr]">
              {/* Certificate info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Certificate Information</h3>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                  <InfoRow icon={Hash} label="Serial Number" value={certDetail.serial} />
                  <InfoRow icon={Award} label="Certificate" value={certDetail.certificate_name} />
                  <InfoRow icon={Award} label="Level" value={certDetail.certificate_level} />
                  <InfoRow icon={Award} label="Department" value={certDetail.department} />
                  <InfoRow icon={Award} label="Major" value={certDetail.major} />
                  <InfoRow icon={Award} label="Session" value={certDetail.session} />
                  <InfoRow icon={Award} label="CGPA" value={certDetail.cgpa} />
                  <InfoRow icon={Award} label="Degree Class" value={certDetail.degree_class} />
                  <InfoRow icon={Calendar} label="Issue Date" value={certDetail.issue_date} />
                  <InfoRow icon={Calendar} label="Convocation" value={certDetail.convocation_date} />
                  <InfoRow icon={User} label="Authority" value={certDetail.authority_name ? `${certDetail.authority_name} (${certDetail.authority_title})` : null} />
                </div>
              </div>

              {/* Student + Institution + Verification */}
              <div className="space-y-5">
                {certDetail.student && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Student</h3>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                      <InfoRow icon={User} label="Name" value={certDetail.student.full_name} />
                      <InfoRow icon={Hash} label="Student ID" value={certDetail.student.student_id} />
                      <InfoRow icon={Calendar} label="DOB" value={certDetail.student.dob_masked} />
                    </div>
                    {certDetail.student.user_id && (
                      <button
                        onClick={() => { setCertDetail(null); navigate(`/admin/users/${certDetail.student.user_id}`); }}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-3 w-3" /> View Student Profile
                      </button>
                    )}
                  </div>
                )}

                {certDetail.institution && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Institution</h3>
                    <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                      <InfoRow icon={Building2} label="Name" value={certDetail.institution.name} />
                    </div>
                    {certDetail.institution.user_id && (
                      <button
                        onClick={() => { setCertDetail(null); navigate(`/admin/users/${certDetail.institution.user_id}`); }}
                        className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary-600 hover:text-primary-700"
                      >
                        <ExternalLink className="h-3 w-3" /> View Institution Profile
                      </button>
                    )}
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Verification</h3>
                  <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                    <InfoRow icon={ShieldCheck} label="Times Verified" value={certDetail.verification_count} />
                    <InfoRow icon={Clock} label="Last Verified" value={certDetail.last_verified_at ? new Date(certDetail.last_verified_at).toLocaleString() : 'Never'} />
                    <InfoRow icon={User} label="Issued By" value={certDetail.issued_by_name} />
                    <InfoRow icon={Eye} label="Public" value={certDetail.is_publicly_shareable ? 'Yes' : 'No'} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </DashboardLayout>
  );
}
