import React, { useState, useEffect } from 'react';
import { BarChart, Globe, TrendingUp, XCircle, Loader2 } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

const VerificationAnalytics = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/admin/verification-analytics');
      setAnalytics(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch analytics');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary dark:text-blue-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-gray-300">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 px-4 py-10">
        <div className="mx-auto max-w-6xl">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const totalVerifications = analytics?.totalVerifications || 0;
  const byCountry = analytics?.verificationsByCountry || [];
  const topCertificates = analytics?.mostVerifiedCertificates || [];
  const topCountry = byCountry.length > 0 ? byCountry[0] : null;
  const daysActive = Math.max(1, Math.ceil((new Date() - new Date('2025-01-01')) / (1000 * 60 * 60 * 24)));
  const avgPerDay = (totalVerifications / daysActive).toFixed(1);

  // Calculate percentages for country list
  const countryPercentages = byCountry.map(item => ({
    ...item,
    percentage: totalVerifications > 0 ? Math.round((item.count / totalVerifications) * 100) : 0
  }));

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Analytics</h1>
            <p className="text-slate-600 dark:text-gray-300">Certificate verification trends and patterns.</p>
          </div>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-700 transition"
          >
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Verifications */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-gray-300">Total Verifications</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {totalVerifications.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-blue-100 dark:bg-blue-900/40 p-3 text-blue-600 dark:text-blue-300">
                <TrendingUp className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Average per Day */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-gray-300">Average per Day</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{avgPerDay}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">verifications/day</p>
              </div>
              <div className="rounded-lg bg-green-100 dark:bg-green-900/40 p-3 text-green-600 dark:text-green-300">
                <BarChart className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Most Active Country */}
          <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-gray-300">Most Active Country</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">
                  {topCountry?.country || 'N/A'}
                </p>
                <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                  {topCountry?.count || 0} verifications
                </p>
              </div>
              <div className="rounded-lg bg-purple-100 dark:bg-purple-900/40 p-3 text-purple-600 dark:text-purple-300">
                <Globe className="h-6 w-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Top Verified Certificates */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Top Verified Certificates</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">Most frequently verified certificates</p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700/50">
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Serial</th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200">Certificate Name</th>
                  <th className="px-6 py-3 text-right text-xs font-semibold text-slate-700 dark:text-gray-200">Verifications</th>
                </tr>
              </thead>
              <tbody>
                {topCertificates.slice(0, 10).map((cert, index) => (
                  <tr key={index} className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition">
                    <td className="px-6 py-4">
                      <code className="text-sm font-mono text-slate-900 dark:text-gray-100 bg-slate-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {cert.serial}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900 dark:text-gray-100">{cert.certificateName}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-200 text-sm font-medium">
                        {cert.verificationCount}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Verifications by Country */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Verifications by Country</h2>
            <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">Geographic distribution of verifications</p>
          </div>
          <div className="divide-y divide-slate-200 dark:divide-gray-700">
            {countryPercentages.slice(0, 10).map((item, index) => (
              <div key={index} className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-700/40 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-900 dark:text-white">{item.country}</span>
                  <span className="text-sm text-slate-600 dark:text-gray-300">{item.count} ({item.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full transition-all"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Empty State */}
        {totalVerifications === 0 && (
          <div className="rounded-xl bg-slate-50 dark:bg-gray-800 border-2 border-dashed border-slate-300 dark:border-gray-700 p-12 text-center">
            <Globe className="h-12 w-12 text-slate-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-white">No Verification Data</h3>
            <p className="text-slate-600 dark:text-gray-300 mt-2">Verifications will appear here once certificates are verified publicly.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default VerificationAnalytics;
