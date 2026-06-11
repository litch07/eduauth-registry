import { CheckCircle, ShieldCheck } from 'lucide-react';
import LoginForm from '../../components/auth/LoginForm';
import { Link } from 'react-router-dom';
import Card from '../../components/shared/Card';
import Logo from '../../components/shared/Logo';

export default function Login() {
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
              Secure digital certificates for Bangladeshi universities.
            </h1>
            <p className="text-lg text-blue-100 mb-12">
              A centralized platform to issue, manage, and verify academic credentials with absolute confidence.
            </p>
            <div className="space-y-4">
              <div className="flex items-center gap-3 text-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-200" />
                <span>Instant QR-based verification</span>
              </div>
              <div className="flex items-center gap-3 text-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-200" />
                <span>Cryptographically secured serials</span>
              </div>
              <div className="flex items-center gap-3 text-blue-50">
                <CheckCircle className="h-5 w-5 text-blue-200" />
                <span>Privacy-first access controls</span>
              </div>
            </div>
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
          <LoginForm />
        </Card>
      </div>
    </div>
  );
}