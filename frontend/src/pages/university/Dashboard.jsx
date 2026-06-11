import { useEffect, useState } from 'react';
import { FilePlus2, School, ShieldCheck, AlertTriangle, MessageSquare, ArrowRight, Users, UserCheck, Award, Calendar, BookOpen, Clock, UserPlus } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function UniversityDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const { data } = await api.get('/university/dashboard');
        setStats(data);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return <DashboardLayout><div className="flex min-h-[50vh] items-center justify-center"><LoadingSpinner /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">University Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Users className="h-5 w-5" />} 
            label="Total Enrolled" 
            value={stats?.stats?.total_enrolled ?? 0} 
            color="primary" 
            to="/university/enrollments?filter=active" 
          />
          <StatCard 
            icon={<Award className="h-5 w-5" />} 
            label="Certificates Issued" 
            value={stats?.stats?.total_certificates ?? 0} 
            color="blue" 
            to="/university/certificates" 
          />
          <StatCard 
            icon={<AlertTriangle className="h-5 w-5" />} 
            label="Pending Withdrawals" 
            value={stats?.stats?.pending_withdrawals ?? 0} 
            color="orange" 
            to="/university/enrollments?tab=withdrawals" 
            urgentCount={stats?.stats?.pending_withdrawals ?? 0}
            tooltip="Click to manage pending requests"
          />
          <StatCard 
            icon={<UserPlus className="h-5 w-5" />} 
            label="Pending Applications" 
            value={stats?.stats?.pending_enrollment_applications ?? 0} 
            color="purple" 
            to="/university/enrollments?tab=applications" 
            urgentCount={stats?.stats?.pending_enrollment_applications ?? 0}
            tooltip="Review new enrollment applications"
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-3 mt-6">
          <div className="lg:col-span-2">
            <Card className="h-full flex flex-col p-0 overflow-hidden">
              <div className="border-b border-gray-100 dark:border-gray-800 px-6 py-5">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Recent Enrollments</h2>
              </div>
              <div className="flex-1 overflow-y-auto overflow-x-auto max-h-[240px]">
                <table className="min-w-full divide-y divide-gray-100 dark:divide-gray-800 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0 z-10">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-300">Student</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-300">Program</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-300">Enrolled</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-900 dark:text-gray-300">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats?.recent_enrollments && stats.recent_enrollments.length > 0 ? (
                      stats.recent_enrollments.slice(0, 10).map((enr) => (
                        <tr key={enr.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                          <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{enr.student_name || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{enr.program || 'N/A'}</td>
                          <td className="px-6 py-4 text-gray-500 dark:text-gray-400">
                            {enr.enrollment_date ? new Date(enr.enrollment_date).toLocaleDateString('en-GB') : 'N/A'}
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant={enr.status === 'active' ? 'success' : enr.status === 'graduated' ? 'primary' : 'warning'}>
                              {String(enr.status || 'unknown').toUpperCase()}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                          No recent enrollments to display.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-gray-100 dark:border-gray-800 px-6 py-3 bg-gray-50 dark:bg-gray-800/30 flex justify-end mt-auto">
                <button onClick={() => navigate('/university/enrollments')} className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 flex items-center gap-1 group">
                  View All <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </button>
              </div>
            </Card>
          </div>
          
          <div className="lg:col-span-1">
            <Card className="h-full bg-gradient-to-br from-white to-gray-50 dark:from-gray-900 dark:to-gray-800/80">
              <div className="px-6 py-1">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Quick Actions</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 mb-6">Common operations.</p>
                
                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/university/enrollments?action=enroll')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-primary-100 bg-primary-50 hover:bg-primary-100 hover:border-primary-200 transition-colors text-left dark:border-primary-900/30 dark:bg-primary-900/20 dark:hover:bg-primary-900/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary-600 text-white shadow-sm">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-primary-900 dark:text-primary-100">Enroll Student</span>
                        <span className="block text-xs text-primary-700 dark:text-primary-300">Add a new student</span>
                      </div>
                    </div>
                  </button>
                  
                  <button
                    onClick={() => navigate('/university/issue-certificate')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                        <FilePlus2 className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">Issue Certificate</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Generate new certificate</span>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => navigate('/university/enrollments?tab=withdrawals')}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 hover:border-gray-300 transition-colors text-left dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700/80"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                        <AlertTriangle className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="block text-sm font-semibold text-gray-900 dark:text-white">Review Withdrawals</span>
                        <span className="block text-xs text-gray-500 dark:text-gray-400">Manage pending requests</span>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
