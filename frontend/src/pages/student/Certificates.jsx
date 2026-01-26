import React, { useEffect, useState } from 'react';
import { Award, Copy, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const StudentCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.get('/student/certificates');
        setCertificates(response.data.certificates || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load certificates.');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const handleCopySerial = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
      setSuccessMessage(`Serial ${serial} copied to clipboard.`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Failed to copy serial to clipboard.');
      setTimeout(() => setError(null), 3000);
      console.error('Error:', err);
    }
  };

  const handleToggleSharing = async (certificateId) => {
    try {
      const response = await api.put(`/student/certificates/${certificateId}/toggle-sharing`);
      const newStatus = response.data.isPubliclyShareable;
      setCertificates((prev) =>
        prev.map((cert) =>
          cert.id === certificateId ? { ...cert, isPubliclyShareable: newStatus } : cert
        )
      );
      setSuccessMessage(
        newStatus ? 'Certificate is now publicly shareable.' : 'Certificate is now private.'
      );
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update sharing status.');
      setTimeout(() => setError(null), 3000);
      console.error('Error:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl p-6 space-y-6">
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-green-700 dark:text-green-200">
            <CheckCircle className="h-5 w-5 mt-0.5" />
            <span className="text-sm">{successMessage}</span>
          </div>
        )}

        {loading ? (
          <LoadingSpinner message="Loading certificates..." />
        ) : certificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title="No certificates yet"
            description="Once your university issues certificates, they will appear here."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert.id}
                className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700"
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Award className="h-5 w-5" />
                  </div>
                  <span
                    className={`rounded-full px-2 py-1 text-xs font-semibold ${
                      cert.isPubliclyShareable
                        ? 'bg-green-100 text-green-700'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {cert.isPubliclyShareable ? 'Public' : 'Private'}
                  </span>
                </div>

                <h3 className="mb-1 font-semibold text-slate-900 dark:text-white line-clamp-2">
                  {cert.certificateName}
                </h3>
                <p className="mb-2 text-xs text-slate-600 dark:text-gray-300">
                  {cert.institutionName || 'N/A'}
                </p>

                <div className="mb-3 flex items-center gap-2 text-xs">
                  <span className="rounded bg-slate-200 px-2 py-1 font-mono font-semibold text-slate-800">
                    {cert.serial}
                  </span>
                  <span className="text-slate-500 dark:text-gray-300">{cert.issueDate}</span>
                </div>

                <div className="mb-3 space-y-1 text-xs text-slate-600 dark:text-gray-300">
                  <p><span className="font-semibold">Roll:</span> {cert.rollNumber || 'N/A'}</p>
                  <p><span className="font-semibold">Session:</span> {cert.session || 'N/A'}</p>
                  <p><span className="font-semibold">Department:</span> {cert.department || 'N/A'}</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleCopySerial(cert.serial)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                    title="Copy Serial"
                  >
                    <Copy className="h-3 w-3" />
                    Copy
                  </button>
                  <button
                    onClick={() => handleToggleSharing(cert.id)}
                    className="btn-secondary flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs"
                    title="Toggle Sharing"
                  >
                    {cert.isPubliclyShareable ? (
                      <>
                        <EyeOff className="h-3 w-3" />
                        Private
                      </>
                    ) : (
                      <>
                        <Eye className="h-3 w-3" />
                        Public
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default StudentCertificates;
