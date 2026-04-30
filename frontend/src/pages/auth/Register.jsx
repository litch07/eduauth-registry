import RegisterForm from '../../components/auth/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.18),transparent_40%),linear-gradient(180deg,#f8fafc_0%,#ffffff_55%,#eff6ff_100%)] px-4 py-12 dark:bg-[radial-gradient(circle_at_top,rgba(37,99,235,0.15),transparent_40%),linear-gradient(180deg,#020617_0%,#0f172a_55%,#111827_100%)] sm:px-6 lg:px-8">
      <RegisterForm />
    </div>
  );
}
