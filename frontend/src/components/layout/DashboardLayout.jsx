import { useState } from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--bg-base)]">
      <Navbar onMenuClick={() => setSidebarOpen((current) => !current)} />
      <div className="flex">
        <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <main className="min-w-0 flex-1 transition-all duration-200 lg:ml-[240px] pt-[56px]">
          <div className="min-h-[calc(100vh-56px)] p-6">
            <div className="mx-auto max-w-6xl space-y-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
