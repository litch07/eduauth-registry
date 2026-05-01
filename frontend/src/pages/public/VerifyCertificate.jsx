import { useState } from 'react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Badge from '../../components/shared/Badge';
import api from '../../services/api';

export default function VerifyCertificate() {
  const [formData, setFormData] = useState({ serial: '', date_of_birth: '' });
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);

    try {
      const { data } = await api.post('/verify/certificate', formData);
      setResult(data.certificate);
    } catch (requestError) {
      setError(requestError.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const updateField = (field) => (event) => setFormData((current) => ({ ...current, [field]: event.target.value }));

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
        <Card className="space-y-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Public verification</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">Verify certificate authenticity</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}
            <Input label="Serial Number" value={formData.serial} onChange={updateField('serial')} required />
            <Input type="date" label="Date of Birth" value={formData.date_of_birth} onChange={updateField('date_of_birth')} required />
            <Button type="submit" disabled={loading} className="w-full">{loading ? 'Checking...' : 'Verify Now'}</Button>
          </form>
        </Card>

        <Card className="space-y-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Result</h2>
          {result ? (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="success">Valid</Badge>
                <Badge variant="info">Public record</Badge>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Student:</span> {result.student_name}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Degree:</span> {result.degree_title}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Institution:</span> {result.institution}</p>
              <p className="text-sm text-gray-600 dark:text-gray-300"><span className="font-semibold">Serial:</span> {result.serial}</p>
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400">Enter the serial and date of birth to check certificate authenticity.</p>
          )}
        </Card>
      </div>
    </div>
  );
}
