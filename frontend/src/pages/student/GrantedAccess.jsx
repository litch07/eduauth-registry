import React, { useEffect, useState } from 'react';
import {
    Unlock,
    AlertTriangle,
    XCircle,
    Loader2,
    CheckCircle,
    Calendar,
    Shield
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const GrantedAccess = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [grantedAccess, setGrantedAccess] = useState([]);
    const [sortBy, setSortBy] = useState('expiry'); // 'expiry', 'name', 'granted'
    const [showRevokeModal, setShowRevokeModal] = useState(false);
    const [selectedAccess, setSelectedAccess] = useState(null);
    const [revokeReason, setRevokeReason] = useState('');
    const [revoking, setRevoking] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');

    /**
     * Fetch granted access on mount
     */
    useEffect(() => {
        const fetchGrantedAccess = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get('/student/granted-access');

                setGrantedAccess(response.data.grantedAccess || []);
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load granted access';
                setError(message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchGrantedAccess();
    }, [user]);

    /**
     * Sort granted access
     */
    const getSortedAccess = () => {
        const sorted = [...grantedAccess];

        if (sortBy === 'expiry') {
            sorted.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
        } else if (sortBy === 'name') {
            sorted.sort((a, b) => a.companyName.localeCompare(b.companyName));
        } else if (sortBy === 'granted') {
            sorted.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
        }

        return sorted;
    };

    /**
     * Get days remaining
     */
    const getDaysRemaining = (expiresAt) => {
        return differenceInDays(new Date(expiresAt), new Date());
    };

    /**
     * Get expiry color
     */
    const getExpiryColor = (daysRemaining) => {
        if (daysRemaining <= 3) return 'text-red-600';
        if (daysRemaining <= 7) return 'text-yellow-600';
        return 'text-green-600';
    };

    /**
     * Get progress bar color
     */
    const getProgressColor = (daysRemaining) => {
        if (daysRemaining <= 3) return 'bg-red-500';
        if (daysRemaining <= 7) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    /**
     * Calculate progress percentage
     */
    const getProgressPercentage = (grantedAt, expiresAt) => {
        const granted = new Date(grantedAt);
        const expires = new Date(expiresAt);
        const now = new Date();

        const totalDays = differenceInDays(expires, granted);
        const daysUsed = differenceInDays(now, granted);

        if (totalDays <= 0) {
            return 100;
        }

        return Math.min((daysUsed / totalDays) * 100, 100);
    };

    /**
     * Handle revoke access
     */
    const handleRevokeAccess = async () => {
        if (!selectedAccess) return;

        setError(null);
        setRevoking(true);

        try {
            await api.put(
                `/student/granted-access/${selectedAccess.id}/revoke`,
                { revokeReason: revokeReason || null }
            );

            // Update local state
            setGrantedAccess(prev => prev.filter(a => a.id !== selectedAccess.id));

            setSuccessMessage(`Access for ${selectedAccess.companyName} has been revoked successfully.`);
            setShowRevokeModal(false);
            setSelectedAccess(null);
            setRevokeReason('');

            // Clear success message after 3 seconds
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to revoke access');
            console.error('Error:', err);
        } finally {
            setRevoking(false);
        }
    };

    const sortedAccess = getSortedAccess();

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Granted Access</h1>
                    <p className="text-sm text-slate-600 dark:text-gray-300">Manage access granted to verifiers.</p>
                </div>

                {/* Success Message */}
                {successMessage && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-800 dark:text-green-200">{successMessage}</p>
                    </div>
                )}
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
                    <LoadingSpinner message="Loading granted access..." />
                ) : grantedAccess.length === 0 ? (
                    <EmptyState
                        icon={Unlock}
                        title="No active access grants"
                        description="When you approve requests, they will appear here."
                    />
                ) : (
                    <>
                        {/* Sort Options */}
                        <div className="mb-6 flex gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="px-4 py-2 border border-slate-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-slate-800 dark:text-white text-sm"
                            >
                                <option value="expiry">Sort by: Expiry Date (Soonest)</option>
                                <option value="granted">Sort by: Granted Date (Newest)</option>
                                <option value="name">Sort by: Company Name (A-Z)</option>
                            </select>
                        </div>

                        {/* Access Cards */}
                        <div className="space-y-4">
                            {sortedAccess.map(access => {
                                const daysRemaining = getDaysRemaining(access.expiresAt);
                                const progressPercent = getProgressPercentage(
                                    access.grantedAt,
                                    access.expiresAt
                                );

                                return (
                                    <div
                                        key={access.id}
                                        className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                                    >
                                        {/* Expiry Warning */}
                                        {daysRemaining <= 3 && daysRemaining >= 0 && (
                                            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg flex items-start gap-2">
                                                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-red-800 dark:text-red-200">
                                                    Access expires soon. The company will lose access in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}.
                                                </p>
                                            </div>
                                        )}

                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {access.companyName}
                                                </h3>

                                                {/* Access Type */}
                                                <div className="mt-2">
                                                    <span className="inline-block bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                        {access.certificateId
                                                            ? `Single Certificate: ${access.certificateSerial}`
                                                            : 'All Public Certificates'}
                                                    </span>
                                                </div>

                                                {/* Purpose Badge */}
                                                {access.requestPurpose && (
                                                    <div className="mt-2">
                                                        <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                            {access.requestPurpose}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Shield Icon */}
                                            <div className="ml-4">
                                                <Shield className="w-8 h-8 text-green-600" />
                                            </div>
                                        </div>

                                        {/* Access Details */}
                                        <div className="border-t border-slate-200 dark:border-gray-700 pt-4 mb-4">
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                {/* Granted On */}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">
                                                        Granted On
                                                    </p>
                                                    <p className="text-sm text-slate-800 dark:text-gray-100">
                                                        {format(new Date(access.grantedAt), 'dd MMM yyyy')}
                                                    </p>
                                                </div>

                                                {/* Expires In */}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">
                                                        Expires In
                                                    </p>
                                                    <p className={`text-sm font-semibold ${getExpiryColor(daysRemaining)}`}>
                                                        {daysRemaining < 0
                                                            ? 'Expired'
                                                            : `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}`}
                                                    </p>
                                                </div>

                                                {/* Access End Date */}
                                                <div>
                                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">
                                                        Access Ends
                                                    </p>
                                                    <p className="text-sm text-slate-800 dark:text-gray-100">
                                                        {format(new Date(access.expiresAt), 'dd MMM yyyy')}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Progress Bar */}
                                        <div className="mb-4">
                                            <div className="w-full bg-slate-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full ${getProgressColor(daysRemaining)} transition-all`}
                                                    style={{ width: `${progressPercent}%` }}
                                                ></div>
                                            </div>
                                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                                {Math.round(progressPercent)}% of access period used
                                            </p>
                                        </div>

                                        {/* Revoke Button */}
                                        {daysRemaining >= 0 && (
                                            <button
                                                onClick={() => {
                                                    setSelectedAccess(access);
                                                    setShowRevokeModal(true);
                                                }}
                                                className="btn-danger w-full flex items-center justify-center gap-2"
                                            >
                                                <XCircle className="w-4 h-4" />
                                                Revoke Access
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-semibold">{grantedAccess.length}</span> active access grant{grantedAccess.length !== 1 ? 's' : ''} - {' '}
                                <span className="font-semibold">
                                    {grantedAccess.filter(a => getDaysRemaining(a.expiresAt) <= 7).length}
                                </span> expiring within 7 days
                            </p>
                        </div>
                    </>
                )}
            </div>

            {/* Revoke Modal */}
            {showRevokeModal && selectedAccess && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">
                            Revoke Access?
                        </h3>

                        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg p-4 mb-6">
                            <p className="text-sm text-red-900 dark:text-red-200">
                                This will immediately end <span className="font-semibold">{selectedAccess.companyName}'s</span> access to your certificates.
                            </p>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                                Reason for revoking (optional)
                            </label>
                            <textarea
                                value={revokeReason}
                                onChange={(e) => setRevokeReason(e.target.value)}
                                placeholder="Why are you revoking this access?"
                                maxLength="500"
                                rows="3"
                                className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                            />
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">
                                {revokeReason.length}/500 characters
                            </p>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => {
                                    setShowRevokeModal(false);
                                    setSelectedAccess(null);
                                    setRevokeReason('');
                                }}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleRevokeAccess}
                                disabled={revoking}
                                className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:bg-slate-400 dark:disabled:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                            >
                                {revoking ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        Revoking...
                                    </>
                                ) : (
                                    <>
                                        <XCircle className="w-4 h-4" />
                                        Confirm Revoke
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
    </DashboardLayout>
    );
};

export default GrantedAccess;
