import LoginForm from '../../components/auth/LoginForm';
import PublicNavbar from '../../components/layout/PublicNavbar';

export default function Login() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_40%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.1),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)]">
      <PublicNavbar />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 sm:px-6 lg:px-8">
        <LoginForm />
      </div>
    </div>
  );
}
