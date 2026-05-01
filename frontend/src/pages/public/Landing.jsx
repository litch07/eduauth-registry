import { Link } from 'react-router-dom';
import { ArrowRight, ShieldCheck, ScanSearch, FileText } from 'lucide-react';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';

export default function Landing() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.2),transparent_32%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.16),transparent_32%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div className="space-y-8">
            <span className="inline-flex rounded-full border border-primary-200 bg-white/70 px-4 py-2 text-sm font-medium text-primary-700 shadow-sm backdrop-blur dark:border-primary-900 dark:bg-gray-900/70 dark:text-primary-300">
              EduAuth Registry
            </span>
            <div className="space-y-4">
              <h1 className="max-w-xl text-5xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-6xl">
                Modern certificate issuance for universities and verifiers.
              </h1>
              <p className="max-w-2xl text-lg text-gray-600 dark:text-gray-300">
                Issue tamper-resistant digital certificates, verify them instantly, and keep every approval and access request auditable.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/register"><Button className="gap-2">Get Started <ArrowRight className="h-4 w-4" /></Button></Link>
              <Link to="/verify"><Button variant="secondary" className="gap-2"><ScanSearch className="h-4 w-4" />Verify Certificate</Button></Link>
            </div>
          </div>

          <div className="grid gap-5">
            <Card className="border border-white/50 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-10 w-10 text-primary-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Secure approvals</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Role-based access with admin review and activity logging.</p>
                </div>
              </div>
            </Card>
            <Card className="border border-white/50 bg-white/80 backdrop-blur dark:border-gray-700 dark:bg-gray-900/80">
              <div className="flex items-start gap-4">
                <FileText className="mt-1 h-10 w-10 text-green-600" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Certificate lifecycle</h2>
                  <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Issue, revoke, restore, and verify certificates in one workflow.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
