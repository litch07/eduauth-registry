import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import authService from '../../services/authService';
import Card from '../../components/shared/Card';
import Logo from '../../components/shared/Logo';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';
import toast from 'react-hot-toast';

const forgotPasswordSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
});

export default function ForgotPassword() {
  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await authService.forgotPassword(data.email);
      setIsSuccess(true);
      toast.success('Password reset link sent!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to send reset link';
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="flex min-h-screen bg-[var(--bg-surface)]">
      {/* Left Panel */}
      <div className="hidden lg:flex w-1/2 bg-[var(--brand)] flex-col justify-between p-12 text-[var(--text-inverse)]">
        <div>
          <Link to="/" className="inline-flex items-center gap-2 self-start group">
            <Logo className="h-10 w-auto" invert={true} />
            <div className="flex items-baseline gap-1 text-2xl">
              <span className="font-bold text-white tracking-tight">EduAuth</span>
              <span className="font-normal text-blue-200 tracking-tight">Registry</span>
            </div>
          </Link>
          <div className="mt-24 max-w-md">
            <h1 className="text-4xl font-bold tracking-tight mb-6 text-white">
              Reset Your Password.
            </h1>
            <p className="text-lg text-blue-100 mb-12">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>
        </div>
        <div className="text-sm text-blue-200">
          &copy; {new Date().getFullYear()} EduAuth Registry. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-20 xl:px-24 bg-[var(--bg-surface)]">
        <Card className="mx-auto w-full max-w-sm lg:w-96" padding="32px">
          <div className="lg:hidden mb-8 flex">
            <Link to="/" className="inline-flex items-center gap-2 text-[var(--brand)] group">
              <Logo className="h-7 w-auto" />
              <div className="flex items-baseline gap-1 text-2xl">
                <span className="font-semibold text-[var(--text-primary)]">EduAuth</span>
                <span className="font-normal text-[var(--text-muted)]">Registry</span>
              </div>
            </Link>
          </div>

          <div className="w-full">
            {isSuccess ? (
              <div className="text-center space-y-4">
                <CheckCircle className="h-16 w-16 text-[var(--success)] mx-auto" />
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Check your email</h2>
                <p className="text-[var(--text-secondary)]">
                  We've sent a password reset link to your email address.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button variant="outline" className="w-full">
                      Back to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-bold text-[var(--text-primary)]">Forgot Password</h2>
                  <p className="text-[var(--text-secondary)]">No worries, we'll send you reset instructions.</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {serverError && (
                    <div className="rounded-[8px] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                      {serverError}
                    </div>
                  )}

                  <Input
                    type="email"
                    label="Email Address"
                    placeholder="you@example.com"
                    {...register('email')}
                    error={errors.email?.message}
                  />

                  <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
                    Send Reset Link
                  </Button>
                </form>

                <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
                  Remembered your password?{' '}
                  <Link to="/login" className="font-semibold text-[var(--brand)] hover:underline">
                    Back to Login
                  </Link>
                </p>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
