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
      setError(err.response?.data?.error || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    try {
      await authService.resendVerificationCode(email);
      setResent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Unable to resend code');
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Verify Your Email">
      <form onSubmit={handleVerify} className="space-y-4">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Enter the 6-digit verification code sent to <span className="font-semibold">{email}</span>.
        </p>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        {resent ? (
          <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-900/20 dark:text-green-300">
            Verification code resent successfully.
          </div>
        ) : null}

        <Input
          label="Verification Code"
          name="code"
          value={code}
          onChange={(event) => setCode(event.target.value)}
          placeholder="123456"
          inputMode="numeric"
          maxLength={6}
          required
        />

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button type="button" variant="secondary" onClick={handleResend} disabled={loading}>
            Resend Code
          </Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify Email'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
