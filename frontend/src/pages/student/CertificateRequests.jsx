import React, { useEffect, useState } from 'react';
import {
    Mail,
    CheckCircle,
    XCircle,
    Shield,
    AlertTriangle,
    Loader2,
    ChevronDown,
    ChevronUp,
    Phone
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const CertificateRequests = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('pending');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [requests, setRequests] = useState({
        pending: [],
        approved: [],
        rejected: [],
        expired: []
    });
    const [expandedReason, setExpandedReason] = useState(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [approving, setApproving] = useState(false);
    const [rejecting, setRejecting] = useState(false);

    const tabs = ['pending', 'approved', 'rejected', 'expired'];
    const tabLabels = {
        pending: 'Pending',
        approved: 'Approved',
        rejected: 'Rejected',
        expired: 'Expired'
    };

    /**
     * Fetch certificate requests on mount
     */
    useEffect(() => {
        const fetchRequests = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get('/student/certificate-requests');

                setRequests(response.data);
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load requests';
                setError(message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [user]);

    /**
     * Handle approve request
     */
    const handleApproveRequest = async () => {
        if (!selectedRequest) return;
        const requestId = selectedRequest.id || selectedRequest.requestId;
        if (!requestId) {
            setError('Request id is missing. Please refresh and try again.');
            return;
        }

        setError(null);
        setApproving(true);

        try {
            await api.put(
                `/student/certificate-requests/${requestId}/approve`,
                {}
            );

            // Update local state
            setRequests(prev => ({
                ...prev,
                pending: prev.pending.filter(r => r.id !== requestId && r.requestId !== requestId),
                approved: [selectedRequest, ...prev.approved]
            }));

            setShowApproveModal(false);
            setSelectedRequest(null);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to approve request');
            console.error('Error:', err);
        } finally {
            setApproving(false);
        }
    };

    /**
     * Handle reject request
     */
    const handleRejectRequest = async () => {
        if (!selectedRequest) return;
        const requestId = selectedRequest.id || selectedRequest.requestId;
        if (!requestId) {
            setError('Request id is missing. Please refresh and try again.');
            return;
        }

        setError(null);
        setRejecting(true);

        try {
            await api.put(
                `/student/certificate-requests/${requestId}/reject`,
                { rejectionReason: rejectReason || null }
            );

            // Update local state
            setRequests(prev => ({
                ...prev,
                pending: prev.pending.filter(r => r.id !== requestId && r.requestId !== requestId),
                rejected: [
                    { ...selectedRequest, rejectionReason: rejectReason || 'No reason provided' },
                    ...prev.rejected
                ]
            }));

            setShowRejectModal(false);
            setSelectedRequest(null);
            setRejectReason('');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reject request');
            console.error('Error:', err);
        } finally {
            setRejecting(false);
        }
    };

    /**
     * Get verifier badge
     */
    const getVerifierBadge = (isVerified) => {
        if (isVerified) {
            return (
                <span className="inline-flex items-center gap-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-3 py-1 rounded-full text-xs font-semibold border border-green-300 dark:border-green-700">
                    <CheckCircle className="w-3 h-3" />
                    Verified Company
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-200 px-3 py-1 rounded-full text-xs font-semibold border border-yellow-300 dark:border-yellow-700">
                <AlertTriangle className="w-3 h-3" />
                Pending Verification
            </span>
        );
    };

    /**
     * Truncate reason text
     */
    const truncateReason = (text, length = 100) => {
        if (text.length <= length) return text;
        return text.substring(0, length) + '...';
    };

    /**
     * Get days remaining
     */
    const getDaysRemaining = (expiresAt) => {
        return differenceInDays(new Date(expiresAt), new Date());
    };

    /**
     * Render request card
     */
    const renderRequestCard = (request, showActions = false) => {
        const daysRemaining = showActions ? getDaysRemaining(request.expiresAt) : 0;

        return (
            <div
                key={request.id}
                className={`bg-white dark:bg-gray-800 rounded-lg shadow border p-6 hover:shadow-md transition-shadow ${
                    showActions
                        ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-700 dark:bg-yellow-900/20'
                        : 'border-slate-200 dark:border-gray-700'
                }`}
            >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                            {request.companyName}
                        </h3>
                        <div className="mt-2">
                            {getVerifierBadge(request.verifierVerified)}
                        </div>
                    </div>
                    <div className="ml-4">
                        {showActions && <Mail className="w-6 h-6 text-yellow-600" />}
                        {activeTab === 'approved' && <CheckCircle className="w-6 h-6 text-green-600" />}
                        {activeTab === 'rejected' && <XCircle className="w-6 h-6 text-red-600" />}
                        {activeTab === 'expired' && <AlertTriangle className="w-6 h-6 text-slate-600 dark:text-gray-400" />}
                    </div>
                </div>

                {/* Request Details */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4 pb-4 border-b border-slate-200 dark:border-gray-700">
                    {/* Request Type */}
                    <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Request Type</p>
                        <p className="text-sm text-slate-800 dark:text-gray-100">
                            {request.requestType === 'ALL_CERTIFICATES'
                                ? 'All Certificates'
                                : `Single Certificate: ${request.certificateSerial}`}
                        </p>
                    </div>

                    {/* Purpose */}
                    <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Purpose</p>
                        <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                            {request.purpose}
                        </span>
                    </div>

                    {/* Requested On */}
                    <div>
                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Requested On</p>
                        <p className="text-sm text-slate-800 dark:text-gray-100">
                            {format(new Date(request.createdAt), 'dd MMM yyyy')}
                        </p>
                    </div>

                    {/* Contact Phone */}
                    {request.contactPhone && (
                        <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Contact</p>
                            <p className="text-sm text-slate-800 dark:text-gray-100 flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {request.contactPhone}
                            </p>
                        </div>
                        )}

                    {/* Expires / Approved Info */}
                    {showActions && (
                        <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Expires In</p>
                            <p className={`text-sm font-semibold ${
                                daysRemaining < 2 ? 'text-red-600' : 'text-slate-800 dark:text-gray-100'
                            }`}>
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {activeTab === 'approved' && (
                        <div>
                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Access Expires In</p>
                            <p className="text-sm text-slate-800 dark:text-gray-100">
                                {getDaysRemaining(request.expiresAt)} day{getDaysRemaining(request.expiresAt) !== 1 ? 's' : ''}
                            </p>
                        </div>
                    )}

                    {activeTab === 'rejected' && request.rejectionReason && (
                        <div className="md:col-span-2">
                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Rejection Reason</p>
                            <p className="text-sm text-slate-700 dark:text-gray-300 italic">"{request.rejectionReason}"</p>
                        </div>
                    )}
                </div>

                {/* Reason */}
                <div className="mb-4">
                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-2">Request Reason</p>
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
                                    Read More
                                </>
                            )}
                        </button>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                    {showActions && (
                        <>
                            <button
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setShowApproveModal(true);
                                }}
                                className="btn-primary flex-1"
                            >
                                Approve
                            </button>
                            <button
                                onClick={() => {
                                    setSelectedRequest(request);
                                    setShowRejectModal(true);
                                }}
                                className="btn-danger flex-1"
                            >
                                Reject
                            </button>
                        </>
                    )}

                    {activeTab === 'approved' && (
                        <button
                            onClick={() => {
                                setSelectedRequest(request);
                                // Handle revoke - could implement in future
                            }}
                            className="btn-danger flex-1"
                        >
                            Revoke Access
                        </button>
                    )}
                </div>
            </div>
        );
    };

    const currentRequests = requests[activeTab];

    return (
        <DashboardLayout>
            <div className="py-8">
            <div className="max-w-5xl mx-auto px-4">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Certificate Access Requests</h1>
                    <p className="text-sm text-slate-600 dark:text-gray-300">Review and respond to verifier requests.</p>
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

                {/* Tabs */}
                <div className="flex flex-wrap gap-2 mb-8">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-full font-semibold text-sm transition-colors flex items-center gap-2 ${
                                activeTab === tab
                                    ? 'bg-blue-600 text-white'
                                    : `${
                                        tab === 'pending'
                                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                            : tab === 'approved'
                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                            : tab === 'rejected'
                                            ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                            : 'bg-slate-100 text-slate-800 dark:bg-gray-700 dark:text-gray-200'
                                    }`
                            }`}
                        >
                            {tabLabels[tab]}
                            <span className="ml-1 text-xs bg-black/30 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                {requests[tab].length}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Loading State */}
                {loading ? (
                    <LoadingSpinner message="Loading requests..." />
                ) : currentRequests.length === 0 ? (
                    <EmptyState
                        icon={Mail}
                        title={`No ${tabLabels[activeTab].toLowerCase()} requests`}
                        description={
                            activeTab === 'pending'
                                ? "When employers request access to your certificates, they'll appear here"
                                : 'No requests in this category'
                        }
                    />
                ) : (
                    /* Requests List */
                    <div className="space-y-4">
                        {currentRequests.map(request => renderRequestCard(request, activeTab === 'pending'))}
                    </div>
                )}
            </div>
            {/* Approve Modal */}
            {showApproveModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Approve Access Request?
                        </h3>

                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                            <p className="text-sm text-blue-900 dark:text-blue-100 mb-2">
                                <span className="font-semibold">You will grant</span> {selectedRequest.companyName}
                            </p>
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                {selectedRequest.requestType === 'ALL_CERTIFICATES'
                                    ? 'access to view ALL your PUBLIC certificates for 30 days'
                                    : `access to certificate ${selectedRequest.certificateSerial} for 7 days`}
                            </p>
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-6">
                            <p className="text-xs text-yellow-800 dark:text-yellow-200 flex items-start gap-2">
                                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                You can revoke access anytime
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowApproveModal(false);
                                    setSelectedRequest(null);
                                }}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleApproveRequest}
                                disabled={approving}
                                className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:bg-slate-400 dark:disabled:bg-gray-600"
                            >
                                {approving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Approving...
                                    </>
                                ) : (
                                    <>
                                        <CheckCircle className="w-4 h-4" />
                                        Confirm Approval
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {showRejectModal && selectedRequest && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Reject Access Request?
                        </h3>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                                Provide a reason (optional)
                            </label>
                            <textarea
                                value={rejectReason}
                                onChange={(e) => setRejectReason(e.target.value)}
                                placeholder="Why are you rejecting this request?"
                                maxLength="500"
                                rows="3"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                {rejectReason.length}/500 characters
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRejectModal(false);
                                    setSelectedRequest(null);
                                    setRejectReason('');
                                }}
                                className="btn-secondary flex-1"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRejectRequest}
                                disabled={rejecting}
                                className="btn-danger flex-1 flex items-center justify-center gap-2 disabled:bg-slate-400 dark:disabled:bg-gray-600"
                            >
                                {rejecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Rejecting...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Confirm Rejection
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
        </DashboardLayout>
    );
};

export default CertificateRequests;
