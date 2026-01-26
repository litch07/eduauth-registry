import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, QrCode, CheckCircle, ArrowRight, GraduationCap, Clock3 } from 'lucide-react';
import DarkModeToggle from '../components/DarkModeToggle';
import VerificationForm from '../components/VerificationForm';

const stats = [
  { label: 'Universities', value: '10+', icon: GraduationCap },
  { label: 'Verified Certificates', value: '1,234', icon: Shield },
  { label: 'Verification Time', value: '< 2s', icon: Clock3 }
];

const features = [
  { title: 'Instant Verification', desc: 'Real-time certificate validation with 2FA (Serial + DOB).', icon: Zap },
  { title: 'Tamper-Proof', desc: 'Signed, checksum-protected serials with audit-ready trails.', icon: Shield },
  { title: 'QR Code Support', desc: 'Scan-and-verify flows for employers and institutions.', icon: QrCode },
  { title: 'Privacy Protected', desc: 'No PII leakage-verification requires matching DOB.', icon: CheckCircle }
];

const steps = [
  { title: 'Step 1: University Issues', desc: 'University issues and signs a digital certificate with a secure serial.' },
  { title: 'Step 2: Student Receives', desc: 'Students get their digital certificate and can share securely.' },
  { title: 'Step 3: Employer Verifies', desc: 'Employers verify via serial + DOB-fast, trusted, auditable.' }
];

const Landing = () => {
  const navigate = useNavigate();
  const handleVerify = ({ serial, dateOfBirth }) => {
    const params = new URLSearchParams();
    if (serial) params.set('serial', serial);
    if (dateOfBirth) params.set('dob', dateOfBirth);
    const query = params.toString();
    navigate(query ? `/verify?${query}` : '/verify');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 via-indigo-50 to-white text-slate-900 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 dark:text-white">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/90 dark:bg-gray-900/80 backdrop-blur shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="EduAuth Registry" className="h-10 w-10 object-cover rounded-xl shadow-sm" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-wide text-primary">EduAuth Registry</p>
              <p className="text-xs text-slate-500 dark:text-gray-300">Centralized certificate verification</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/login')}
              className="rounded-lg px-4 py-2 text-sm font-semibold text-primary hover:bg-primary-light/15 transition dark:text-blue-200"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow hover:bg-primary-hover transition"
            >
              Register
              <ArrowRight className="h-4 w-4" />
            </button>
            <DarkModeToggle />
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#3B82F610,transparent_25%)]" />
        <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center md:py-20">
          <div className="flex-1 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-800/70 px-3 py-1 text-xs font-semibold text-primary shadow-sm ring-1 ring-primary/10">
              Trusted. Fast. Secure.
            </div>
            <h1 className="text-3xl font-bold leading-tight text-slate-900 dark:text-white md:text-5xl">
              Verify University Certificates <br className="hidden md:block" /> Instantly
            </h1>
            <p className="max-w-2xl text-lg text-slate-600 dark:text-gray-300 md:text-xl">
              Bangladesh's first centralized digital certificate verification platform. Built with tamper-proof serials, QR validation, and privacy-preserving two-factor checks.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate('/verify')}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-secondary px-6 py-3 text-base font-semibold text-white shadow-lg shadow-secondary/25 transition hover:bg-secondary-hover"
              >
                Verify Certificate Now
                <ArrowRight className="h-5 w-5" />
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="inline-flex items-center justify-center gap-2 rounded-lg border border-primary/30 dark:border-gray-700 bg-white dark:bg-gray-800 px-6 py-3 text-base font-semibold text-primary dark:text-gray-100 transition hover:bg-primary/5 dark:hover:bg-gray-700"
              >
                Learn More
              </button>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-slate-600 dark:text-gray-300">
              <span className="flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-800/70 px-3 py-1 ring-1 ring-slate-200 dark:ring-gray-700">
                <Shield className="h-4 w-4 text-primary" /> Serialized + checksummed
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-800/70 px-3 py-1 ring-1 ring-slate-200 dark:ring-gray-700">
                <Zap className="h-4 w-4 text-secondary" /> Under 2 seconds
              </span>
              <span className="flex items-center gap-2 rounded-full bg-white/70 dark:bg-gray-800/70 px-3 py-1 ring-1 ring-slate-200 dark:ring-gray-700">
                <QrCode className="h-4 w-4 text-primary" /> QR-ready
              </span>
            </div>
          </div>
          <div className="flex-1">
            <div className="relative rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-indigo-100 dark:ring-gray-700">
              <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/10 blur-2xl" />
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-500 dark:text-gray-300">Verify Certificate</p>
                  <span className="rounded-full bg-green-100 dark:bg-green-900/40 px-3 py-1 text-xs font-semibold text-secondary dark:text-green-300">Online</span>
                </div>
                <div className="space-y-4 rounded-xl bg-slate-50 dark:bg-gray-900/40 p-4">
                  <VerificationForm onSubmit={handleVerify} submitLabel="Verify Now" />
                  <div className="text-xs text-slate-600 dark:text-gray-300">
                    Instant verification for employers, institutions, and individuals.
                    <a href="/login" className="ml-1 font-semibold underline hover:text-primary">Sign in as verifier to save verification history</a>.
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-gray-300">
                  <CheckCircle className="h-4 w-4 text-secondary" />
                  Two-factor check: Serial + DOB required for verification.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics */}
      <section className="bg-white dark:bg-gray-900 py-12">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {stats.map((item) => (
              <div key={item.label} className="flex items-center gap-4 rounded-xl bg-slate-50 dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <item.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{item.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="bg-slate-50 dark:bg-gray-900 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-primary">Why EduAuth</p>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Secure, fast, and verifiable by design</h2>
            </div>
            <p className="max-w-xl text-sm text-slate-600 dark:text-gray-300">Built for universities, students, and employers to trust each verification with checksummed serials, QR flows, and privacy-first policies.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div key={feature.title} className="group rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 transition hover:-translate-y-1 hover:shadow-md">
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition">
                  <feature.icon className="h-5 w-5" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-white dark:bg-gray-900 py-14">
        <div className="mx-auto max-w-6xl px-4">
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary">How It Works</p>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Three simple steps</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">From issuance to verification in minutes.</p>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            {steps.map((step, index) => (
              <div key={step.title} className="relative rounded-xl bg-slate-50 dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
                <div className="absolute -top-3 left-4 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white shadow">
                  {index + 1}
                </div>
                <h3 className="mt-6 text-lg font-semibold text-slate-900 dark:text-white">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-gray-300">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 py-8 text-slate-200">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-4 text-sm md:flex-row">
          <p className="text-center md:text-left">© {new Date().getFullYear()} EduAuth Registry. Transforming Education Through Technology 🎓</p>
          <p className="text-center text-slate-400 md:text-right">Built for secure, privacy-preserving verification in Bangladesh.</p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
