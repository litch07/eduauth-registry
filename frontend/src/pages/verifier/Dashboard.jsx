import { useState, useEffect } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Search, CheckCircle, XCircle, FileText, AlertCircle } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function VerifierDashboard() {
  const [stats, setStats] = useState(null);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [validationErrors, setValidationErrors] = useState({});
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const { data } = await api.get('/verifier/dashboard');
      setStats(data.stats);
      setRecentVerifications(data.recent_verifications || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setValidationErrors({});
    setLoading(true);

    try {
      const { data } = await api.post('/verifier/verify', formData);
      setResult(data);
      await fetchDashboard();
    } catch (requestError) {
      const errorData = requestError.response?.data;
      
      if (requestError.response?.status === 422) {
        setValidationErrors(errorData.errors || {});
        setError('Please check your input and try again');
      } else if (requestError.response?.status === 404) {
        setError('Certificate not found. Please check the serial number and try again.');
      } else if (requestError.response?.status === 401) {
        setError('Date of birth does not match our records. Please try again.');
      } else if (requestError.response?.status === 403) {
        setError('This certificate is private and cannot be verified.');
      } else if (requestError.response?.status === 409) {
        setError('This certificate has been revoked and is no longer valid.');
      } else {
        setError(errorData?.message || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFormData({ serial: '', date_of_birth: '' });
    setResult(null);
    setError('');
    setValidationErrors({});
  };

  const updateField = (field) => (event) => {
    const value = field === 'serial' ? event.target.value.toUpperCase() : event.target.value;
    setFormData((current) => ({ ...current, [field]: value }));
    
    if (validationErrors[field]) {
      setValidationErrors((current) => {
        const updated = { ...current };
        delete updated[field];
        return updated;
      });
    }
  };

  if (dashboardLoading) {
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
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Verifier Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={<FileText className="h-5 w-5" />} label="Today" value={stats?.verifications_today || 0} color="blue" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Total" value={stats?.total_verifications || 0} color="primary" />
          <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Successful" value={stats?.successful_verifications || 0} color="green" />
          <StatCard icon={<XCircle className="h-5 w-5" />} label="Failed" value={stats?.failed_verifications || 0} color="red" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Verification Form */}
          <div className="lg:col-span-2">
            <Card className="space-y-6">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Verify Certificate</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Enter certificate details to verify authenticity</p>
              </div>
              
              <form onSubmit={handleVerify} className="space-y-4">
                {error && (
                  <div className="rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-start">
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Certificate Serial Number"
                    placeholder="e.g., BSC-25-000001M"
                    value={formData.serial}
                    onChange={updateField('serial')}
                    error={validationErrors.serial?.[0]}
                    required
                  />
                  <Input
                    type="date"
                    label="Student Date of Birth"
                    value={formData.date_of_birth}
                    onChange={updateField('date_of_birth')}
                    error={validationErrors.date_of_birth?.[0]}
                    required
                  />
                </div>

                <div className="flex gap-3">
                  <Button type="submit" disabled={loading} className="flex-1">
                    <Search className="w-4 h-4 mr-2 inline" />
                    {loading ? 'Verifying...' : 'Verify Certificate'}
                  </Button>
                  {result && (
                    <Button type="button" variant="secondary" onClick={handleReset}>
                      Reset
                    </Button>
                  )}
                </div>
              </form>

              {result && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  {result.verified ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <Badge variant="success">Certificate Verified</Badge>
                      </div>
                      <div className="space-y-1 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                        <ResultRow label="Serial" value={result.certificate.serial} />
                        <ResultRow label="Student" value={result.certificate.student_name} />
                        <ResultRow label="Degree" value={result.certificate.degree_title} />
                        <ResultRow label="Program" value={result.certificate.program_name} />
                        <ResultRow label="Institution" value={result.certificate.institution} />
                        <ResultRow label="CGPA" value={result.certificate.cgpa || 'N/A'} />
                        <ResultRow label="Issue Date" value={result.certificate.issue_date} />
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 text-center py-6">
                      <XCircle className="w-10 h-10 text-red-600 mx-auto" />
                      <p className="text-sm font-medium text-red-700 dark:text-red-300">Verification Failed</p>
                    </div>
                  )}
                </div>
              )}
            </Card>
          </div>

          {/* Recent Verifications */}
          <Card className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Verifications</h3>

            {recentVerifications.length > 0 ? (
              <div className="space-y-2 max-h-[28rem] overflow-y-auto">
                {recentVerifications.map((verification) => (
                  <div
                    key={verification.id}
                    className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg"
                  >
                    <div className="flex items-start gap-2">
                      {verification.result === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {verification.serial}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {verification.verified_at}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-10 text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 mb-3">
                  <AlertCircle className="w-6 h-6 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No verifications yet</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function ResultRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value || 'N/A'}</span>
    </div>
  );
}
