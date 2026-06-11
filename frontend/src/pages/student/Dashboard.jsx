import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { BookCopy, CheckCircle2, Clock3, Bell, GraduationCap, ArrowRight, ShieldCheck, MailPlus, Activity, Award, Globe, Clock, CheckCircle } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import StatCard from '../../components/shared/StatCard';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import ToggleSwitch from '../../components/shared/ToggleSwitch';
import api from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { formatDate } from '../../utils/helpers';

export default function StudentDashboard() {
  const [stats, setStats] = useState(null);
  const [pendingAccessRequests, setPendingAccessRequests] = useState(0);
  const [pendingRequestsList, setPendingRequestsList] = useState([]);
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
        setPendingRequestsList(accessData.pending_requests || []);
      } catch (error) {
        console.error('Failed to fetch dashboard:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  const handleToggleVisibility = async (certificateId) => {
    try {
      const { data } = await api.post(`/student/certificates/${certificateId}/toggle-visibility`);
      if (data.success) {
         const { data: dashboardData } = await api.get('/student/dashboard');
         setStats(dashboardData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex min-h-[50vh] items-center justify-center">
          <LoadingSpinner />
        </div>
      </DashboardLayout>
    );
  }

  const recentCertificates = stats?.recent_certificates || [];

  return (
    <DashboardLayout>
      <div className="space-y-[24px]">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">
              Student Dashboard
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              Welcome back{user?.name ? `, ${user.name}` : ''}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-[24px] grid-cols-2 lg:grid-cols-4">
          <StatCard 
            icon={<Award className="h-5 w-5" />} 
            label="Total Certificates" 
            value={stats?.stats?.total_certificates ?? 0} 
            color="primary" 
            to="/student/certificates"
          />
          <StatCard 
            icon={<Globe className="h-5 w-5" />} 
            label="Public Certificates" 
            value={stats?.stats?.public_certificates ?? 0} 
            color="success" 
            to="/student/certificates?filter=public"
          />
          <StatCard 
            icon={<Clock className="h-5 w-5" />} 
            label="Pending Access Requests" 
            value={stats?.stats?.pending_access_requests ?? 0} 
            color="warning" 
            to="/student/access-requests?tab=pending"
          />
          <StatCard 
            icon={<CheckCircle className="h-5 w-5" />} 
            label="Active Access Grants" 
            value={stats?.stats?.active_access_grants ?? 0} 
            color="info" 
            to="/student/access-requests?tab=granted"
          />
        </div>

        {/* Below Stats Grid */}
        <div className="grid gap-[24px] grid-cols-1 lg:grid-cols-2">
          {/* Left Column (Recent Certificates) */}
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-[24px]">Recent Certificates</h2>
            <div className="space-y-[24px]">
              {recentCertificates.length > 0 ? (
                recentCertificates.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="flex items-center justify-between border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="primary">{cert.degree_title}</Badge>
                      </div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{cert.institution_name}</p>
                      <p className="text-xs text-[var(--text-muted)]">Issued: {formatDate(cert.issue_date)}</p>
                    </div>
                    <div>
                      <ToggleSwitch
                        checked={cert.is_public}
                        onChange={() => handleToggleVisibility(cert.id)}
                        label="Public"
                      />
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No recent certificates" message="You don't have any certificates yet." />
              )}
            </div>
            <div className="mt-[24px] pt-[24px] border-t border-[var(--border)] text-center">
              <Link to="/student/certificates" className="text-sm font-semibold text-[var(--brand)] hover:text-[var(--brand-light)]">
                View all certificates
              </Link>
            </div>
          </Card>

          {/* Right Column (Pending Access Requests) */}
          <Card>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-[24px]">Pending Access Requests</h2>
            <div className="space-y-[24px]">
              {pendingRequestsList.length > 0 ? (
                pendingRequestsList.map((req) => (
                  <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{req.verifier?.company_name}</p>
                      <p className="text-sm text-[var(--text-secondary)] mt-1">{req.purpose}</p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">{formatDate(req.created_at)}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => navigate('/student/access-requests?tab=pending')}>
                        Approve
                      </Button>
                      <Button size="sm" variant="danger" onClick={() => navigate('/student/access-requests?tab=pending')}>
                        Reject
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState title="No pending requests" message="You have no pending access requests." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
