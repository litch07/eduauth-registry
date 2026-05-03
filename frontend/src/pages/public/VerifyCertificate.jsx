import { useState } from 'react';
import { Search, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import PublicNavbar from '../../components/layout/PublicNavbar';
import api from '../../services/api';

export default function VerifyCertificate() {
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setValidationErrors({});
    setLoading(true);

    try {
      const { data } = await api.post('/verify/certificate', formData);
      setResult(data);
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
        setError('This certificate is private and cannot be verified. The student has restricted access to this certificate.');
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

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_40%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <PublicNavbar />
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_1.2fr]">
          {/* Form Card */}
          <Card className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Public Verification</p>
              <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
                Verify Certificate
              </h1>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Enter the serial number and student's date of birth to check authenticity.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 px-4 py-3 flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-3 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <Input
                label="Serial Number"
                placeholder="e.g., BSC-25-000001M"
                value={formData.serial}
                onChange={updateField('serial')}
                error={validationErrors.serial?.[0]}
                required
              />

              <Input
                type="date"
                label="Date of Birth"
                value={formData.date_of_birth}
                onChange={updateField('date_of_birth')}
                error={validationErrors.date_of_birth?.[0]}
                required
              />

              <Button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center"
              >
                <Search className="w-5 h-5 mr-2" />
                {loading ? 'Verifying...' : 'Verify Certificate'}
              </Button>
            </form>
          </Card>

          {/* Result Card */}
          <Card>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Verification Result</h2>

            {!result ? (
              <div className="space-y-3 py-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                  <AlertCircle className="w-7 h-7 text-gray-400" />
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Results will appear here after verification
                </p>
              </div>
            ) : result.verified ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <Badge variant="success">Certificate Valid</Badge>
                </div>

                <div className="space-y-0.5 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
                  <DetailRow label="Serial Number" value={result.certificate.serial} />
                  <DetailRow label="Student Name" value={result.certificate.student_name} />
                  <DetailRow label="Student ID" value={result.certificate.student_id} />
                  <Divider />
                  <DetailRow label="Degree Title" value={result.certificate.degree_title} />
                  <DetailRow label="Program" value={result.certificate.program_name} />
                  <DetailRow label="Major" value={result.certificate.major || 'N/A'} />
                  <Divider />
                  <DetailRow label="CGPA" value={result.certificate.cgpa || 'N/A'} />
                  <DetailRow label="Registration No" value={result.certificate.registration_no || 'N/A'} />
                  <Divider />
                  <DetailRow label="Issue Date" value={result.certificate.issue_date} />
                  <DetailRow label="Completion Date" value={result.certificate.completion_date || 'N/A'} />
                  <Divider />
                  <DetailRow label="Institution" value={result.certificate.institution} />
                  <DetailRow label="Issued By" value={result.certificate.issued_by} />
                </div>

                <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 flex gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-amber-800 dark:text-amber-300">
                    This confirms the certificate exists in our system. For official verification, contact the issuing institution.
                  </p>
                </div>

                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Verify Another Certificate
                </Button>
              </div>
            ) : (
              <div className="space-y-4 py-8 text-center">
                <XCircle className="w-12 h-12 text-red-600 mx-auto" />
                <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                  Verification Failed
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {error || 'Unable to verify this certificate'}
                </p>
                <Button onClick={handleReset} variant="secondary" className="w-full">
                  Try Again
                </Button>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white text-right">{value || 'N/A'}</span>
    </div>
  );
}

function Divider() {
  return <hr className="border-gray-200 dark:border-gray-700 my-1" />;
}
