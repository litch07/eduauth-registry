import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  History, Filter, Download, ChevronLeft, ChevronRight,
  CheckCircle, XCircle, AlertCircle, Eye, Search, X,
  ShieldCheck, Calendar, Building2, Hash, User, Award,
} from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Badge from '../../components/shared/Badge';
import Modal from '../../components/shared/Modal';
import Input from '../../components/shared/Input';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: 'all',      label: 'All Statuses' },
  { value: 'success',  label: 'Verified' },
  { value: 'revoked',  label: 'Revoked' },
  { value: 'not_found', label: 'Not Found' },
  { value: 'dob_mismatch', label: 'DOB Mismatch' },
  { value: 'private_certificate', label: 'Private' },
];

const STATUS_CONFIG = {
  success:          { label: 'Verified',    color: 'success', Icon: CheckCircle },
  not_found:        { label: 'Not Found',   color: 'error',   Icon: XCircle },
  revoked:          { label: 'Revoked',     color: 'warning', Icon: AlertCircle },
  dob_mismatch:     { label: 'DOB Mismatch', color: 'error',  Icon: XCircle },
  private_certificate: { label: 'Private', color: 'warning',  Icon: AlertCircle },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || { label: status, color: 'default' };
  return <Badge variant={cfg.color}>{cfg.label}</Badge>;
}

function DetailRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 dark:border-gray-800 last:border-0">
      {Icon && <Icon className="mt-0.5 h-4 w-4 flex-shrink-0 text-gray-400" />}
      <span className="w-36 flex-shrink-0 text-sm text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-sm font-medium text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

export default function VerificationHistory() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [lastPage, setLastPage] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [selectedLog, setSelectedLog] = useState(null);

  const [stats, setStats] = useState(null);

  // Read ?filter=today from the URL to pre-fill date range inputs
  const getInitialFilters = useCallback(() => {
    const isToday = searchParams.get('filter') === 'today';
    let fromDate = '';
    let toDate = '';
    
    if (isToday) {
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, '0');
      const dd = String(today.getDate()).padStart(2, '0');
      fromDate = `${yyyy}-${mm}-${dd}`;
      toDate = `${yyyy}-${mm}-${dd}`;
    }
    
    return { status: 'all', serial: '', from: fromDate, to: toDate };
  }, [searchParams]);

  const [filters, setFilters] = useState(getInitialFilters);
  const [appliedFilters, setAppliedFilters] = useState(getInitialFilters);

  const fetchHistory = useCallback(async (page = 1, applied = appliedFilters) => {
    setLoading(true);
    try {
      const params = { page, ...applied };
      const { data } = await api.get('/verifier/verifications/history', { params });
      setRows(data.data || []);
      setTotal(data.total || 0);
      setCurrentPage(data.current_page || 1);
      setLastPage(data.last_page || 1);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }, [appliedFilters]);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await api.get('/verifier/dashboard');
      setStats(data.stats);
    } catch {
      // fail silently
    }
  }, []);

  useEffect(() => {
    const initial = getInitialFilters();
    setFilters(initial);
    setAppliedFilters(initial);
    fetchHistory(1, initial);
    fetchStats();
  }, [searchParams, getInitialFilters, fetchStats]);

  const handleApplyFilters = () => {
    setAppliedFilters({ ...filters });
    fetchHistory(1, { ...filters });
  };

  const handleClearFilters = () => {
    const cleared = { status: 'all', serial: '', from: '', to: '' };
    setFilters(cleared);
    setAppliedFilters(cleared);
    fetchHistory(1, cleared);
  };

  const handlePageChange = (page) => {
    fetchHistory(page, appliedFilters);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const params = { ...appliedFilters };
      const response = await api.get('/verifier/verifications/export', {
        params,
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `verifications_export_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch {
      // fail silently
    } finally {
      setExporting(false);
    }
  };

  const filtersActive = appliedFilters.status !== 'all' || appliedFilters.serial || appliedFilters.from || appliedFilters.to;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Verifier</p>
            <h1 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <History className="h-7 w-7 text-primary-600" />
              Verification History
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              All certificate verifications you have performed.
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => navigate('/verifier/verify-certificate')}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Verify Certificate
            </Button>
            <Button onClick={handleExport} loading={exporting} variant="secondary">
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: 'Total', value: stats.total_verifications },
              { label: 'Successful', value: stats.successful_verifications },
              { label: 'Failed', value: stats.failed_verifications },
              { label: 'Today', value: stats.verifications_today },
            ].map((s) => (
              <Card key={s.label} className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{s.value ?? 0}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{s.label}</p>
              </Card>
            ))}
          </div>
        )}

        {/* Filters */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <Filter className="h-4 w-4 text-gray-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h2>
            {filtersActive && (
              <span className="ml-auto flex h-5 w-5 items-center justify-center rounded-full bg-primary-600 text-[10px] font-bold text-white">
                !
              </span>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Status */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            {/* Serial */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Serial Number</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={filters.serial}
                  onChange={(e) => setFilters((f) => ({ ...f, serial: e.target.value.toUpperCase() }))}
                  placeholder="e.g., BSC-26"
                  className="w-full rounded-xl border border-gray-300 bg-white pl-9 pr-3 py-2.5 text-sm font-mono text-gray-900 placeholder-gray-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:placeholder-gray-500"
                />
              </div>
            </div>
            {/* From date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">From Date</label>
              <input
                type="date"
                value={filters.from}
                onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
            {/* To date */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">To Date</label>
              <input
                type="date"
                value={filters.to}
                onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value }))}
                className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={handleApplyFilters} disabled={loading}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
            </Button>
            {filtersActive && (
              <Button variant="secondary" onClick={handleClearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        </Card>

        {/* Table */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Loading...' : `${total} verification${total !== 1 ? 's' : ''} found`}
            </p>
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <LoadingSpinner />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center py-16 gap-4 text-center">
              <div className="h-16 w-16 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                <History className="h-8 w-8 text-gray-300 dark:text-gray-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">No verifications found</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {filtersActive ? 'Try adjusting your filters.' : 'Start verifying certificates to build your history.'}
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    {['Serial Number', 'Student', 'Institution', 'Status', 'Verified At', 'Actions'].map((h) => (
                      <th key={h} className="py-3 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 first:pl-0 last:pr-0 last:text-right">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td className="py-3 px-4 pl-0">
                        <span className="font-mono text-xs font-medium text-gray-900 dark:text-white">{row.serial}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-700 dark:text-gray-300">{row.student_name || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs">{row.institution || '—'}</span>
                      </td>
                      <td className="py-3 px-4">
                        <StatusBadge status={row.status} />
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">{row.verified_at}</span>
                      </td>
                      <td className="py-3 px-4 pr-0 text-right">
                        <button
                          onClick={() => setSelectedLog(row)}
                          className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:border-primary-300 hover:text-primary-600 transition"
                        >
                          <Eye className="h-3.5 w-3.5" />
                          Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {lastPage > 1 && (
            <div className="mt-6 flex items-center justify-between border-t border-gray-100 dark:border-gray-800 pt-4">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Page {currentPage} of {lastPage}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>

                {/* Page numbers */}
                <div className="hidden sm:flex gap-1">
                  {Array.from({ length: Math.min(5, lastPage) }, (_, i) => {
                    const page = Math.max(1, Math.min(currentPage - 2, lastPage - 4)) + i;
                    if (page > lastPage) return null;
                    return (
                      <button
                        key={page}
                        onClick={() => handlePageChange(page)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                          page === currentPage
                            ? 'bg-primary-600 text-white'
                            : 'border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>

                <Button
                  variant="secondary"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= lastPage || loading}
                >
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Details Modal */}
      <Modal
        open={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Verification Details"
        size="lg"
      >
        {selectedLog && (
          <div className="space-y-5">
            {/* Status banner */}
            <div className={`rounded-xl px-4 py-3 flex items-center gap-3 ${
              selectedLog.status === 'success'
                ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                : selectedLog.status === 'revoked'
                ? 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              {(() => {
                const cfg = STATUS_CONFIG[selectedLog.status] || {};
                const Icon = cfg.Icon || ShieldCheck;
                return (
                  <>
                    <Icon className={`h-5 w-5 flex-shrink-0 ${
                      selectedLog.status === 'success' ? 'text-green-600' :
                      selectedLog.status === 'revoked' ? 'text-amber-600' : 'text-red-600'
                    }`} />
                    <div>
                      <p className={`text-sm font-semibold ${
                        selectedLog.status === 'success' ? 'text-green-800 dark:text-green-300' :
                        selectedLog.status === 'revoked' ? 'text-amber-800 dark:text-amber-300' : 'text-red-800 dark:text-red-300'
                      }`}>
                        {cfg.label || selectedLog.status}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedLog.details}</p>
                    </div>
                  </>
                );
              })()}
            </div>

            {/* Certificate details if available */}
            {selectedLog.certificate ? (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Certificate Details</h3>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                  <DetailRow icon={Hash}      label="Serial Number" value={selectedLog.certificate.serial} />
                  <DetailRow icon={User}      label="Student Name"  value={selectedLog.certificate.student_name} />
                  <DetailRow icon={User}      label="Student ID"    value={selectedLog.certificate.student_id} />
                  <DetailRow icon={Award}     label="Degree"        value={selectedLog.certificate.degree_title} />
                  <DetailRow icon={Award}     label="Program"       value={selectedLog.certificate.program_name} />
                  <DetailRow icon={Award}     label="Major"         value={selectedLog.certificate.major} />
                  <DetailRow icon={Award}     label="CGPA"          value={selectedLog.certificate.cgpa} />
                  <DetailRow icon={Building2} label="Institution"   value={selectedLog.certificate.institution} />
                  <DetailRow icon={Calendar}  label="Issue Date"    value={selectedLog.certificate.issue_date} />
                </div>
              </div>
            ) : (
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Search Details</h3>
                <div className="rounded-xl border border-gray-100 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800 px-4">
                  <DetailRow icon={Hash}     label="Serial Searched"  value={selectedLog.serial} />
                  <DetailRow icon={Calendar} label="Verified At"      value={selectedLog.verified_at} />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs text-gray-400">Verified: {selectedLog.verified_at}</span>
              <Button variant="secondary" onClick={() => setSelectedLog(null)}>Close</Button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardLayout>
  );
}
