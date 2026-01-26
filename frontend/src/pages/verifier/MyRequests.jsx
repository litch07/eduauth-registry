import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Clock,
    CheckCircle,
    XCircle,
    Calendar,
    Eye,
    AlertCircle,
    Loader2,
    ChevronDown,
    ChevronUp
} from 'lucide-react';
import { format } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const MyRequests = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState('All');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [counts, setCounts] = useState({
        all: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
        expired: 0
    });
    const [expandedReason, setExpandedReason] = useState(null);

    const filters = ['All', 'Pending', 'Approved', 'Rejected', 'Expired'];

    /**
     * Fetch requests based on filter
     */
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                setError(null);

                const statusParam = activeFilter === 'All' ? '' : activeFilter.toUpperCase();

                const response = await api.get(
                    '/verifier/my-requests',
                    {
                        params: statusParam ? { status: statusParam } : {}
                    }
                );

                setRequests(response.data.requests);

                // Calculate counts from all requests
                if (activeFilter === 'All') {
                    setCounts({
                        all: response.data.requests.length,
                        pending: response.data.requests.filter(r => r.status === 'PENDING').length,
                        approved: response.data.requests.filter(r => r.status === 'APPROVED').length,
                        rejected: response.data.requests.filter(r => r.status === 'REJECTED').length,
                        expired: response.data.requests.filter(r => r.status === 'EXPIRED').length
                    });
                }
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load requests';
                setError(message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [activeFilter, user]);

    /**
     * Get filter count
     */
    const getFilterCount = (filter) => {
        if (filter === 'All') return counts.all;
        if (filter === 'Pending') return counts.pending;
        if (filter === 'Approved') return counts.approved;
        if (filter === 'Rejected') return counts.rejected;
        if (filter === 'Expired') return counts.expired;
        return 0;
    };

    /**
     * Get filter badge colors
     */
    const getFilterColor = (filter, isActive) => {
        if (isActive) {
            return 'bg-blue-600 text-white';
        }

        switch (filter) {
            case 'Pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
            case 'Approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
            case 'Rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
            case 'Expired':
                return 'bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    /**
     * Get status badge styling
     */
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-700';
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border border-green-300 dark:bg-green-900/30 dark:text-green-200 dark:border-green-700';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border border-red-300 dark:bg-red-900/30 dark:text-red-200 dark:border-red-700';
            case 'EXPIRED':
                return 'bg-slate-100 text-slate-800 border border-slate-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600';
            default:
                return 'bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200';
        }
    };

    /**
     * Calculate days until expiry
     */
    const getDaysUntilExpiry = (expiresAt) => {
        const now = new Date();
        const expiry = new Date(expiresAt);
        const daysLeft = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
        return daysLeft;
    };

    /**
     * Truncate reason text
     */
    const truncateReason = (text, length = 100) => {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">My Certificate Requests</h1>
                    <p className="text-sm text-slate-600 dark:text-gray-300">Manage your certificate access requests.</p>
                </div>

                {/* Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {filters.map(filter => (
                        <button
                            key={filter}
                            onClick={() => setActiveFilter(filter)}
                            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
                                activeFilter === filter
                                    ? 'bg-blue-600 text-white'
                                    : getFilterColor(filter, false)
                            }`}
                        >
                            {filter}
                            <span className="ml-1 text-xs bg-black/30 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                {getFilterCount(filter)}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Error Message */}
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

                {/* Loading State */}
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-spin" />
                        <span className="ml-2 text-slate-600 dark:text-gray-300">Loading requests...</span>
                    </div>
                ) : requests.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <Calendar className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No {activeFilter.toLowerCase()} requests
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            {activeFilter === 'All'
                                ? "You haven't sent any requests yet"
                                : `You don't have any ${activeFilter.toLowerCase()} requests`}
                        </p>
                        <button
                            onClick={() => navigate('/verifier/search')}
                            className="btn-primary"
                        >
                            Search Students
                        </button>
                    </div>
                ) : (
                    /* Requests List */
                    <div className="space-y-4">
                        {requests.map(request => (
                            <div
                                key={request.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Request Header */}
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1">
                                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                                            {request.studentName}
                                        </h3>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            {/* Request Type Badge */}
                                            <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                {request.requestType === 'ALL_CERTIFICATES'
                                                    ? 'All Certificates'
                                                    : `Single Certificate${request.certificateSerial ? ` (${request.certificateSerial})` : ''}`}
                                            </span>

                                            {/* Purpose Badge */}
                                            <span className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                {request.purpose}
                                            </span>

                                            {/* Status Badge */}
                                            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                                {request.status}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Status Icon */}
                                    <div className="ml-4">
                                        {request.status === 'PENDING' && (
                                            <Clock className="w-6 h-6 text-yellow-600" />
                                        )}
                                        {request.status === 'APPROVED' && (
                                            <CheckCircle className="w-6 h-6 text-green-600" />
                                        )}
                                        {request.status === 'REJECTED' && (
                                            <XCircle className="w-6 h-6 text-red-600" />
                                        )}
                                        {request.status === 'EXPIRED' && (
                                            <AlertCircle className="w-6 h-6 text-slate-600 dark:text-gray-400" />
                                        )}
                                    </div>
                                </div>

                                {/* Request Details */}
                                <div className="border-t border-slate-200 dark:border-gray-700 pt-4 mb-4">
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {/* Reason */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Reason</p>
                                            <p className="text-sm text-slate-800 dark:text-gray-100">
                                                {expandedReason === request.id
                                                    ? request.reason
                                                    : truncateReason(request.reason)}
                                            </p>
                                            {request.reason.length > 100 && (
                                                <button
                                                    onClick={() => setExpandedReason(
                                                        expandedReason === request.id ? null : request.id
                                                    )}
                                                    className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-xs font-semibold mt-1 flex items-center gap-1"
                                                >
                                                    {expandedReason === request.id ? (
                                                        <>
                                                            <ChevronUp className="w-3 h-3" />
                                                            Show less
                                                        </>
                                                    ) : (
                                                        <>
                                                            <ChevronDown className="w-3 h-3" />
                                                            Show more
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>

                                        {/* Requested On */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Requested On</p>
                                            <p className="text-sm text-slate-800 dark:text-gray-100">
                                                {format(new Date(request.createdAt), 'dd MMM yyyy')}
                                            </p>
                                        </div>

                                        {/* Expiry Info */}
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">
                                                {request.status === 'APPROVED' ? 'Access Expires' : 'Expires'}
                                            </p>
                                            {request.status === 'PENDING' && (
                                                <p className="text-sm text-slate-800 dark:text-gray-100">
                                                    {getDaysUntilExpiry(request.expiresAt)} days left
                                                </p>
                                            )}
                                            {request.status === 'APPROVED' && (
                                                <p className="text-sm text-slate-800 dark:text-gray-100">
                                                    {getDaysUntilExpiry(request.expiresAt)} days left
                                                </p>
                                            )}
                                            {request.status === 'REJECTED' && request.rejectionReason && (
                                                <p className="text-sm text-slate-700 dark:text-gray-300 italic">
                                                    "{request.rejectionReason}"
                                                </p>
                                            )}
                                            {request.status === 'EXPIRED' && (
                                                <p className="text-sm text-slate-600 dark:text-gray-400">
                                                    Expired
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="flex gap-3">
                                    {request.status === 'APPROVED' && (
                                        <button
                                            onClick={() => navigate(`/verifier/view-certificates/${request.studentId}`)}
                                            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Certificates
                                        </button>
                                    )}

                                    {request.status === 'EXPIRED' && (
                                        <button
                                            onClick={() => navigate(`/verifier/search`)}
                                            className="flex items-center gap-2 bg-slate-600 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                        >
                                            <Clock className="w-4 h-4" />
                                            Request Again
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default MyRequests;
