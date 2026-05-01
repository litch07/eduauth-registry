import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import { Users, ShieldCheck, FileText, Activity } from 'lucide-react';

export default function AdminDashboard() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary-600">Admin Dashboard</p>
          <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">System controls and approvals</h1>
        </div>

        <div className="grid gap-6 md:grid-cols-4">
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Users</p><p className="mt-2 text-3xl font-bold">0</p></div><Users className="h-12 w-12 text-primary-600" /></div></Card>
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Approvals</p><p className="mt-2 text-3xl font-bold">0</p></div><ShieldCheck className="h-12 w-12 text-green-600" /></div></Card>
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Certificates</p><p className="mt-2 text-3xl font-bold">0</p></div><FileText className="h-12 w-12 text-blue-600" /></div></Card>
          <Card><div className="flex items-center justify-between gap-4"><div><p className="text-sm text-gray-500 dark:text-gray-400">Activity</p><p className="mt-2 text-3xl font-bold">0</p></div><Activity className="h-12 w-12 text-yellow-600" /></div></Card>
        </div>

        <Card>
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Administrative actions</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">Approve users, review logs, and manage certificate integrity.</p>
        </Card>
      </div>
    </DashboardLayout>
  );
}
