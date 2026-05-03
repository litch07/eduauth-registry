import { Link } from 'react-router-dom';
import Button from '../../components/shared/Button';

export default function EmailVerified() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_35%),linear-gradient(180deg,#eff6ff_0%,#ffffff_48%,#f8fafc_100%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_35%),linear-gradient(180deg,#020617_0%,#0f172a_48%,#111827_100%)] sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/90 p-8 text-center shadow-2xl shadow-slate-900/10 backdrop-blur dark:bg-gray-900/80">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Email verified</p>
          <h1 className="mt-3 text-3xl font-bold text-gray-900 dark:text-white">Your email has been verified</h1>
          <p className="mt-4 text-sm leading-7 text-gray-600 dark:text-gray-300">
            Your registration is now awaiting admin approval. The admin team has been notified and you will receive an update once the account is reviewed.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/login">
              <Button className="w-full sm:w-auto">Go to login</Button>
            </Link>
            <Link to="/">
              <Button variant="secondary" className="w-full sm:w-auto">Back to home</Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}