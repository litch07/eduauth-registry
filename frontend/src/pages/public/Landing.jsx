import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ScanSearch, FileText, GraduationCap } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import PublicNavbar from '../../components/layout/PublicNavbar';
import Footer from '../../components/layout/Footer';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.15),transparent_32%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.12),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <PublicNavbar />

      <section className="mx-auto flex min-h-[calc(100vh-8rem)] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-primary-200 bg-white/70 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm backdrop-blur dark:border-primary-900 dark:bg-gray-900/70 dark:text-primary-300">
              <ShieldCheck className="h-4 w-4" />
              EduAuth Registry
            </span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-4xl font-extrabold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-6xl">
                Modern certificate issuance & verification.
              </h1>
              <p className="max-w-lg text-lg leading-relaxed text-gray-600 dark:text-gray-300">
                Issue tamper-resistant digital certificates, verify them instantly, and keep every approval auditable.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register">
                <Button className="gap-2 shadow-md shadow-primary-600/20 hover:shadow-lg hover:shadow-primary-600/25">
                  Get Started <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/verify">
                <Button variant="secondary" className="gap-2">
                  <ScanSearch className="h-4 w-4" /> Verify Certificate
                </Button>
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <Card className="border border-white/50 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-primary-50 p-2.5 dark:bg-primary-900/30">
                  <ShieldCheck className="h-6 w-6 text-primary-600 dark:text-primary-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Secure Approvals</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">Role-based access with admin review and full activity logging.</p>
                </div>
              </div>
            </Card>
            <Card className="border border-white/50 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-green-50 p-2.5 dark:bg-green-900/30">
                  <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Certificate Lifecycle</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">Issue, revoke, restore, and verify certificates in one workflow.</p>
                </div>
              </div>
            </Card>
            <Card className="border border-white/50 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-amber-50 p-2.5 dark:bg-amber-900/30">
                  <GraduationCap className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Student Privacy</h2>
                  <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">Students control certificate visibility — public or private, at any time.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
