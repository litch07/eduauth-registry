import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../shared/Button';
import Input from '../shared/Input';

export default function LoginForm() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(formData);
      if (data.user.role === 'student') navigate('/student/dashboard');
      else if (data.user.role === 'university') navigate('/university/dashboard');
      else if (data.user.role === 'verifier') navigate('/verifier/dashboard');
      else if (data.user.role === 'admin') navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-8 rounded-3xl border border-white/10 bg-white/90 p-8 shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
      <div className="space-y-2 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">EduAuth Registry</p>
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">Secure certificate management and verification</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-900/20 dark:text-red-300">
            {error}
          </div>
        ) : null}

        <Input
          type="email"
          label="Email Address"
          name="email"
          value={formData.email}
          onChange={(event) => setFormData({ ...formData, email: event.target.value })}
          placeholder="you@example.com"
          required
        />

        <Input
          type="password"
          label="Password"
          name="password"
          value={formData.password}
          onChange={(event) => setFormData({ ...formData, password: event.target.value })}
          placeholder="••••••••"
          required
        />

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? 'Signing in...' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-600 dark:text-gray-400">
        Don&apos;t have an account? <Link to="/register" className="font-medium text-primary-600 hover:text-primary-700">Register here</Link>
      </p>
    </div>
  );
}
