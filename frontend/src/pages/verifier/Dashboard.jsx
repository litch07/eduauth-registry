import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, ShieldCheck, MailPlus, ArrowRight, FileText, Search, Clock, History } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

const STATUS_CONFIG = {
  success: { label: 'Verified', color: 'success', icon: CheckCircle, bg: 'green' },
  not_found: { label: 'Not Found', color: 'error', icon: XCircle, bg: 'red' },
  revoked: { label: 'Revoked', color: 'warning', icon: AlertCircle, bg: 'amber' },
  dob_mismatch: { label: 'Not Found', color: 'error', icon: XCircle, bg: 'red' },
  private_certificate: { label: 'Private', color: 'warning', icon: AlertCircle, bg: 'amber' },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Badge variant={cfg.color}>{cfg.label}</Badge>;
}

export default function VerifierDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeAccessCount, setActiveAccessCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [approvedRequestCount, setApprovedRequestCount] = useState(0);
  const [rejectedRequestCount, setRejectedRequestCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [recentVerifications, setRecentVerifications] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const [{ data: dashboardData }, { data: requestsData }, { data: accessData }, { data: verificationsData }] = await Promise.all([
        api.get('/verifier/dashboard'),
        api.get('/verifier/access-requests'),
        api.get('/verifier/accessible-students'),
        api.get('/verifier/verifications/recent').catch(() => ({ data: { verifications: [] } }))
      ]);

      setStats(dashboardData.stats);
      setPendingRequestCount((requestsData.requests || []).filter((request) => request.status === 'pending').length);
      setApprovedRequestCount((requestsData.requests || []).filter((request) => request.status === 'approved').length);
      setRejectedRequestCount((requestsData.requests || []).filter((request) => request.status === 'rejected').length);
      setActiveAccessCount((accessData.accesses || []).filter((access) => access.is_active && !access.revoked_at && new Date(access.expires_at) > new Date()).length);
      setRecentVerifications(verificationsData.verifications || []);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setDashboardLoading(false);
    }
  };



  if (dashboardLoading) {
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
      <div className="space-y-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Verifier Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Total Verifications"
            value={stats?.total_verifications || 0}
            color="blue"
            to="/verifier/verification-history"
          />
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Verifications This Month"
            value={stats?.verifications_this_month || stats?.verifications_today || 0}
            color="emerald"
            to="/verifier/verification-history"
          />
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Active Access Grants"
            value={activeAccessCount}
            color="primary"
            to="/verifier/access-requests?filter=approved"
          />
          <StatCard
            icon={<MailPlus className="h-5 w-5" />}
            label="Pending Requests"
            value={pendingRequestCount}
            color="orange"
            to="/verifier/access-requests?filter=pending"
            urgentCount={pendingRequestCount}
            tooltip="Click to view pending requests"
          />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          {/* Left: Recent Verifications list */}
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between mb-4 border-b pb-4 dark:border-gray-800">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Clock className="h-5 w-5 text-primary-600" />
                Recent Verifications
              </h2>
              <Button variant="ghost" size="sm" onClick={() => navigate('/verifier/verification-history')}>
                View All
              </Button>
            </div>

            {recentVerifications.length === 0 ? (
              <div className="flex-1 flex flex-col justify-center items-center py-8 text-center">
                <div className="h-12 w-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-3">
                  <History className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  No recent verifications available. <br />
                  Start verifying certificates to see your history.
                </p>
              </div>
            ) : (
              <div className="space-y-2 flex-1 overflow-y-auto pr-2 max-h-[260px]" style={{ scrollbarWidth: 'thin' }}>
                {recentVerifications.slice(0, 10).map((item) => {
                  const cfg = STATUS_CONFIG[item.status] || { label: item.status, color: 'default', bg: 'gray' };
                  const StatusIcon = cfg.icon || ShieldCheck;
                  return (
                    <button
                      key={item.id}
                      onClick={() => navigate('/verifier/verification-history')}
                      className="w-full rounded-xl border border-gray-100 dark:border-gray-800 hover:border-primary-200 dark:hover:border-primary-700 px-3 py-3 text-left transition hover:bg-gray-50 dark:hover:bg-gray-800/50 group"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-${cfg.bg}-100 dark:bg-${cfg.bg}-900/30`}>
                          <StatusIcon className={`h-4 w-4 text-${cfg.bg}-600 dark:text-${cfg.bg}-400`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-mono font-medium text-gray-900 dark:text-white truncate">
                            {item.serial_masked || item.serial}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {item.student_name || 'Unknown Student'}
                            {item.institution && ` · ${item.institution}`}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <StatusBadge status={item.status} />
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {timeAgo(item.verified_at)}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Right: Quick Actions */}
          <div className="space-y-6">
            <Card className="flex flex-col h-full bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0 shadow-lg relative overflow-hidden">
              {/* Decorative elements */}
              <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white opacity-10 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 -mb-4 -ml-4 h-24 w-24 rounded-full bg-white opacity-10 blur-xl"></div>

              <h2 className="text-xl font-bold mb-2 relative z-10">Quick Actions</h2>
              <p className="text-primary-100 text-sm mb-6 relative z-10">
                Access your most common tasks instantly from here.
              </p>

              <div className="space-y-3 relative z-10">
                <button
                  onClick={() => navigate('/verifier/verify-certificate')}
                  className="w-full flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/20 p-4 transition-colors backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="h-5 w-5 text-white" />
                    <span className="font-medium text-white text-sm">Verify a Certificate</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </button>

                <button
                  onClick={() => navigate('/verifier/access-requests', { state: { autoOpenRequestModal: true } })}
                  className="w-full flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/20 p-4 transition-colors backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <Search className="h-5 w-5 text-white" />
                    <span className="font-medium text-white text-sm">Request Access</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </button>

                <button
                  onClick={() => navigate('/verifier/verification-history')}
                  className="w-full flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/20 p-4 transition-colors backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <History className="h-5 w-5 text-white" />
                    <span className="font-medium text-white text-sm">View Verification History</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </button>

                <button
                  onClick={() => navigate('/verifier/access-requests')}
                  className="w-full flex items-center justify-between rounded-xl bg-white/10 hover:bg-white/20 p-4 transition-colors backdrop-blur-sm border border-white/10"
                >
                  <div className="flex items-center gap-3">
                    <MailPlus className="h-5 w-5 text-white" />
                    <span className="font-medium text-white text-sm">Manage Access Requests</span>
                  </div>
                  <ArrowRight className="h-4 w-4 text-white/70" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
