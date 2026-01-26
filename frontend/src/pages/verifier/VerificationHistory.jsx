import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, Calendar, Award, Eye, ChevronLeft, ChevronRight, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';

const VerificationHistory = () => {
  // States
  const [verifications, setVerifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState({ total: 0, thisWeek: 0, thisMonth: 0 });
  
  // Filter states
  const [filters, setFilters] = useState({
    serial: '',
    dateFrom: '',
    dateTo: '',
    level: 'All'
  });

  const [showModal, setShowModal] = useState(false);
  const [selectedVerification, setSelectedVerification] = useState(null);

  const limit = 10;

  // Fetch verification history
  const fetchVerifications = async (currentPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        page: currentPage,
        limit
      };
      if (filters.serial) params.serial = filters.serial;
      if (filters.dateFrom) params.dateFrom = filters.dateFrom;
      if (filters.dateTo) params.dateTo = filters.dateTo;
      if (filters.level !== 'All') params.level = filters.level;

      const response = await api.get('/verifier/verification-history', { params });

      setVerifications(response.data.verifications || []);
      setPage(response.data.page);
      setTotalPages(response.data.totalPages);
      setTotal(response.data.total);

      // Calculate statistics
      const now = new Date();
      const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

      const thisWeek = response.data.verifications.filter(v => {
        const verDate = new Date(v.verifiedAt);
        return !isNaN(verDate.getTime()) && verDate >= thisWeekStart;
      }).length;

      const thisMonth = response.data.verifications.filter(v => {
        const verDate = new Date(v.verifiedAt);
        return !isNaN(verDate.getTime()) && verDate >= thisMonthStart;
      }).length;

      setStats({
        total: response.data.total,
        thisWeek,
        thisMonth
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch verification history');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVerifications(1);
  }, []);

  // Handle filter application
  const handleApplyFilters = () => {
    setPage(1);
    fetchVerifications(1);
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get level color
  const getLevelColor = (level) => {
    const colors = {
      'Bachelor': 'bg-blue-100 text-blue-800',
      'Master': 'bg-purple-100 text-purple-800',
      'Doctorate': 'bg-red-100 text-red-800'
    };
    return colors[level] || 'bg-gray-100 text-gray-800';
  };

  // Open verification details modal
  const openModal = (verification) => {
    setSelectedVerification(verification);
    setShowModal(true);
  };

  if (loading && verifications.length === 0) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading verification history...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Verification History</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Certificates you have verified using the system
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
              <div>
                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics Summary */}
        {verifications.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Total Verifications */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-900/30 rounded-lg p-6 border border-blue-200 dark:border-blue-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">Total Verifications</h3>
                <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400">{stats.total}</p>
            </div>

            {/* This Week */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-900/30 rounded-lg p-6 border border-green-200 dark:border-green-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">This Week</h3>
                <Calendar className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-green-600 dark:text-green-400">{stats.thisWeek}</p>
                <span className="inline-block bg-green-600 dark:bg-green-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {stats.total > 0 ? Math.round((stats.thisWeek / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>

            {/* This Month */}
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-900/30 rounded-lg p-6 border border-purple-200 dark:border-purple-800">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-slate-600 dark:text-slate-400 font-medium">This Month</h3>
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex items-center gap-2">
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400">{stats.thisMonth}</p>
                <span className="inline-block bg-purple-600 dark:bg-purple-700 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  {stats.total > 0 ? Math.round((stats.thisMonth / stats.total) * 100) : 0}%
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filters Section */}
        <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-6 mb-8 border border-slate-200 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Search & Filter</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Serial Number Search */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Serial Number
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search serial..."
                  value={filters.serial}
                  onChange={(e) => handleFilterChange('serial', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                From Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Date To */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                To Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Certificate Level */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Certificate Level
              </label>
              <select
                value={filters.level}
                onChange={(e) => handleFilterChange('level', e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="All">All Levels</option>
                <option value="Bachelor">Bachelor</option>
                <option value="Master">Master</option>
                <option value="Doctorate">Doctorate</option>
              </select>
            </div>
          </div>

          {/* Apply Filters Button */}
          <button
            onClick={handleApplyFilters}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors"
          >
            {loading ? 'Applying...' : 'Apply Filters'}
          </button>
        </div>

        {/* Verification List */}
        {verifications.length > 0 ? (
          <>
            <div className="space-y-4 mb-8">
              {verifications.map((verification) => (
                <div
                  key={verification.id}
                  className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-lg transition-shadow"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    {/* Serial Number and Level */}
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-mono text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {verification.certificate?.serialNumber || 'N/A'}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1 rounded-full ${getLevelColor(verification.certificate?.level)}`}>
                          {verification.certificate?.level || 'Unknown'}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                        {verification.certificate?.certificateName || 'Certificate'}
                      </h3>
                    </div>

                    {/* Verified Date */}
                    <div className="flex items-end">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Verified on</p>
                        <p className="text-lg font-medium text-slate-900 dark:text-white">
                          {formatDate(verification.verifiedAt)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Student and Institution */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-sm">
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Student</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {verification.certificate?.student?.firstName} {verification.certificate?.student?.lastName}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-600 dark:text-slate-400">Institution</p>
                      <p className="text-slate-900 dark:text-white font-medium">
                        {verification.certificate?.institution?.name}
                      </p>
                    </div>
                  </div>

                  {/* View Details Button */}
                  <button
                    onClick={() => openModal(verification)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                  >
                    <Eye className="w-4 h-4" />
                    View Details
                  </button>
                </div>
              ))}
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => fetchVerifications(page - 1)}
                disabled={page === 1 || loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <p className="text-slate-600 dark:text-slate-400">
                Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{' '}
                <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
              </p>

              <button
                onClick={() => fetchVerifications(page + 1)}
                disabled={page === totalPages || loading}
                className="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </>
        ) : (
          // Empty State
          <div className="text-center py-16">
            <Search className="w-16 h-16 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No verifications yet</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Use the public verify page to verify certificates
            </p>
            <a
              href="/verify"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              Verify Certificate
            </a>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedVerification && (
        <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Verification Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300"
              >
                X
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Certificate Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Certificate Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Serial Number</p>
                    <p className="font-mono text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                      {selectedVerification.certificate?.serialNumber}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Certificate Name</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.certificateName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Level</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.level}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Issued Date</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.issuedAt && formatDate(selectedVerification.certificate.issuedAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Student Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Student Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Name</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.student?.firstName} {selectedVerification.certificate?.student?.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">NID</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.student?.nid}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Date of Birth</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.student?.dateOfBirth}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">Email</p>
                    <p className="font-medium text-slate-900 dark:text-white mt-1">
                      {selectedVerification.certificate?.student?.email}
                    </p>
                  </div>
                </div>
              </div>

              {/* Institution Info */}
              <div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Institution Information</h3>
                <div className="text-sm">
                  <p className="text-slate-600 dark:text-slate-400">Name</p>
                  <p className="font-medium text-slate-900 dark:text-white mt-1">
                    {selectedVerification.certificate?.institution?.name}
                  </p>
                </div>
              </div>

              {/* Verification Info */}
              <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-3">Verification Details</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">Verified on</p>
                <p className="text-lg font-medium text-slate-900 dark:text-white">
                  {formatDate(selectedVerification.verifiedAt)}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setShowModal(false)}
                className="px-6 py-2 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default VerificationHistory;

