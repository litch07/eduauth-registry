import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Footer from './Footer';
import Navbar from './Navbar';

export default function SettingsLayout({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-blue-50 text-gray-900 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 dark:text-gray-100">
      <Navbar onMenuClick={() => navigate(user ? `/${user.role}/dashboard` : '/')} />

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <button
            onClick={() => navigate(user ? `/${user.role}/dashboard` : '/')}
            className="flex items-center gap-2 rounded-lg py-2 px-3 mb-6 text-sm font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 w-max"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>
          
          <div className="space-y-6">
            {children}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
