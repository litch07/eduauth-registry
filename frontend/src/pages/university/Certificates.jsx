import React, { useEffect, useMemo, useState } from 'react';
import { Award, Copy, Search, XCircle } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';
import api from '../../services/api';

const UniversityCertificates = () => {
  const location = useLocation();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        setError(null);
        const response = await api.get('/university/certificates');
        setCertificates(response.data.certificates || []);
      } catch (err) {
        const message = err.response?.data?.error || 'Failed to load certificates.';
        setError(message);
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCertificates();
  }, []);

  const showTodayOnly = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('today') === '1';
  }, [location.search]);

  const formatDateKey = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return `${day}/${month}/${year}`;
  };

  const filteredCertificates = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    let list = certificates;

    if (showTodayOnly) {
      const todayKey = formatDateKey(new Date());
      list = list.filter((cert) => cert.issueDate === todayKey);
    }

    if (!query) {
      return list;
    }

    return list.filter((cert) => {
      const serial = cert.serial?.toLowerCase() || '';
      const studentName = cert.studentName?.toLowerCase() || '';
      const roll = cert.rollNumber?.toLowerCase() || '';
      const studentId = cert.studentSystemId?.toLowerCase() || '';
      const name = cert.certificateName?.toLowerCase() || '';
      const department = cert.department?.toLowerCase() || '';
      const session = cert.session?.toLowerCase() || '';
      return (
        serial.includes(query) ||
        studentName.includes(query) ||
        roll.includes(query) ||
        studentId.includes(query) ||
        name.includes(query) ||
        department.includes(query) ||
        session.includes(query)
      );
    });
  }, [certificates, searchQuery, showTodayOnly]);

  const handleCopySerial = async (serial) => {
    try {
      await navigator.clipboard.writeText(serial);
    } catch (err) {
      setError('Failed to copy serial to clipboard.');
      setTimeout(() => setError(null), 3000);
      console.error('Error:', err);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issued Certificates</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Review and manage all certificates issued by your institution.
          </p>
        </div>

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

        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 dark:bg-green-900/30 text-green-600">
                <Award className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{certificates.length}</p>
                <p className="text-sm text-slate-600 dark:text-gray-300">Total Certificates Issued</p>
              </div>
            </div>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search by serial, student, roll, or program..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner message="Loading certificates..." />
        ) : filteredCertificates.length === 0 ? (
          <EmptyState
            icon={Award}
            title={searchQuery ? 'No matching certificates' : 'No certificates issued yet'}
            description={
              searchQuery
                ? 'Try adjusting your search terms.'
                : 'Issue your first certificate to see it listed here.'
            }
          />
        ) : (
          <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-slate-200 dark:border-gray-700 text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-gray-300">
                  <tr>
                    <th className="px-5 py-3">Serial</th>
                    <th className="px-5 py-3">Student</th>
                    <th className="px-5 py-3">Roll/ID</th>
                    <th className="px-5 py-3">Program</th>
                    <th className="px-5 py-3">Level</th>
                    <th className="px-5 py-3">Issue Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-gray-700">
                  {filteredCertificates.map((cert) => (
                    <tr key={cert.id} className="hover:bg-slate-50 dark:hover:bg-gray-700">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-primary dark:text-blue-400 font-semibold">
                            {cert.serial}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopySerial(cert.serial)}
                            className="text-slate-500 hover:text-primary"
                            title="Copy serial"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-800 dark:text-gray-200">
                        <div className="font-semibold">{cert.studentName || 'N/A'}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          {cert.studentSystemId || 'N/A'}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-gray-300 font-mono text-xs">
                        {cert.rollNumber || 'N/A'}
                      </td>
                      <td className="px-5 py-4 text-slate-800 dark:text-gray-200">
                        <div className="font-semibold">{cert.certificateName}</div>
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          {cert.department || 'N/A'}{cert.session ? ` • ${cert.session}` : ''}
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700 dark:text-gray-300">
                        {cert.certificateLevel}
                      </td>
                      <td className="px-5 py-4 text-slate-600 dark:text-gray-300">
                        {cert.issueDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default UniversityCertificates;
