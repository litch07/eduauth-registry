import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
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

const resetPasswordSchema = yup.object().shape({
  password: yup.string().min(8, 'Password must be at least 8 characters').required('Password is required'),
  password_confirmation: yup
    .string()
    .oneOf([yup.ref('password'), null], 'Passwords must match')
    .required('Please confirm your password'),
});

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');
  const navigate = useNavigate();

  const [isSuccess, setIsSuccess] = useState(false);
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(resetPasswordSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');
    try {
      await authService.resetPassword({
        token,
        email,
        password: data.password,
        password_confirmation: data.password_confirmation,
      });
      setIsSuccess(true);
      toast.success('Password reset successfully!');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.response?.data?.error || 'Failed to reset password';
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  if (!token || !email) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg-surface)]">
        <Card className="max-w-md p-8 text-center">
          <h2 className="text-xl font-bold text-[var(--danger)] mb-4">Invalid Link</h2>
          <p className="text-[var(--text-secondary)] mb-6">
            The password reset link is invalid or missing required parameters.
          </p>
          <Link to="/forgot-password">
            <Button variant="outline">Request New Link</Button>
          </Link>
        </Card>
      </div>
    );
  }

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
              Create New Password.
            </h1>
            <p className="text-lg text-blue-100 mb-12">
              Please enter your new password below to regain access to your account.
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
                <h2 className="text-2xl font-bold text-[var(--text-primary)]">Password Reset</h2>
                <p className="text-[var(--text-secondary)]">
                  Your password has been successfully reset. You can now log in with your new password.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button className="w-full">
                      Proceed to Login
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <>
                <div className="space-y-2 mb-8">
                  <h2 className="text-3xl font-bold text-[var(--text-primary)]">New Password</h2>
                  <p className="text-[var(--text-secondary)]">Enter a strong password for {email}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  {serverError && (
                    <div className="rounded-[8px] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
                      {serverError}
                    </div>
                  )}

                  <Input
                    type="password"
                    label="New Password"
                    placeholder="••••••••"
                    {...register('password')}
                    error={errors.password?.message}
                  />

                  <Input
                    type="password"
                    label="Confirm Password"
                    placeholder="••••••••"
                    {...register('password_confirmation')}
                    error={errors.password_confirmation?.message}
                  />

                  <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
                    Reset Password
                  </Button>
                </form>
              </>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
