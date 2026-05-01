import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const { data } = await api.get('/student/certificates');
        setCertificates(data.certificates || []);
      } catch (error) {
        console.error('Failed to fetch certificates:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const downloadPdf = async (certificateId) => {
    try {
      const response = await api.get(`/certificates/${certificateId}/pdf`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `certificate-${certificateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to download certificate:', error);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Certificates</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Your certificate library</h1>
        </div>

        {loading ? (
          <div className="flex min-h-[40vh] items-center justify-center"><LoadingSpinner /></div>
        ) : (
          <div className="grid gap-4">
            {certificates.map((certificate) => (
              <Card key={certificate.id} className="space-y-4">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{certificate.degree_title}</h2>
                      <Badge variant={certificate.is_public ? 'success' : 'warning'}>{certificate.is_public ? 'Public' : 'Private'}</Badge>
                      {certificate.revoked_at ? <Badge variant="danger">Revoked</Badge> : null}
                    </div>
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Serial {certificate.serial}</p>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="secondary" onClick={() => window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000/api'}/certificates/${certificate.id}/pdf`, '_blank')}>
                      View PDF
                    </Button>
                    <Button onClick={() => downloadPdf(certificate.id)}>Download</Button>
                  </div>
                </div>
              </Card>
            ))}
            {certificates.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No certificates available.</p> : null}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
