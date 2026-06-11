import { Link } from 'react-router-dom';
import Button from '../../components/shared/Button';
import Footer from '../../components/layout/Footer';
import Card from '../../components/shared/Card';

export default function EmailVerified() {
  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex flex-col">
      <div className="flex-1 flex flex-col justify-center px-4 py-12 sm:px-6 lg:px-8">
        <Card className="mx-auto max-w-xl w-full text-center" padding="32px">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--success)]/10 text-[var(--success)]">
            <svg viewBox="0 0 24 24" fill="none" className="h-8 w-8" aria-hidden="true">
              <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-[var(--brand)]">Email verified</p>
          <h1 className="mt-3 text-3xl font-bold text-[var(--text-primary)]">Your email has been verified</h1>
          <p className="mt-4 text-sm leading-7 text-[var(--text-secondary)]">
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
        </Card>
      </div>
      <Footer />
    </div>
  );
}