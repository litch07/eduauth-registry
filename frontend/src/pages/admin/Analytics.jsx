import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Users, FileText, ShieldCheck, Activity, BarChart, LineChart as LineChartIcon, Calendar } from 'lucide-react';
import { LineChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import api from '../../services/api';
import Card from '../../components/shared/Card';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border bg-white p-2 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <p className="font-medium text-gray-900 dark:text-white">{label}</p>
        <p className="text-sm text-primary-600">{`${payload[0].name}: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

export default function AnalyticsDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: responseData } = await api.get(`/admin/analytics?days=${days}`);
        setData(responseData);
      } catch (error) {
        console.error('Failed to fetch analytics data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [days]);

  const renderChart = (chartData, dataKey, name, color) => (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
        <XAxis dataKey="date" stroke="rgb(107, 114, 128)" fontSize={12} />
        <YAxis stroke="rgb(107, 114, 128)" fontSize={12} />
        <Tooltip content={<CustomTooltip />} />
        <Legend />
        <Line type="monotone" dataKey={dataKey} name={name} stroke={color} strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Analytics</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">System Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="input-field max-w-[200px]"
            >
              <option value={7}>Last 7 Days</option>
              <option value={30}>Last 30 Days</option>
              <option value={90}>Last 90 Days</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-[50vh] items-center justify-center">
            <LoadingSpinner />
          </div>
        ) : !data ? (
          <Card>
            <p className="text-center text-gray-500">Could not load analytics data.</p>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
              <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={data.overview.totalUsers} color="blue" to="/admin/users" />
              <StatCard icon={<Users className="h-5 w-5" />} label="Students" value={data.overview.totalStudents} color="primary" to="/admin/users?role=student" />
              <StatCard icon={<Users className="h-5 w-5" />} label="Universities" value={data.overview.totalUniversities} color="blue" to="/admin/users?role=university" />
              <StatCard icon={<Users className="h-5 w-5" />} label="Verifiers" value={data.overview.totalVerifiers} color="primary" to="/admin/users?role=verifier" />
              <StatCard icon={<FileText className="h-5 w-5" />} label="Certificates" value={data.overview.totalCertificates} color="green" to="/admin/certificates" />
              <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Pending Approvals" value={data.overview.pendingApprovals} color="yellow" to="/admin/users?status=pending" urgentCount={data.overview.pendingApprovals} />
              <StatCard icon={<Activity className="h-5 w-5" />} label="Verifications" value={data.overview.totalVerifications} color="red" to="/admin/verification-logs" />
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <LineChartIcon className="h-5 w-5 text-primary-600" />
                  Registrations Trend
                </h2>
                {renderChart(data.trends.registrations, 'count', 'New Users', '#3B82F6')}
              </Card>
              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <LineChartIcon className="h-5 w-5 text-green-600" />
                  Certificates Issued
                </h2>
                {renderChart(data.trends.certificatesIssued, 'count', 'Certificates', '#10B981')}
              </Card>
            </div>

            <Card>
              <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                <LineChartIcon className="h-5 w-5 text-pink-600" />
                Verification Trend
              </h2>
              {renderChart(data.trends.verifications, 'count', 'Verifications', '#EC4899')}
            </Card>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <BarChart className="h-5 w-5 text-indigo-600" />
                  Top 5 Universities by Certificates
                </h2>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.topUniversities} layout="vertical" margin={{ left: 20, right: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                    <XAxis type="number" stroke="rgb(107, 114, 128)" fontSize={12} />
                    <YAxis dataKey="name" type="category" stroke="rgb(107, 114, 128)" fontSize={12} width={80} />
                    <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                    <Bar dataKey="certificates_count" name="Certificates" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card>
                <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                  <Activity className="h-5 w-5 text-gray-600" />
                  Recent Activity
                </h2>
                <div className="max-h-[300px] space-y-3 overflow-y-auto">
                  {data.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <div className="mt-1 h-2.5 w-2.5 flex-shrink-0 rounded-full bg-primary-500"></div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{activity.action.replace(/_/g, ' ')}</p>
                        <p className="text-xs text-gray-500">
                          by {activity.user} - <span className="italic">{new Date(activity.time).toLocaleString()}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
