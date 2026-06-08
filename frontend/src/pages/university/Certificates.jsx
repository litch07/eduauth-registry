import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { FileText, AlertCircle, ShieldX } from 'lucide-react';
import RevocationModal from '../../components/shared/RevocationModal';

export default function UniversityCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    api.get('/university/certificates')
      .then(response => {
        setCertificates(response.data.certificates);
        setLoading(false);
      })
      .catch(err => {
        setError('Failed to fetch certificates.');
        setLoading(false);
      });
  }, []);

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

    api.post(`/university/certificates/${selectedCertificate.id}/revoke`, { reason })
      .then(() => {
        setCertificates(certs => certs.map(c => 
          c.id === selectedCertificate.id ? { ...c, revoked_at: new Date().toISOString(), revocation_reason: reason } : c
        ));
        handleModalClose();
      })
      .catch(err => {
        toast.error(err.response?.data?.error || 'Failed to revoke certificate.');
      });
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
        <div className="grid grid-cols-1 gap-6">
          {certificates.map(certificate => (
            <Card key={certificate.id}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">{certificate.certificate_name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Serial: {certificate.serial}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Student: {certificate.student_name}</p>
                    {certificate.issued_name && (
                      <p className="mt-1 text-xs text-gray-400 dark:text-gray-500 italic">
                        Original Issued Name (Legal Record): {certificate.issued_name}
                      </p>
                    )}
                  </div>
                  {certificate.revoked_at ? (
                    <Badge variant="danger">REVOKED</Badge>
                  ) : (
                    <Button variant="danger" onClick={() => handleRevokeClick(certificate)}>
                      <ShieldX className="w-4 h-4 mr-2" />
                      Revoke
                    </Button>
                  )}
                </div>
                {certificate.revoked_at && (
                  <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-3 dark:border-red-800 dark:bg-red-900/20">
                    <p className="text-sm text-red-700 dark:text-red-300">
                      Revoked on {new Date(certificate.revoked_at).toLocaleDateString()}
                    </p>
                    {certificate.revocation_reason && (
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                        Reason: {certificate.revocation_reason}
                      </p>
                    )}
                  </div>
                )}
            </Card>
          ))}
        </div>
      </div>
      {isModalOpen && (
        <RevocationModal
          certificate={selectedCertificate}
          onClose={handleModalClose}
          onConfirm={handleRevocation}
        />
      )}
    </DashboardLayout>
  );
}
