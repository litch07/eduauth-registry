import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import StatCard from '../../components/shared/StatCard';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import { Users, FileText, ShieldCheck, Activity, BarChart as BarChartIcon, LineChart as LineChartIcon, Calendar, GraduationCap, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
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
            {/* PLATFORM OVERVIEW */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Platform Overview</h2>
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                <StatCard icon={<Users className="h-5 w-5" />} label="Users" value={data.overview.totalUsers} color="blue" to="/admin/users" />
                <StatCard icon={<Users className="h-5 w-5" />} label="Students" value={data.overview.totalStudents} color="primary" to="/admin/users?role=student" />
                <StatCard icon={<Users className="h-5 w-5" />} label="Universities" value={data.overview.totalUniversities} color="blue" to="/admin/users?role=university" />
                <StatCard icon={<Users className="h-5 w-5" />} label="Verifiers" value={data.overview.totalVerifiers} color="primary" to="/admin/users?role=verifier" />
                <StatCard icon={<FileText className="h-5 w-5" />} label="Certificates" value={data.overview.totalCertificates} color="green" to="/admin/certificates" />
                <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Pending Approvals" value={data.overview.pendingApprovals} color="yellow" to="/admin/users?status=pending" urgentCount={data.overview.pendingApprovals} />
                <StatCard icon={<Activity className="h-5 w-5" />} label="Verifications" value={data.overview.totalVerifications} color="red" to="/admin/verification-logs" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <LineChartIcon className="h-5 w-5 text-primary-600" />
                    Registrations Trend
                  </h3>
                  {renderChart(data.trends.registrations, 'count', 'New Users', '#3B82F6')}
                </Card>
                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <LineChartIcon className="h-5 w-5 text-green-600" />
                    Certificates Issued
                  </h3>
                  {renderChart(data.trends.certificatesIssued, 'count', 'Certificates', '#10B981')}
                </Card>
              </div>
              
              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <BarChartIcon className="h-5 w-5 text-indigo-600" />
                    Top 5 Universities by Certificates
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.topUniversities} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                      <XAxis type="number" stroke="rgb(107, 114, 128)" fontSize={12} />
                      <YAxis dataKey="name" type="category" stroke="rgb(107, 114, 128)" fontSize={12} width={80} />
                      <Tooltip cursor={{ fill: 'rgba(128, 128, 128, 0.1)' }} />
                      <Bar dataKey="certificates_count" name="Certificates" fill="#4F46E5" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <Activity className="h-5 w-5 text-gray-600" />
                    Recent Activity
                  </h3>
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
                    {data.recentActivity.length === 0 && (
                      <p className="text-sm text-gray-500 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </Card>
              </div>
            </div>

            {/* UNIVERSITY & ENROLLMENT ANALYTICS */}
            <div className="mb-8">
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">University & Enrollment Analytics</h2>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                 <StatCard icon={<Users className="h-5 w-5" />} label="Active Enrollments" value={data.universityAnalytics.totalActiveStudents} color="primary" />
                 <StatCard icon={<FileText className="h-5 w-5" />} label="Certificates Issued (All Time)" value={data.universityAnalytics.certificatesIssuedAllTime} color="green" />
                 <StatCard icon={<FileText className="h-5 w-5" />} label="Certificates (This Month)" value={data.universityAnalytics.certificatesIssuedThisMonth} color="blue" />
                 <StatCard icon={<GraduationCap className="h-5 w-5" />} label="Avg. Graduation Rate" value={`${data.universityAnalytics.perUniversitySummary.length > 0 ? (data.universityAnalytics.perUniversitySummary.reduce((acc, curr) => acc + curr.graduation_rate, 0) / data.universityAnalytics.perUniversitySummary.length).toFixed(1) : 0}%`} color="purple" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <BarChartIcon className="h-5 w-5 text-indigo-600" />
                    Enrollment Trend (Past 12 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.universityAnalytics.enrollmentTrend} margin={{ left: -20, right: 10 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                      <XAxis dataKey="month" stroke="rgb(107, 114, 128)" fontSize={12} />
                      <YAxis stroke="rgb(107, 114, 128)" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Enrollments" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <BarChartIcon className="h-5 w-5 text-purple-600" />
                    Top 10 Programs by Enrollment
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.universityAnalytics.departmentBreakdown} layout="vertical" margin={{ left: 20, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                      <XAxis type="number" stroke="rgb(107, 114, 128)" fontSize={12} />
                      <YAxis dataKey="program" type="category" stroke="rgb(107, 114, 128)" fontSize={12} width={100} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" name="Enrollments" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <Card className="mt-6">
                <h3 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Per-University Summary</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                      <tr>
                        <th className="px-4 py-3">Institution</th>
                        <th className="px-4 py-3 text-right">Enrolled Students</th>
                        <th className="px-4 py-3 text-right">Certificates Issued</th>
                        <th className="px-4 py-3 text-right">Graduation Rate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.universityAnalytics.perUniversitySummary.map((inst, i) => (
                        <tr key={i} className="border-b dark:border-gray-700">
                          <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{inst.name}</td>
                          <td className="px-4 py-3 text-right">{inst.enrolled}</td>
                          <td className="px-4 py-3 text-right">{inst.issued}</td>
                          <td className="px-4 py-3 text-right">{inst.graduation_rate}%</td>
                        </tr>
                      ))}
                      {data.universityAnalytics.perUniversitySummary.length === 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No university data available</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>

            {/* VERIFIER & VERIFICATION ANALYTICS */}
            <div>
              <h2 className="mb-4 text-xl font-bold text-gray-900 dark:text-white border-b pb-2 dark:border-gray-700">Verifier & Verification Analytics</h2>
              
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-4">
                 <StatCard icon={<ShieldCheck className="h-5 w-5" />} label="Total Verifications" value={data.verifierAnalytics.totalVerifications} color="blue" />
                 <StatCard icon={<Clock className="h-5 w-5" />} label="Verifications This Month" value={data.verifierAnalytics.verificationsThisMonth} color="primary" />
                 <StatCard icon={<Users className="h-5 w-5" />} label="Active Access Grants" value={data.verifierAnalytics.activeAccessGrants} color="green" />
                 <StatCard icon={<CheckCircle className="h-5 w-5" />} label="Success Rate" value={`${data.verifierAnalytics.verificationSuccessRate}%`} color="purple" />
              </div>

              <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <LineChartIcon className="h-5 w-5 text-pink-600" />
                    Verification Trend (Past 12 Months)
                  </h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={data.verifierAnalytics.verificationTrend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.3)" />
                      <XAxis dataKey="month" stroke="rgb(107, 114, 128)" fontSize={12} />
                      <YAxis stroke="rgb(107, 114, 128)" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend />
                      <Line type="monotone" dataKey="count" name="Verifications" stroke="#EC4899" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 6 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                    Top 5 Verified Institutions
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400">
                      <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                          <th className="px-4 py-3">Institution</th>
                          <th className="px-4 py-3 text-right">Verifications</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.verifierAnalytics.mostVerifiedInstitutions.map((inst, i) => (
                          <tr key={i} className="border-b dark:border-gray-700">
                            <td className="px-4 py-3 font-medium text-gray-900 dark:text-white flex items-center gap-2">
                              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
                                {i + 1}
                              </div>
                              {inst.name}
                            </td>
                            <td className="px-4 py-3 text-right font-semibold">{inst.verifications_count}</td>
                          </tr>
                        ))}
                        {data.verifierAnalytics.mostVerifiedInstitutions.length === 0 && (
                          <tr>
                            <td colSpan="2" className="px-4 py-8 text-center text-gray-500">No verification data available</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}
