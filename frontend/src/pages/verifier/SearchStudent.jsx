import React, { useState } from 'react';
import {
    Search,
    User,
    AlertCircle,
    CheckCircle,
    X,
    Loader2,
    XCircle
} from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';

const SearchStudent = () => {
    const [nid, setNid] = useState('');
    const [dateOfBirth, setDateOfBirth] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [studentResult, setStudentResult] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [requesting, setRequesting] = useState(false);
    const [requestError, setRequestError] = useState(null);
    const [requestSuccess, setRequestSuccess] = useState('');

    const [requestData, setRequestData] = useState({
        purpose: '',
        reason: ''
    });

    /**
     * Validate NID format (10-13 digits)
     */
    const validateNID = (value) => {
        const nidRegex = /^\d{10,13}$/;
        return nidRegex.test(value.replace(/\s/g, ''));
    };

    /**
     * Validate date format DD/MM/YYYY
     */
    const validateDateFormat = (value) => {
        const dateRegex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
        const match = value.match(dateRegex);

        if (!match) return false;

        const day = parseInt(match[1]);
        const month = parseInt(match[2]);
        const year = parseInt(match[3]);

        // Basic validation
        if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
            return false;
        }

        return true;
    };

    /**
     * Handle search submission
     */
    const handleSearch = async (e) => {
        e.preventDefault();
        setError(null);
        setStudentResult(null);

        // Validate inputs
        if (!nid.trim()) {
            setError('NID is required');
            return;
        }

        if (!validateNID(nid)) {
            setError('NID must be 10-13 digits');
            return;
        }

        if (!dateOfBirth) {
            setError('Date of Birth is required');
            return;
        }

        if (!validateDateFormat(dateOfBirth)) {
            setError('Invalid date format. Use DD/MM/YYYY');
            return;
        }

        setLoading(true);

        try {
            const response = await api.get('/verifier/search-student', {
                params: {
                    nid: nid.replace(/\s/g, ''),
                    dateOfBirth
                }
            });

            setStudentResult(response.data);
        } catch (err) {
            const message = err.response?.data?.error || 'Search failed. Please try again.';
            setError(message);
            console.error('Error:', err);
        } finally {
            setLoading(false);
        }
    };

    /**
     * Handle request submission
     */
    const handleSubmitRequest = async () => {
        setRequestError(null);
        setRequestSuccess('');

        // Validate
        if (!requestData.purpose) {
            setRequestError('Please select a purpose');
            return;
        }

        if (!requestData.reason.trim()) {
            setRequestError('Please provide a reason');
            return;
        }

        if (requestData.reason.length < 20) {
            setRequestError('Reason must be at least 20 characters');
            return;
        }

        if (requestData.reason.length > 500) {
            setRequestError('Reason cannot exceed 500 characters');
            return;
        }

        setRequesting(true);

        try {
            await api.post(
                '/verifier/request-all-certificates',
                {
                    studentId: studentResult.student.id,
                    purpose: requestData.purpose,
                    reason: requestData.reason.trim()
                }
            );

            setRequestSuccess('Request sent successfully!');
            setShowRequestModal(false);
            setRequestData({ purpose: '', reason: '' });

            // Update student result to show pending request
            setStudentResult(prev => ({
                ...prev,
                hasPendingRequest: true
            }));

            // Clear success message after 3 seconds
            setTimeout(() => setRequestSuccess(''), 3000);
        } catch (err) {
            const message = err.response?.data?.error || 'Failed to submit request';
            setRequestError(message);
            console.error('Error:', err);
        } finally {
            setRequesting(false);
        }
    };

    /**
     * Format date input to DD/MM/YYYY
     */
    const handleDateInput = (e) => {
        let value = e.target.value;

        // Remove non-numeric characters
        value = value.replace(/\D/g, '');

        // Format as DD/MM/YYYY
        if (value.length <= 2) {
            setDateOfBirth(value);
        } else if (value.length <= 4) {
            setDateOfBirth(`${value.slice(0, 2)}/${value.slice(2)}`);
        } else if (value.length <= 8) {
            setDateOfBirth(`${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4)}`);
        } else {
            setDateOfBirth(`${value.slice(0, 2)}/${value.slice(2, 4)}/${value.slice(4, 8)}`);
        }
    };

    return (
        <DashboardLayout>
            <div className="max-w-2xl mx-auto px-4 py-8">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Search Student</h1>
                    <p className="text-slate-600 dark:text-gray-300 text-sm">
                        Enter a student's NID and Date of Birth to find their certificates.
                    </p>
                </div>

                {/* Success Message */}
                {requestSuccess && (
                    <div className="mb-6 p-4 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700 rounded-lg flex items-start gap-3">
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                        <p className="text-green-800 dark:text-green-200">{requestSuccess}</p>
                    </div>
                )}

                {/* Search Form */}
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 p-6 mb-8">
                    <form onSubmit={handleSearch} className="space-y-4">
                        {/* NID Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                                National ID Number (NID) <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={nid}
                                onChange={(e) => setNid(e.target.value.replace(/\D/g, ''))}
                                placeholder="e.g., 1234567890"
                                maxLength="13"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">10-13 digits</p>
                        </div>

                        {/* Date of Birth Input */}
                        <div>
                            <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-2">
                                Date of Birth <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={dateOfBirth}
                                onChange={handleDateInput}
                                placeholder="DD/MM/YYYY"
                                maxLength="10"
                                className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <p className="text-xs text-slate-500 dark:text-gray-400 mt-1">Format: DD/MM/YYYY</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                <div className="flex items-start">
                                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                                    <div>
                                        <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                                        <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Search Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 dark:disabled:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Searching...
                                </>
                            ) : (
                                <>
                                    <Search className="w-5 h-5" />
                                    Search
                                </>
                            )}
                        </button>
                    </form>
                </div>

                {/* Search Results */}
                {studentResult && (
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 p-6">
                        {/* Student Info */}
                        <div className="flex items-start gap-4 mb-6 pb-6 border-b border-slate-200 dark:border-gray-700">
                            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                                <User className="w-6 h-6 text-blue-600 dark:text-blue-300" />
                            </div>
                            <div className="flex-1">
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {studentResult.student.firstName} {studentResult.student.lastName}
                                </h2>
                                <p className="text-slate-600 dark:text-gray-300 mt-1">
                                    Has <span className="font-semibold">{studentResult.student.certificateCount}</span> certificate{studentResult.student.certificateCount !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>

                        {/* Pending Request Notice or Request Button */}
                        {studentResult.hasPendingRequest ? (
                            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-semibold text-yellow-900 dark:text-yellow-100">Pending Request</p>
                                    <p className="text-yellow-800 dark:text-yellow-200 text-sm">
                                        You have a pending request for this student's certificates. Please wait for their response.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <button
                                onClick={() => setShowRequestModal(true)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
                            >
                                Request Access to Certificates
                            </button>
                        )}
                    </div>
                )}

                {/* Request Modal */}
                {showRequestModal && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
                            {/* Modal Header */}
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                                    Request Access to Certificates
                                </h3>
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="text-slate-400 hover:text-slate-600 dark:hover:text-gray-200"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>

                            {/* Student Name Display */}
                            <p className="text-sm text-slate-600 dark:text-gray-300 mb-4">
                                Student: <span className="font-semibold text-slate-900 dark:text-white">
                                    {studentResult.student.firstName} {studentResult.student.lastName}
                                </span>
                            </p>

                            {/* Modal Content */}
                            <div className="space-y-4 mb-4">
                                {/* Purpose Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Purpose <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={requestData.purpose}
                                        onChange={(e) => setRequestData({ ...requestData, purpose: e.target.value })}
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    >
                                        <option value="">Select purpose...</option>
                                        <option value="Employment">Employment Verification</option>
                                        <option value="Admission">Educational Admission</option>
                                        <option value="Background Check">Background Check</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>

                                {/* Reason Textarea */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Reason <span className="text-red-500">*</span>
                                    </label>
                                    <textarea
                                        value={requestData.reason}
                                        onChange={(e) => setRequestData({ ...requestData, reason: e.target.value })}
                                        placeholder="Please explain why you need access to this student's certificates"
                                        rows="4"
                                        maxLength="500"
                                        className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-none"
                                    />
                                    <div className="flex justify-between items-center mt-1">
                                        <p className="text-xs text-slate-500 dark:text-gray-400">Minimum 20 characters</p>
                                        <p className="text-xs font-medium text-slate-600 dark:text-gray-300">
                                            {requestData.reason.length}/500
                                        </p>
                                    </div>
                                </div>

                                {/* Error Message */}
                                {requestError && (
                                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                                        <div className="flex items-start">
                                            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                                            <div>
                                                <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                                                <div className="text-sm text-red-700 dark:text-red-300">{requestError}</div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setShowRequestModal(false)}
                                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSubmitRequest}
                                    disabled={requesting}
                                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {requesting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Request'
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

export default SearchStudent;
