import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookCopy, CheckCircle2, Clock3, Bell, GraduationCap, ArrowRight, ShieldCheck, MailPlus, Activity } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [{ data: dashboardData }, { data: accessData }] = await Promise.all([
          api.get('/student/dashboard'),
          api.get('/student/access-requests'),
        ]);

        setStats(dashboardData);
        setPendingAccessRequests((accessData.pending_requests || []).length);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Student Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard 
            icon={<BookCopy className="h-5 w-5" />} 
            label="Total Certificates" 
            value={stats?.stats?.total_certificates ?? 0} 
            color="primary" 
            to="/student/certificates"
            tooltip="Click to view all certificates"
          />
          <StatCard 
            icon={<CheckCircle2 className="h-5 w-5" />} 
            label="Public Certificates" 
            value={stats?.stats?.public_certificates ?? 0} 
            color="green" 
            to="/student/certificates?filter=public"
          />
          <StatCard 
            icon={<Clock3 className="h-5 w-5" />} 
            label="Private Certificates" 
            value={stats?.stats?.private_certificates ?? 0} 
            color="yellow" 
            to="/student/certificates?filter=private"
          />
          <StatCard 
            icon={<MailPlus className="h-5 w-5" />} 
            label="Pending Access Requests" 
            value={stats?.stats?.pending_access_requests ?? 0} 
            color="orange" 
            to="/student/access-requests?tab=pending"
            urgentCount={stats?.stats?.pending_access_requests ?? 0}
            tooltip="Click to manage pending requests"
          />
          <StatCard 
            icon={<ShieldCheck className="h-5 w-5" />} 
            label="Active Access Grants" 
            value={stats?.stats?.active_access_grants ?? 0} 
            color="emerald" 
            to="/student/access-requests?tab=granted"
          />
          <StatCard 
            icon={<GraduationCap className="h-5 w-5" />} 
            label="Current Enrollment" 
            value={stats?.current_enrollment?.institution_name || 'Not Enrolled'} 
            color="blue" 
            to="/student/my-university"
          />
        </div>

        {/* Dashboard Grid */}
        <div className={`grid gap-6 items-start ${stats?.current_enrollment ? 'lg:grid-cols-3' : 'grid-cols-1'}`}>
          {/* Left Column (University Enrollment) - 2fr / lg:col-span-2 */}
          {stats?.current_enrollment && (
            <div className="space-y-6 lg:col-span-2">
              <Card className="border-l-4 border-l-primary-500">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <GraduationCap className="h-5 w-5 text-primary-500" />
                    Current Enrollment
                  </h2>
                  {stats.current_enrollment.status === 'withdrawal_requested' ? (
                    <Badge variant="warning">Withdrawal Pending</Badge>
                  ) : (
                    <Badge variant="success">Active</Badge>
                  )}
                </div>

                <div className="space-y-4 text-sm">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-505">Institution</p>
                      <p className="font-semibold text-gray-900 dark:text-white mt-1 text-base">
                        {stats.current_enrollment.institution_name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-550">Program</p>
                      <p className="font-semibold text-gray-900 dark:text-white mt-1 text-base">
                        {stats.current_enrollment.program}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Batch</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                        {stats.current_enrollment.batch}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Roll/ID</p>
                      <p className="font-mono text-gray-700 dark:text-gray-300 mt-1">
                        {stats.current_enrollment.enrollment_number}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Enrollment Date</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                        {stats.current_enrollment.enrollment_date
                          ? new Date(stats.current_enrollment.enrollment_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Expected Grad</p>
                      <p className="font-medium text-gray-700 dark:text-gray-300 mt-1">
                        {stats.current_enrollment.expected_graduation_date
                          ? new Date(stats.current_enrollment.expected_graduation_date).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex justify-end">
                    <Button
                      variant="secondary"
                      onClick={() => navigate('/student/my-university')}
                      className="px-6"
                    >
                      Manage Enrollment
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Right Column (Recent Activity) - 1fr / lg:col-span-1 */}
          <div className={`space-y-6 ${stats?.current_enrollment ? 'lg:col-span-1' : ''}`}>
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Activity className="h-4.5 w-4.5 text-primary-500" />
                  Recent Activity
                </h2>
                {(stats?.recent_activities?.length > 0) && (
                  <button
                    onClick={() => navigate('/settings?tab=activity')}
                    className="text-xs font-medium text-primary-600 hover:text-primary-700 transition"
                  >
                    View all →
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {(stats?.recent_activities || []).map((activity) => (
                  <div key={activity.id} className="flex flex-col gap-1 rounded-xl border border-gray-200 p-3.5 dark:border-gray-700 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:border-primary-500/50 dark:hover:border-primary-500/50 transition duration-200">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                ))}
                {(!stats?.recent_activities || stats.recent_activities.length === 0) && (
                  <div className="py-8 text-center">
                    <p className="text-xs text-gray-550 dark:text-gray-400">No activity logged yet.</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
