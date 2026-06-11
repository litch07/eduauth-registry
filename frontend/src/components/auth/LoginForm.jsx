import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import Input from '../shared/Input';

const loginSchema = yup.object().shape({
  email: yup.string().email('Please enter a valid email address').required('Email is required'),
  password: yup.string().required('Password is required'),
});

export default function LoginForm() {
  const [serverError, setServerError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: yupResolver(loginSchema),
  });

  const onSubmit = async (data) => {
    setServerError('');

    try {
      const response = await login(data);
      toast.success('Logged in successfully');
      if (response.user.role === 'student') navigate('/student/dashboard');
      else if (response.user.role === 'university') navigate('/university/dashboard');
      else if (response.user.role === 'verifier') navigate('/verifier/dashboard');
      else if (response.user.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      let errorMsg = 'Login failed';
      if (!err.response) {
        errorMsg = 'Network error. Please ensure the backend server is running.';
      } else {
        errorMsg = err.response.data?.message || err.response.data?.error || 'Login failed';
      }
      setServerError(errorMsg);
      toast.error(errorMsg);
    }
  };

  return (
    <div className="w-full">
      <div className="space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-[var(--text-primary)]">Welcome back</h2>
        <p className="text-[var(--text-secondary)]">Sign in to your account</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError ? (
          <div className="rounded-[8px] border border-[var(--danger)]/30 bg-[var(--danger)]/10 px-4 py-3 text-sm text-[var(--danger)]">
            {serverError}
          </div>
        ) : null}

        <Input
          type="email"
          label="Email Address"
          placeholder="you@example.com"
          {...register('email')}
          error={errors.email?.message}
        />

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-sm font-medium text-[var(--text-secondary)]">Password</label>
            <Link to="/forgot-password" className="text-sm font-medium text-[var(--brand)] hover:underline">Forgot password?</Link>
          </div>
          <Input
            type="password"
            placeholder="••••••••"
            {...register('password')}
            error={errors.password?.message}
          />
        </div>

        <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
          Sign In
        </Button>
      </form>

      <div className="mt-8 flex items-center justify-center space-x-4">
        <span className="h-[1px] w-full bg-[var(--border)]"></span>
        <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">or</span>
        <span className="h-[1px] w-full bg-[var(--border)]"></span>
      </div>

      <p className="mt-8 text-center text-sm text-[var(--text-secondary)]">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="font-semibold text-[var(--brand)] hover:underline">
          Register
        </Link>
      </p>
    </div>
  );
}
