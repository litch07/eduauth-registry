import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import authService from '../../services/authService';

export default function EmailVerification() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      await authService.verifyEmail(email, code);
      setMessage('Email verified successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 px-4 py-12 dark:bg-gray-950 sm:px-6 lg:px-8">
      <Card className="mx-auto max-w-xl space-y-6">
        <div className="space-y-2 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Verify email</p>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Confirm your registration</h1>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {message ? <div className="rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-300">{message}</div> : null}
          {error ? <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">{error}</div> : null}
          <Input type="email" label="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Verification Code" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} required />
          <Button type="submit" disabled={loading} className="w-full">{loading ? 'Verifying...' : 'Verify Email'}</Button>
        </form>
      </Card>
    </div>
  );
}
