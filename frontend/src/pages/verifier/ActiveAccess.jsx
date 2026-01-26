import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Key,
    Eye,
    Calendar,
    AlertTriangle,
    Loader2,
    XCircle
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const ActiveAccess = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeAccess, setActiveAccess] = useState([]);
    const [sortBy, setSortBy] = useState('expiry'); // 'expiry', 'granted', 'name'

    /**
     * Fetch active access on mount
     */
    useEffect(() => {
        const fetchActiveAccess = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get('/verifier/active-access');

                setActiveAccess(response.data.activeAccess || []);
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load active access';
                setError(message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchActiveAccess();
    }, [user]);

    /**
     * Sort active access based on selected criteria
     */
    const getSortedAccess = () => {
        const sorted = [...activeAccess];

        if (sortBy === 'expiry') {
            sorted.sort((a, b) => new Date(a.expiresAt) - new Date(b.expiresAt));
        } else if (sortBy === 'granted') {
            sorted.sort((a, b) => new Date(b.grantedAt) - new Date(a.grantedAt));
        } else if (sortBy === 'name') {
            sorted.sort((a, b) => a.studentName.localeCompare(b.studentName));
        }

        return sorted;
    };

    /**
     * Calculate days remaining
     */
    const getDaysRemaining = (expiresAt) => {
        return differenceInDays(new Date(expiresAt), new Date());
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
     * Get progress bar color
     */
    const getProgressColor = (daysRemaining) => {
        if (daysRemaining < 3) return 'bg-red-500';
        if (daysRemaining < 7) return 'bg-yellow-500';
        return 'bg-green-500';
    };

    const sortedAccess = getSortedAccess();

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Active Access</h1>
                    <p className="text-sm text-slate-600 dark:text-gray-300">
                        Students who have granted you access to their certificates.
                    </p>
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
                        <span className="ml-2 text-slate-600 dark:text-gray-300">Loading active access...</span>
                    </div>
                ) : activeAccess.length === 0 ? (
                    /* Empty State */
                    <div className="text-center py-16">
                        <Key className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Active Access Grants
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            When students approve your requests, they'll appear here
                        </p>
                        <button
                            onClick={() => navigate('/verifier/my-requests')}
                            className="btn-primary"
                        >
                            View My Requests
                        </button>
                    </div>
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
                                <option value="name">Sort by: Student Name (A-Z)</option>
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
                                        {daysRemaining < 3 && daysRemaining >= 0 && (
                                            <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded-lg flex items-start gap-2">
                                                <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                                                <p className="text-sm text-orange-800 dark:text-orange-200">
                                                    This access will expire soon. You may need to request again.
                                                </p>
                                            </div>
                                        )}

                                        {/* Card Header */}
                                        <div className="flex justify-between items-start mb-4">
                                            <div className="flex-1">
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                                    {access.studentName}
                                                </h3>

                                                {/* Access Type */}
                                                <div className="mt-2">
                                                    <span className="inline-block bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                        {access.certificateId
                                                            ? `Single Certificate: ${access.certificateSerial}`
                                                            : 'All Certificates'}
                                                    </span>
                                                </div>

                                                {/* Purpose Badge */}
                                                {access.requestPurpose && (
                                                    <div className="mt-2">
                                                        <span className="inline-block bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                                                            {access.requestPurpose}
                                                        </span>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Key Icon */}
                                            <div className="ml-4">
                                                <Key className="w-8 h-8 text-green-600" />
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
                                                    <p className={`text-sm font-semibold ${
                                                        daysRemaining < 0
                                                            ? 'text-red-600'
                                                            : daysRemaining < 3
                                                            ? 'text-orange-600'
                                                            : 'text-green-600'
                                                    }`}>
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

                                        {/* View Certificates Button */}
                                        {daysRemaining >= 0 && (
                                            <button
                                                onClick={() => navigate(`/verifier/view-certificates/${access.studentId}`, {
                                                    state: { accessId: access.id }
                                                })}
                                                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                            >
                                                <Eye className="w-4 h-4" />
                                                View Certificates
                                            </button>
                                        )}

                                        {daysRemaining < 0 && (
                                            <button
                                                disabled
                                                className="w-full flex items-center justify-center gap-2 bg-slate-300 dark:bg-gray-700 text-slate-600 dark:text-gray-300 font-semibold py-2 px-4 rounded-lg cursor-not-allowed"
                                            >
                                                <Calendar className="w-4 h-4" />
                                                Access Expired
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary */}
                        <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                            <p className="text-sm text-blue-800 dark:text-blue-200">
                                <span className="font-semibold">{activeAccess.length}</span> active access grant{activeAccess.length !== 1 ? 's' : ''} - {' '}
                                <span className="font-semibold">
                                    {activeAccess.filter(a => getDaysRemaining(a.expiresAt) < 7).length}
                                </span> expiring soon
                            </p>
                        </div>
                    </>
                )}
            </div>
        </DashboardLayout>
    );
};

export default ActiveAccess;
