import Sidebar from './Sidebar';
import TopHeader from './TopHeader';

function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <Sidebar />

      {/* Top Header */}
      <TopHeader />

      {/* Main Content Area */}
      <main className="ml-64 pt-16 flex-1 overflow-y-auto">
        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  );
}

export default DashboardLayout;
