import RegisterForm from '../../components/auth/RegisterForm';
import PublicNavbar from '../../components/layout/PublicNavbar';

export default function Register() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.14),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#eff6ff_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.1),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)]">
      <PublicNavbar />
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        <RegisterForm />
      </div>
    </div>
  );
}
