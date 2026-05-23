import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { CheckCircle, XCircle, AlertCircle, ShieldCheck, MailPlus, ArrowRight, FileText } from 'lucide-react';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

export default function VerifierDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [activeAccessCount, setActiveAccessCount] = useState(0);
  const [pendingRequestCount, setPendingRequestCount] = useState(0);
  const [approvedRequestCount, setApprovedRequestCount] = useState(0);
  const [rejectedRequestCount, setRejectedRequestCount] = useState(0);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      setDashboardLoading(true);
      const [{ data: dashboardData }, { data: requestsData }, { data: accessData }] = await Promise.all([
        api.get('/verifier/dashboard'),
        api.get('/verifier/access-requests'),
        api.get('/verifier/accessible-students'),
      ]);

      setStats(dashboardData.stats);
      setPendingRequestCount((requestsData.requests || []).filter((request) => request.status === 'pending').length);
      setApprovedRequestCount((requestsData.requests || []).filter((request) => request.status === 'approved').length);
      setRejectedRequestCount((requestsData.requests || []).filter((request) => request.status === 'rejected').length);
      setActiveAccessCount((accessData.accesses || []).filter((access) => access.is_active && !access.revoked_at && new Date(access.expires_at) > new Date()).length);
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
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Verifier Dashboard</p>
          <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </h1>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
          <StatCard
            icon={<ShieldCheck className="h-5 w-5" />}
            label="Accessible Students"
            value={activeAccessCount}
            color="primary"
            to="/verifier/accessible-certificates"
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
          <StatCard
            icon={<FileText className="h-5 w-5" />}
            label="Verifications Today"
            value={stats?.verifications_today || 0}
            color="emerald"
            to="/verifier/verification-history?filter=today"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Total Verifications"
            value={stats?.total_verifications || 0}
            color="blue"
            to="/verifier/verification-history"
          />
          <StatCard
            icon={<CheckCircle className="h-5 w-5" />}
            label="Approved Requests"
            value={approvedRequestCount}
            color="green"
            to="/verifier/access-requests?filter=approved"
          />
          <StatCard
            icon={<XCircle className="h-5 w-5" />}
            label="Rejected Requests"
            value={rejectedRequestCount}
            color="red"
            to="/verifier/access-requests?filter=rejected"
          />
        </div>

        <Card>
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Access requests</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Request access to student certificates or review your current permissions.</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => navigate('/verifier/access-requests')}
              >
                Request Access
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button
                variant="secondary"
                onClick={() => navigate('/verifier/accessible-certificates')}
              >
                View Access
              </Button>
            </div>
          </div>
        </Card>

        {/* Verify Certificate CTA */}
        <div>
          <Card className="flex flex-col sm:flex-row items-center gap-6 bg-gradient-to-br from-primary-600 to-primary-700 text-white border-0">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-2xl bg-white/20">
              <ShieldCheck className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-xl font-bold">Verify a Certificate</h2>
              <p className="mt-1 text-sm text-primary-100">
                Use the dedicated verification page to check certificate authenticity, paste share links, and view your history.
              </p>
            </div>
            <Button
              onClick={() => navigate('/verifier/verify-certificate')}
              variant="custom"
              className="bg-white text-primary-700 hover:bg-primary-100 hover:text-primary-800 border-0 shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
            >
              Go to Verification
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
