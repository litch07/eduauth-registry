import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useState } from 'react';

export default function SettingsLayout({ children }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar onMenuClick={() => setSidebarOpen((current) => !current)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 transition-all duration-200 lg:ml-[240px] pt-[56px]">
          <div className="min-h-[calc(100vh-56px)] p-6">
            <div className="mx-auto max-w-5xl">
              <button
                onClick={() => navigate(user ? `/${user.role}/dashboard` : '/')}
                className="flex items-center gap-2 rounded-lg py-2 px-3 mb-6 text-sm font-medium text-[var(--text-secondary)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] w-max"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
              </button>
              
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
