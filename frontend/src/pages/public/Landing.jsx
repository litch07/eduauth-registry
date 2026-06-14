import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Zap, QrCode, CheckCircle, ArrowRight, GraduationCap, Clock3, Search } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import api, { cachedGet } from '../../services/api';
import Input from '../../components/shared/Input';
import Button from '../../components/shared/Button';

const features = [
  { title: 'Fast Verification', desc: 'Validate certificate status in real time using serial and date of birth.', icon: Zap },
  { title: 'Integrity Controls', desc: 'Certificates use checksum-based serials and revocation tracking.', icon: Shield },
  { title: 'QR-Based Access', desc: 'QR codes open the verification flow with prefilled certificate serials.', icon: QrCode },
  { title: 'Privacy by Design', desc: 'Verification responses are limited and require matching date of birth.', icon: CheckCircle }
];

const steps = [
  { title: 'Step 1: Certificate Issued', desc: 'The university issues a digital certificate and assigns a unique serial.' },
  { title: 'Step 2: Student Access', desc: 'The student can view the certificate and manage sharing permissions.' },
  { title: 'Step 3: Verification', desc: 'A verifier confirms authenticity using serial and date of birth.' }
];

export default function Landing() {
  const navigate = useNavigate();
  const [systemStats, setSystemStats] = useState({
    totalSystemUsers: null,
    totalUniversities: null,
    totalCertificates: null,
  });

  const [verifyData, setVerifyData] = useState({ serial: '', dob: '' });

  useEffect(() => {
    let isMounted = true;

    const fetchSystemStats = async () => {
      try {
        const response = await cachedGet('/verify/system-stats');
        if (!isMounted) return;

        setSystemStats({
          totalSystemUsers: Number(response.data?.totalSystemUsers ?? 0),
          totalUniversities: Number(response.data?.totalUniversities ?? 0),
          totalCertificates: Number(response.data?.totalCertificates ?? 0),
        });
      } catch (_) {
        if (!isMounted) return;
        setSystemStats((prev) => ({
          totalSystemUsers: prev.totalSystemUsers ?? null,
          totalUniversities: prev.totalUniversities ?? null,
          totalCertificates: prev.totalCertificates ?? null,
        }));
      }
    };

    fetchSystemStats();
    return () => { isMounted = false; };
  }, []);

  const stats = [
    { icon: GraduationCap, value: systemStats.totalSystemUsers !== null ? systemStats.totalSystemUsers.toLocaleString() : '—', label: 'Registered Users' },
    { icon: Shield, value: systemStats.totalUniversities !== null ? systemStats.totalUniversities.toLocaleString() : '—', label: 'Partner Universities' },
    { icon: Clock3, value: systemStats.totalCertificates !== null ? systemStats.totalCertificates.toLocaleString() : '—', label: 'Certificates Issued' },
  ];

  const handleVerifyNowClick = () => {
    navigate('/verify');
  };

  const handleLearnMoreClick = () => {
    document.getElementById('why-eduauth')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleVerifySubmit = (e) => {
    e.preventDefault();
    navigate(`/verify?serial=${encodeURIComponent(verifyData.serial)}&dob=${encodeURIComponent(verifyData.dob)}`, {
      state: { autoVerify: true, dob: verifyData.dob },
    });
  };

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col font-sans">
      <PublicNavbar />

      {/* Modern Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-32 px-[15px]">
        {/* Background Gradients & Glassmorphism */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand)]/10 blur-[100px] pointer-events-none animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[30%] h-[30%] rounded-full bg-[var(--brand)]/10 blur-[80px] pointer-events-none"></div>

        <div className="w-full px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] px-4 py-2 text-sm font-medium text-[var(--brand)] shadow-sm">
                <span className="flex h-2 w-2 rounded-full bg-[var(--brand)] animate-ping"></span>
                Secure Verification Infrastructure
              </div>

              <h1 className="text-5xl lg:text-7xl font-extrabold text-[var(--text-primary)] tracking-tight leading-[1.1]">
                Verify Academic <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-purple-500">
                  Credentials Instantly
                </span>
              </h1>

              <p className="text-lg lg:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto lg:mx-0 leading-relaxed">
                A centralized platform for issuing institutions and verifiers to check academic credentials with controlled data exposure and revocation-aware results.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                <button
                  onClick={handleVerifyNowClick}
                  className="group relative inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--brand)] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[var(--brand)]/20 transition-all hover:scale-105 hover:shadow-[var(--brand)]/40 overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-in-out"></div>
                  <span className="relative z-10 flex items-center gap-2">Start Verification <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" /></span>
                </button>
                <button
                  onClick={handleLearnMoreClick}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-[var(--border)] bg-[var(--bg-surface)] px-8 py-4 text-base font-semibold text-[var(--text-primary)] transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--brand)]/50"
                >
                  Learn More
                </button>
              </div>

              <div className="flex items-center gap-6 justify-center lg:justify-start text-sm text-[var(--text-secondary)] font-medium pt-4">
                <span className="flex items-center gap-2"><Shield className="h-5 w-5 text-[var(--success)]" /> Bank-grade Security</span>
                <span className="flex items-center gap-2"><Zap className="h-5 w-5 text-[var(--warning)]" /> Real-time Sync</span>
              </div>
            </div>

            <div className="flex-1 w-full max-w-[502px] lg:max-w-none">
              <div className="relative rounded-2xl bg-[var(--bg-surface)]/80 backdrop-blur-xl border border-[var(--border)] p-8 shadow-2xl">
                <div className="absolute -top-4 -right-4 h-24 w-24 rounded-full bg-gradient-to-br from-[var(--brand)] to-purple-500 blur-2xl opacity-20 animate-pulse"></div>
                <div className="relative z-10 space-y-6">
                  <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                    <h3 className="text-lg font-bold text-[var(--text-primary)]">Quick Verify</h3>
                    <span className="rounded-full bg-[var(--success)]/10 px-3 py-1 text-xs font-semibold text-[var(--success)] border border-[var(--success)]/20">Live System</span>
                  </div>

                  <form onSubmit={handleVerifySubmit} className="space-y-5">
                    <Input
                      label="Serial Number"
                      placeholder="e.g., BSC-25-000001M"
                      value={verifyData.serial}
                      onChange={(e) => setVerifyData({ ...verifyData, serial: e.target.value })}
                      required
                    />
                    <Input
                      type="date"
                      label="Date of Birth"
                      value={verifyData.dob}
                      onChange={(e) => setVerifyData({ ...verifyData, dob: e.target.value })}
                      required
                    />
                    <Button type="submit" className="w-full py-3 mt-4 text-base">
                      <Search className="w-5 h-5 mr-2" />
                      Verify Certificate
                    </Button>
                  </form>

                  <p className="text-center text-xs text-[var(--text-muted)] pt-2">
                    Verifying requires both the unique serial and the student's date of birth for privacy.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section with Glassmorphism */}
      <section className="relative py-16 border-y border-[var(--border)] bg-[var(--bg-surface)]/50">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((item, idx) => (
              <div key={idx} className="group relative rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border)] p-8 text-center transition-all hover:-translate-y-2 hover:shadow-xl hover:border-[var(--brand)]/30 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10 flex flex-col items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--bg-surface)] shadow-inner border border-[var(--border)] text-[var(--brand)] group-hover:scale-110 transition-transform">
                    <item.icon className="h-8 w-8" />
                  </div>
                  <div>
                    <h4 className="text-4xl font-black text-[var(--text-primary)] tracking-tight">{item.value}</h4>
                    <p className="mt-2 text-sm font-semibold uppercase tracking-wider text-[var(--text-secondary)]">{item.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="why-eduauth" className="py-24 relative">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[var(--brand)] font-semibold tracking-wide uppercase text-sm">Why Choose Us</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">Uncompromising Security &amp; Speed</h3>
            <p className="text-lg text-[var(--text-secondary)]">Experience a robust architecture designed to eliminate credential fraud while respecting data privacy.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, idx) => (
              <div key={idx} className="group rounded-2xl bg-[var(--bg-surface)] border border-[var(--border)] p-8 transition-all hover:bg-[var(--bg-elevated)] hover:border-[var(--brand)]/30 hover:shadow-lg">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--brand)]/10 text-[var(--brand)] group-hover:bg-[var(--brand)] group-hover:text-white transition-colors duration-300">
                  <feature.icon className="h-7 w-7" />
                </div>
                <h4 className="text-xl font-bold text-[var(--text-primary)] mb-3">{feature.title}</h4>
                <p className="text-[var(--text-secondary)] leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section className="py-24 bg-[var(--bg-surface)] border-t border-[var(--border)]">
        <div className="w-full px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-[var(--brand)] font-semibold tracking-wide uppercase text-sm">Workflow</h2>
            <h3 className="text-3xl md:text-5xl font-bold text-[var(--text-primary)]">Three Simple Steps</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-[var(--border)] to-transparent -translate-y-1/2 z-0"></div>

            {steps.map((step, idx) => (
              <div key={idx} className="relative z-10 flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-full bg-[var(--bg-elevated)] border-4 border-[var(--bg-surface)] shadow-md flex items-center justify-center text-xl font-black text-[var(--brand)] mb-6 z-10">
                  {idx + 1}
                </div>
                <h4 className="text-xl font-bold text-[var(--text-primary)] mb-3">{step.title}</h4>
                <p className="text-[var(--text-secondary)] px-4">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
