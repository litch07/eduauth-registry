import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Send,
    Clock,
    CheckCircle,
    Key,
    Search,
    XCircle,
    FileText,
    ArrowRight,
    Eye
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const VerifierDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [dashboardData, setDashboardData] = useState({
        totalRequests: 0,
        pendingRequests: 0,
        approvedRequests: 0,
        activeAccess: 0,
        recentRequests: [],
        recentVerifications: []
    });
    const [verifierInfo, setVerifierInfo] = useState({
        companyName: 'Company',
        isVerified: false
    });

    /**
     * Fetch dashboard data on component mount
     */
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await api.get('/verifier/dashboard');

                setDashboardData(response.data);

                // Try to get verifier info from response if available
                if (response.data.verifierInfo) {
                    setVerifierInfo(response.data.verifierInfo);
                }
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load dashboard';
                setError(message);
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    /**
     * Get status badge color and styling
     */
    const getStatusBadge = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800 border border-yellow-300';
            case 'APPROVED':
                return 'bg-green-100 text-green-800 border border-green-300';
            case 'REJECTED':
                return 'bg-red-100 text-red-800 border border-red-300';
            case 'EXPIRED':
                return 'bg-slate-100 text-slate-800 border border-slate-300';
            default:
                return 'bg-slate-100 text-slate-800 border border-slate-300';
        }
    };

    /**
     * Format time ago (e.g., "2 hours ago", "3 days ago")
     */
    const timeAgo = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const seconds = Math.floor((now - date) / 1000);

        if (seconds < 60) return 'just now';
        const minutes = Math.floor(seconds / 60);
        if (minutes < 60) return `${minutes}m ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours}h ago`;
        const days = Math.floor(hours / 24);
        if (days < 7) return `${days}d ago`;
        const weeks = Math.floor(days / 7);
        if (weeks < 4) return `${weeks}w ago`;
        return date.toLocaleDateString('en-GB');
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600"></div>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
                <div className="rounded-2xl bg-gradient-to-r from-primary to-primary-light px-6 py-5 text-white shadow-lg">
                    <h1 className="text-2xl font-bold md:text-3xl">
                        Welcome, {verifierInfo.companyName || user?.name || 'Verifier'}
                    </h1>
                    <p className="mt-1 text-sm text-blue-100">
                        Manage your certificate verification requests. Status:{' '}
                        {verifierInfo.isVerified ? 'Verified' : 'Pending admin approval'}.
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

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {/* Total Requests */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-slate-200 dark:border-gray-700 cursor-pointer transition hover:shadow-md"
                        onClick={() => navigate('/verifier/requests')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Total Requests</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-white mt-2">
                                    {dashboardData.totalRequests}
                                </p>
                            </div>
                            <Send className="w-12 h-12 text-blue-600 bg-blue-50 p-2.5 rounded-lg" />
                        </div>
                    </div>

                    {/* Pending Requests */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-slate-200 dark:border-gray-700 cursor-pointer transition hover:shadow-md"
                        onClick={() => navigate('/verifier/requests')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Pending Requests</p>
                                <p className="text-3xl font-bold text-yellow-600 mt-2">
                                    {dashboardData.pendingRequests}
                                </p>
                            </div>
                            <Clock className="w-12 h-12 text-yellow-600 bg-yellow-50 p-2.5 rounded-lg" />
                        </div>
                    </div>

                    {/* Approved Requests */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-slate-200 dark:border-gray-700 cursor-pointer transition hover:shadow-md"
                        onClick={() => navigate('/verifier/requests')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Approved Requests</p>
                                <p className="text-3xl font-bold text-green-600 mt-2">
                                    {dashboardData.approvedRequests}
                                </p>
                            </div>
                            <CheckCircle className="w-12 h-12 text-green-600 bg-green-50 p-2.5 rounded-lg" />
                        </div>
                    </div>

                    {/* Active Access */}
                    <div
                        className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 border border-slate-200 dark:border-gray-700 cursor-pointer transition hover:shadow-md"
                        onClick={() => navigate('/verifier/access')}
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-slate-600 dark:text-gray-300 text-sm font-medium">Active Access</p>
                                <p className="text-3xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                                    {dashboardData.activeAccess}
                                </p>
                            </div>
                            <Key className="w-12 h-12 text-blue-600 bg-blue-50 p-2.5 rounded-lg" />
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <button
                        onClick={() => navigate('/verifier/search')}
                        className="flex items-center justify-center gap-2 bg-blue-600 dark:bg-blue-500 hover:bg-blue-700 dark:hover:bg-blue-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow"
                    >
                        <Search className="w-5 h-5" />
                        Search Student
                    </button>

                    <button
                        onClick={() => navigate('/verifier/requests')}
                        className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-gray-700 hover:bg-slate-700 dark:hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow"
                    >
                        <Clock className="w-5 h-5" />
                        View My Requests
                    </button>

                    <button
                        onClick={() => navigate('/verifier/access')}
                        className="flex items-center justify-center gap-2 bg-slate-600 dark:bg-gray-700 hover:bg-slate-700 dark:hover:bg-gray-600 text-white font-semibold py-3 px-6 rounded-lg transition-colors shadow"
                    >
                        <Key className="w-5 h-5" />
                        Active Access
                    </button>
                </div>

                {/* Recent Verifications Section */}
                {dashboardData.recentVerifications && dashboardData.recentVerifications.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 mb-8">
                        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-gray-700">
                            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recently Verified Certificates</h2>
                            <button
                                onClick={() => navigate('/verifier/verification-history')}
                                className="flex items-center gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
                            >
                                View All
                                <ArrowRight className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="divide-y divide-slate-200 dark:divide-gray-700">
                            {dashboardData.recentVerifications.map((verification, index) => (
                                <div
                                    key={verification.id || index}
                                    className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-gray-700/50 transition-colors"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold uppercase tracking-wider">Serial</p>
                                            <p className="text-sm font-mono font-bold text-blue-600 dark:text-blue-400 mt-1">
                                                {verification.serialNumber}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold uppercase tracking-wider">Certificate</p>
                                            <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                                {verification.certificateName}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold uppercase tracking-wider">Student</p>
                                            <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                                {verification.studentName}
                                            </p>
                                        </div>
                                        <div className="flex items-end justify-between md:justify-end">
                                            <div>
                                                <p className="text-xs text-slate-600 dark:text-gray-400 font-semibold uppercase tracking-wider">Verified</p>
                                                <p className="text-sm text-slate-900 dark:text-white font-medium mt-1">
                                                    {timeAgo(verification.verifiedAt)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Recent Requests Table */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700">
                    <div className="px-6 py-4 border-b border-slate-200 dark:border-gray-700">
                        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Recent Requests (Last 10)</h2>
                    </div>

                    {dashboardData.recentRequests.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Requests Found</h3>
                            <p className="text-gray-600 dark:text-gray-400 mb-6">
                                You haven't sent any certificate requests yet
                            </p>
                            <button
                                onClick={() => navigate('/verifier/search')}
                                className="btn-primary"
                            >
                                Search Students
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-gray-700 border-b border-slate-200 dark:border-gray-600">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                            Student Name
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                            Request Type
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                            Purpose
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-semibold text-slate-700 dark:text-gray-200 uppercase tracking-wider">
                                            Date
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {dashboardData.recentRequests.map((request, index) => (
                                        <tr
                                            key={request.id || index}
                                            className="border-b border-slate-200 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700 cursor-pointer transition-colors"
                                            onClick={() => navigate('/verifier/requests')}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white font-medium">
                                                {request.studentName}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-300">
                                                {request.requestType === 'ALL_CERTIFICATES' ? 'All Certificates' : 'Single Certificate'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-gray-300">
                                                {request.purpose}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(request.status)}`}>
                                                    {request.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                                                {new Date(request.createdAt).toLocaleDateString('en-GB', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default VerifierDashboard;

