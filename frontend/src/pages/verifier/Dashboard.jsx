import { useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import api from '../../services/api';

export default function VerifierDashboard() {
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const updateField = (field) => (event) => setFormData((current) => ({ ...current, [field]: event.target.value }));

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/verifier/verify', formData);
      setResult(data.certificate);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="grid gap-6 lg:grid-cols-[1fr_0.8fr]">
        <Card className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Verifier Dashboard</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Verify certificate records</h1>
          </div>

          <form onSubmit={handleVerify} className="space-y-4">
            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}
            <Input label="Certificate Serial" value={formData.serial} onChange={updateField('serial')} required />
            <Input type="date" label="Student Date of Birth" value={formData.date_of_birth} onChange={updateField('date_of_birth')} required />
            <Button type="submit" disabled={loading}>{loading ? 'Verifying...' : 'Verify Certificate'}</Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Verification Result</h2>
          {result ? (
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
              <p><span className="font-semibold">Serial:</span> {result.serial}</p>
              <p><span className="font-semibold">Degree:</span> {result.degree_title}</p>
              <p><span className="font-semibold">Student:</span> {result.student_name}</p>
              <p><span className="font-semibold">Institution:</span> {result.institution}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Results will appear here after verification.</p>
          )}
        </Card>
      </div>
    </DashboardLayout>
  );
}
