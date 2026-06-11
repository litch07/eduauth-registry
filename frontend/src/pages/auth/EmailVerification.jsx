import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Card from '../../components/shared/Card';
import Input from '../../components/shared/Input';
import authService from '../../services/authService';
import Footer from '../../components/layout/Footer';

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
      setMessage('Email verified successfully. Redirecting...');
      setTimeout(() => navigate('/email-verified'), 1200);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl space-y-6 w-full" padding="32px">
          <div className="space-y-2 text-center">
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Verify email</p>
            <h1 className="text-3xl font-bold text-[var(--text-primary)]">Confirm your registration</h1>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            {message ? <div className="rounded-[8px] bg-[var(--success)]/10 px-4 py-3 text-sm text-[var(--success)] border border-[var(--success)]/30">{message}</div> : null}
            {error ? <div className="rounded-[8px] bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)] border border-[var(--danger)]/30">{error}</div> : null}
            <Input type="email" label="Email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input label="Verification Code" value={code} onChange={(event) => setCode(event.target.value)} inputMode="numeric" maxLength={6} required />
            <Button type="submit" disabled={loading} className="w-full" size="lg">{loading ? 'Verifying...' : 'Verify Email'}</Button>
          </form>
        </Card>
      </div>
      <Footer />
    </div>
  );
}