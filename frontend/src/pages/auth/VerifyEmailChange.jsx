import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Footer from '../../components/layout/Footer';
import Card from '../../components/shared/Card';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

export default function VerifyEmailChange() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading'); // 'loading' | 'success' | 'error'
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = searchParams.get('token');

    if (!token) {
      setStatus('error');
      setMessage('No verification token found. Please check your email link and try again.');
      return;
    }

    api.post('/auth/verify-email-change', { token })
      .then(({ data }) => {
        setStatus('success');
        setMessage(data.message || 'Email address updated successfully.');
      })
      .catch((err) => {
        setStatus('error');
        setMessage(
          err.response?.data?.error ||
          err.response?.data?.message ||
          'This verification link is invalid or has expired. Please request a new email change from your profile.'
        );
      });
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl w-full text-center" padding="32px">

          {status === 'loading' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center">
                <LoadingSpinner />
              </div>
              <h1 className="text-2xl font-bold text-[var(--text-primary)]">Verifying your email…</h1>
              <p className="mt-3 text-sm text-[var(--text-secondary)]">Please wait while we confirm your new email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                  <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Email Updated</p>
              <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">Email address confirmed</h1>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{message}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/login">
                  <Button className="w-full sm:w-auto">Log in with new email</Button>
                </Link>
                <Link to="/">
                  <Button variant="secondary" className="w-full sm:w-auto">Back to home</Button>
                </Link>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-500 dark:bg-red-900/20 dark:text-red-400">
                <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-sm font-semibold uppercase tracking-[0.15em] text-red-500 dark:text-red-400">Verification Failed</p>
              <h1 className="mt-3 text-2xl font-bold text-[var(--text-primary)]">Link invalid or expired</h1>
              <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">{message}</p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
                <Link to="/profile">
                  <Button className="w-full sm:w-auto">Go to Profile</Button>
                </Link>
                <Link to="/login">
                  <Button variant="secondary" className="w-full sm:w-auto">Log in</Button>
                </Link>
              </div>
            </>
          )}

        </Card>
      </div>
      <Footer />
    </div>
  );
}
