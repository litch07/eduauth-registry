import { Link } from 'react-router-dom';
import { Check, GraduationCap, Building2, ShieldCheck, ArrowRight } from 'lucide-react';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

export default function RegisterLanding() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col relative overflow-hidden">
      {/* Ambient Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--brand)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[var(--info)]/10 blur-[100px] pointer-events-none" />
      <div className="absolute top-[30%] left-[50%] translate-x-[-50%] w-[60%] h-[20%] rounded-full bg-[var(--success)]/5 blur-[120px] pointer-events-none" />

      <PublicNavbar />
      
      <div className="flex-grow px-4 py-16 sm:px-6 lg:px-8 max-w-6xl mx-auto w-full relative z-10 flex flex-col justify-center">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--brand-light)] text-[var(--brand)] text-sm font-medium mb-6">
            <ShieldCheck className="w-4 h-4" /> Secure Registry
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[var(--text-primary)] sm:text-5xl mb-6 leading-tight">
            Join <span className="bg-gradient-to-r from-[var(--brand)] to-[var(--info)] bg-clip-text text-transparent">EduAuth Registry</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl mx-auto">
            Select your account type to get started. Experience a secure, verifiable, and transparent credential ecosystem tailored for the future of education.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto items-stretch w-full">
          
          {/* Card 1 - Student */}
          <div className="group relative h-full">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-[var(--brand)] to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-40 transition duration-500"></div>
            <Card className="relative flex flex-col h-full bg-[var(--bg-surface)] hover:-translate-y-2 transition-all duration-300 shadow-md hover:shadow-2xl border border-[var(--border)] rounded-2xl z-10" padding="32px">
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-light)] to-transparent text-[var(--brand)] shadow-inner ring-1 ring-[var(--brand)]/20">
                  <GraduationCap className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Student</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                Access your academic certificates, share them with employers, and manage who can view your credentials securely.
              </p>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8 flex-grow">
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--brand)] shrink-0 mt-0.5" /> <span>View and download certificates</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--brand)] shrink-0 mt-0.5" /> <span>Control your privacy settings</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--brand)] shrink-0 mt-0.5" /> <span>Approve verification requests</span></li>
              </ul>
              <div className="mt-auto text-center">
                <Link to="/register/student" className="block w-full mb-3">
                  <Button variant="primary" className="w-full flex items-center justify-center gap-2 transition-all">
                    Register as Student <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-xs text-[var(--text-muted)] font-medium">Requires admin approval before activation.</p>
              </div>
            </Card>
          </div>

          {/* Card 2 - University */}
          <div className="group relative h-full">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-[var(--success)] to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-40 transition duration-500"></div>
            <Card className="relative flex flex-col h-full bg-[var(--bg-surface)] hover:-translate-y-2 transition-all duration-300 shadow-md hover:shadow-2xl border border-[var(--border)] rounded-2xl z-10" padding="32px">
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--success)]/10 to-transparent text-[var(--success)] shadow-inner ring-1 ring-[var(--success)]/20">
                  <Building2 className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">University</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                Issue digital academic certificates for your students with tamper-proof records and quick QR verification.
              </p>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8 flex-grow">
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--success)] shrink-0 mt-0.5" /> <span>Issue & revoke certificates</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--success)] shrink-0 mt-0.5" /> <span>Manage student enrollments</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--success)] shrink-0 mt-0.5" /> <span>Track verifications</span></li>
              </ul>
              <div className="mt-auto text-center">
                <Link to="/register/university" className="block w-full mb-3">
                  <Button variant="success" className="w-full flex items-center justify-center gap-2 transition-all">
                    Register as University <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-xs text-[var(--text-muted)] font-medium">Requires admin approval before activation.</p>
              </div>
            </Card>
          </div>

          {/* Card 3 - Verifier */}
          <div className="group relative h-full">
            <div className="absolute -inset-[1px] bg-gradient-to-b from-[var(--info)] to-transparent rounded-2xl blur-sm opacity-0 group-hover:opacity-40 transition duration-500"></div>
            <Card className="relative flex flex-col h-full bg-[var(--bg-surface)] hover:-translate-y-2 transition-all duration-300 shadow-md hover:shadow-2xl border border-[var(--border)] rounded-2xl z-10" padding="32px">
              <div className="flex items-center justify-between mb-6">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--info)]/10 to-transparent text-[var(--info)] shadow-inner ring-1 ring-[var(--info)]/20">
                  <ShieldCheck className="h-7 w-7" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">Verifier</h3>
              <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                Search for candidates, request access, and quickly verify academic credentials for hiring or admission.
              </p>
              <ul className="space-y-4 text-sm text-[var(--text-secondary)] mb-8 flex-grow">
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--info)] shrink-0 mt-0.5" /> <span>Search by email or NID</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--info)] shrink-0 mt-0.5" /> <span>Request certificate access</span></li>
                <li className="flex gap-3 items-start"><Check className="h-5 w-5 text-[var(--info)] shrink-0 mt-0.5" /> <span>Instant QR verification</span></li>
              </ul>
              <div className="mt-auto text-center">
                <Link to="/register/verifier" className="block w-full mb-3">
                  <Button variant="info" className="w-full flex items-center justify-center gap-2 transition-all">
                    Register as Verifier <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <p className="text-xs text-[var(--text-muted)] font-medium">Requires admin approval before activation.</p>
              </div>
            </Card>
          </div>
          
        </div>

        <div className="mt-20 pt-8 text-center">
          <p className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-[var(--bg-surface)] shadow-sm border border-[var(--border)] text-sm text-[var(--text-secondary)]">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-[var(--brand)] hover:text-[var(--brand-hover)] transition-colors flex items-center gap-1">
              Sign In <ArrowRight className="w-4 h-4" />
            </Link>
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
