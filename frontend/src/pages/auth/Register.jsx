import { useParams, Navigate, Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle } from 'lucide-react';
import RegisterForm from '../../components/auth/RegisterForm';
import Logo from '../../components/shared/Logo';

export default function Register() {
  const { role } = useParams();
  const validRoles = ['student', 'university', 'verifier'];

  if (!validRoles.includes(role)) {
    return <Navigate to="/register" replace />;
  }

  const roleInfo = {
    student: {
      title: 'Take control of your academic credentials.',
      subtitle: 'Register as a student to securely receive, store, and share your verified university certificates.',
      bullets: [
        'Instant access to all your issued certificates',
        'Share verifiable credentials with employers',
        'Complete control over who sees your data',
      ],
      bgColor: 'bg-[var(--brand)]'
    },
    university: {
      title: 'Issue verifiable academic credentials.',
      subtitle: 'Register your institution to seamlessly issue and manage secure, tamper-proof certificates for your students.',
      bullets: [
        'Cryptographically secured certificate issuance',
        'Streamlined batch processing',
        'Revocation and lifecycle management',
      ],
      bgColor: 'bg-[var(--success)]'
    },
    verifier: {
      title: 'Verify credentials with absolute certainty.',
      subtitle: 'Register as a verification agency or employer to securely verify academic claims directly from the source.',
      bullets: [
        'Instant cryptographical verification',
        'Direct access to source university records',
        'Streamlined candidate background checks',
      ],
      bgColor: 'bg-[var(--info)]'
    }
  };

  const info = roleInfo[role];

  return (
    <div className="flex min-h-screen bg-[var(--bg-surface)]">
      {/* Left Panel */}
      <div className={`hidden lg:flex w-5/12 ${info.bgColor} flex-col justify-between p-8 xl:p-12 text-[var(--text-inverse)] sticky top-0 h-screen overflow-y-auto transition-colors duration-500`}>
        <div>
          <Link to="/" className="inline-flex items-center gap-2 self-start group mb-12">
            <Logo className="h-10 w-auto" invert={true} />
            <div className="flex items-baseline gap-1 text-2xl">
              <span className="font-bold text-white tracking-tight">EduAuth</span>
              <span className="font-normal text-white/70 tracking-tight">Registry</span>
            </div>
          </Link>

          <div className="max-w-md mt-12">
            <h1 className="text-4xl font-bold tracking-tight mb-6 text-white">
              {info.title}
            </h1>
            <p className="text-lg text-white/90 mb-12">
              {info.subtitle}
            </p>
            <div className="space-y-4">
              {info.bullets.map((bullet, idx) => (
                <div key={idx} className="flex items-center gap-3 text-white">
                  <CheckCircle className="h-5 w-5 text-white/80 shrink-0" />
                  <span>{bullet}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-sm text-white/70">
          &copy; {new Date().getFullYear()} EduAuth Registry. All rights reserved.
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-6 lg:px-12 xl:px-20 bg-[var(--bg-base)] relative">
        <div className="hidden lg:block absolute top-10 left-10 xl:left-16">
          <Link to="/register" className="inline-flex items-center gap-2 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition px-3 py-2 rounded-lg hover:bg-[var(--bg-surface)] border border-transparent hover:border-[var(--border)] shadow-sm hover:shadow">
            <ArrowLeft className="h-4 w-4" /> Back to role selection
          </Link>
        </div>

        <div className="w-full max-w-2xl mx-auto py-12 lg:pt-24">
          <div className="lg:hidden text-center mb-8">
            <Link to="/" className="inline-flex items-center gap-2 text-[var(--brand)] mb-6 group">
              <Logo className="h-7 w-auto" />
              <div className="flex items-baseline gap-1 text-2xl">
                <span className="font-semibold text-[var(--text-primary)]">EduAuth</span>
                <span className="font-normal text-[var(--text-muted)]">Registry</span>
              </div>
            </Link>
            <div className="flex justify-center mb-2">
              <Link to="/register" className="inline-flex items-center gap-1 text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] transition">
                <ArrowLeft className="h-4 w-4" /> Back to role selection
              </Link>
            </div>
          </div>
          
          <RegisterForm key={role} defaultRole={role} />
        </div>
      </div>
    </div>
  );
}