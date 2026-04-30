import LoginForm from '../../components/auth/LoginForm';

export default function Login() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.18),transparent_40%),linear-gradient(180deg,#eff6ff_0%,#ffffff_45%,#f8fafc_100%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.14),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_45%,#111827_100%)] sm:px-6 lg:px-8">
      <LoginForm />
    </div>
  );
}
