import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { FileText, Eye, Download, Share2, Calendar, Building, AlertCircle, Lock, Unlock } from 'lucide-react';

export default function StudentCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
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
    } catch (err) {
      console.error('Failed to download certificate:', err);
      alert('Failed to download certificate');
    }
  };

  const viewPdf = (certificateId) => {
    window.open(`${import.meta.env.VITE_API_URL || 'http://localhost:8000'}/api/certificates/${certificateId}/pdf`, '_blank');
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
      }
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
      alert('Failed to update certificate visibility');
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Certificates</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Your Certificate Library</h1>
          </div>
          <Badge variant="primary">
            {certificates.length} {certificates.length === 1 ? 'Certificate' : 'Certificates'}
          </Badge>
        </div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg flex items-center">
            <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
            {error}
          </div>
        )}

        {!error && certificates.length === 0 && (
          <Card>
            <div className="text-center py-12">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
                No Certificates Yet
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                You don't have any certificates issued yet. Check back later!
              </p>
            </div>
          </Card>
        )}

        <div className="grid grid-cols-1 gap-6">
          {certificates.map((certificate) => (
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
                  <Badge variant={certificate.is_public ? 'success' : 'warning'}>
                    {certificate.is_public ? 'Public' : 'Private'}
                  </Badge>
                  {certificate.revoked_at && <Badge variant="danger">Revoked</Badge>}
                </div>
              </div>

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

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button 
                  onClick={() => viewPdf(certificate.id)}
                  className="flex items-center text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  <Eye className="w-4 h-4 mr-1" />
                  View PDF
                </button>
                
                <button 
                  onClick={() => downloadPdf(certificate.id)}
                  className="flex items-center text-sm text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Download
                </button>
                
                {certificate.is_public && (
                  <button className="flex items-center text-sm text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors">
                    <Share2 className="w-4 h-4 mr-1" />
                    Sharable
                  </button>
                )}

                <button
                  onClick={() => toggleVisibility(certificate.id)}
                  className={`ml-auto flex items-center text-sm font-medium px-3 py-1.5 rounded-lg transition-colors ${
                    certificate.is_public
                      ? 'text-yellow-700 bg-yellow-50 hover:bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20 dark:hover:bg-yellow-900/40'
                      : 'text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-400 dark:bg-green-900/20 dark:hover:bg-green-900/40'
                  }`}
                >
                  {certificate.is_public ? (
                    <><Lock className="w-4 h-4 mr-1" /> Make Private</>
                  ) : (
                    <><Unlock className="w-4 h-4 mr-1" /> Make Public</>
                  )}
                </button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
