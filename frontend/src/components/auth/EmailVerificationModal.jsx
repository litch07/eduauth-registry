import { useState } from 'react';
import Modal from '../shared/Modal';
import Button from '../shared/Button';
import Input from '../shared/Input';
import authService from '../../services/authService';

export default function EmailVerificationModal({ open, onClose, email, onVerified }) {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const handleVerify = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      await authService.verifyEmail(email, code);
      onVerified?.();
      onClose?.();
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      
      if (errorMsg?.includes('expired')) {
        setError('Code has expired. Please request a new code.');
      } else if (errorMsg?.includes('attempts')) {
        setError('Too many failed attempts. Please request a new code.');
      } else if (errorMsg?.includes('incorrect') || errorMsg?.includes('invalid')) {
        setError('Incorrect verification code. Please try again.');
      } else {
        setError(errorMsg || 'Verification failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setResent(false);
    try {
      await authService.resendVerificationCode(email);
      setResent(true);
      setCode('');
    } catch (err) {
      const errorMsg = err.response?.data?.error;
      setError(errorMsg || 'Unable to resend code. Please try again.');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify Your Email">
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          A verification code has been sent to <span className="font-semibold">{email}</span>.
        </p>
        
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Check your email (including spam folder) for a 6-digit code. It will expire in 10 minutes.
        </p>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            <p className="font-semibold">✗ {error}</p>
          </div>
        ) : null}

        {resent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
            ✓ Verification code resent successfully. Check your email.
          </div>
        ) : null}



        <Input
          label="Verification Code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
          placeholder="000000"
          inputMode="numeric"
          maxLength={6}
          required
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleResend} disabled={loading}>
            Resend Code
          </Button>
          <Button type="submit" loading={loading} disabled={!code}>
            Verify Email
          </Button>
        </div>
      </form>
    </Modal>
  );
}
