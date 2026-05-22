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
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">EduAuth Registry</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in</h2>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {serverError ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
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

        <Input
          type="password"
          label="Password"
          placeholder="••••••••"
          {...register('password')}
          error={errors.password?.message}
        />

        <Button type="submit" loading={isSubmitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account? <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Register here</Link>
      </p>
    </div>
  );
}
