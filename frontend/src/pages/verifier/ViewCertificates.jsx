import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Award,
    Calendar,
    X,
    XCircle,
    Loader2,
    ArrowLeft,
    Printer
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import DashboardLayout from '../../components/DashboardLayout';

const ViewCertificates = () => {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [certificates, setCertificates] = useState([]);
    const [accessExpiresAt, setAccessExpiresAt] = useState(null);
    const [studentName, setStudentName] = useState('');
    const [selectedCertificate, setSelectedCertificate] = useState(null);
    const [showModal, setShowModal] = useState(false);

    /**
     * Fetch certificates on mount
     */
    useEffect(() => {
        const fetchCertificates = async () => {
            try {
                setLoading(true);
                setError(null);

                const response = await api.get(
                    `/verifier/view-certificates/${studentId}`
                );

                // Check if access has expired
                const expiresAt = new Date(response.data.accessExpiresAt);
                if (expiresAt < new Date()) {
                    setError('Your access to this student\'s certificates has expired. Please request access again.');
                    setAccessExpiresAt(expiresAt);
                    return;
                }

                setCertificates(response.data.certificates || []);
                setAccessExpiresAt(expiresAt);
                setStudentName(response.data.studentName || 'Student');
            } catch (err) {
                const message = err.response?.data?.error || 'Failed to load certificates';

                if (err.response?.status === 403) {
                    setError('You do not have access to this student\'s certificates. Please request access first.');
                } else {
                    setError(message);
                }
                console.error('Error:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCertificates();
    }, [studentId, user]);

    /**
     * Calculate days remaining
     */
    const getDaysRemaining = () => {
        if (!accessExpiresAt) return 0;
        return differenceInDays(new Date(accessExpiresAt), new Date());
    };

    /**
     * Format certificate level
     */
    const formatLevel = (level) => {
        const levelMap = {
            'BSC': 'Bachelor of Science',
            'MSC': 'Master of Science',
            'PHD': 'Doctor of Philosophy',
            'BA': 'Bachelor of Arts',
            'MA': 'Master of Arts'
        };
        return levelMap[level] || level;
    };

    /**
     * Open certificate detail modal
     */
    const openCertificateModal = (certificate) => {
        setSelectedCertificate(certificate);
        setShowModal(true);
    };

    /**
     * Print certificate
     */
    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center py-20">
                    <div className="text-center">
                        <Loader2 className="w-12 h-12 text-blue-600 dark:text-blue-400 animate-spin mx-auto mb-4" />
                        <p className="text-slate-600 dark:text-gray-300">Loading certificates...</p>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    // Error state
    if (error) {
        return (
            <DashboardLayout>
                <div className="max-w-4xl mx-auto px-4 py-8 text-slate-900 dark:text-white">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Student Certificates</h1>
                            <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">Certificate access details</p>
                        </div>
                    </div>
                    <div className="py-12">
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                                <div>
                                    <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                                    <div className="text-sm text-red-700 dark:text-red-300">{error}</div>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => navigate('/verifier/dashboard')}
                            className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Return to Dashboard
                        </button>
                    </div>
                </div>
            </DashboardLayout>
        );
    }

    const daysRemaining = getDaysRemaining();

    return (
        <DashboardLayout>
            <div className="max-w-5xl mx-auto px-4 py-8 text-slate-900 dark:text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">Student Certificates</h1>
                        <p className="text-sm text-slate-600 dark:text-gray-300 mt-1">{studentName}</p>
                    </div>
                </div>

                {/* Access Info Banner */}
                <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <div>
                            <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                                Access expires on {format(new Date(accessExpiresAt), 'dd MMM yyyy')}
                            </p>
                            <p className="text-xs text-blue-700 dark:text-blue-200">
                                {daysRemaining} day{daysRemaining !== 1 ? 's' : ''} remaining
                            </p>
                        </div>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-300">{daysRemaining}</div>
                        <div className="text-xs text-blue-700 dark:text-blue-200">days left</div>
                    </div>
                </div>

                {/* Certificates */}
                {certificates.length === 0 ? (
                    <div className="text-center py-16">
                        <Award className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                            No Certificates Found
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-6">
                            This student hasn't shared any certificates with you yet
                        </p>
                        <button
                            onClick={() => navigate('/verifier/search')}
                            className="btn-primary"
                        >
                            Search Another Student
                        </button>
                    </div>
                ) : (
                    <div className={`grid gap-6 ${certificates.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                        {certificates.map(certificate => (
                            <div
                                key={certificate.id}
                                className="bg-white dark:bg-gray-800 rounded-lg shadow border border-slate-200 dark:border-gray-700 p-6 hover:shadow-md transition-shadow"
                            >
                                {/* Certificate Name */}
                                <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-3">
                                    {certificate.certificateName}
                                </h2>

                                {/* Badges */}
                                <div className="flex flex-wrap gap-2 mb-4">
                                    {/* Serial Number */}
                                    <span className="inline-block bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-100 px-3 py-1 rounded-full text-xs font-mono font-semibold border border-slate-300 dark:border-gray-600">
                                        {certificate.serial}
                                    </span>

                                    {/* Level */}
                                    <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-3 py-1 rounded-full text-xs font-semibold">
                                        {certificate.certificateLevel}
                                    </span>
                                </div>

                                {/* Certificate Details */}
                                <div className="space-y-3 mb-4 pb-4 border-b border-slate-200 dark:border-gray-700">
                                    {/* Institution */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase">Institution</p>
                                        <p className="text-sm text-slate-800 dark:text-gray-100">{certificate.institutionName || 'N/A'}</p>
                                    </div>

                                    {/* Issue Date */}
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase">Issue Date</p>
                                        <p className="text-sm text-slate-800 dark:text-gray-100">
                                            {certificate.issueDate ? format(new Date(certificate.issueDate), 'dd MMM yyyy') : 'N/A'}
                                        </p>
                                    </div>

                                    {/* CGPA / Degree Class */}
                                    <div className="grid grid-cols-2 gap-2">
                                        {certificate.cgpa && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase">CGPA</p>
                                                <p className="text-sm text-slate-800 dark:text-gray-100">{certificate.cgpa}</p>
                                            </div>
                                        )}
                                        {certificate.degreeClass && (
                                            <div>
                                                <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase">Class</p>
                                                <p className="text-sm text-slate-800 dark:text-gray-100">{certificate.degreeClass}</p>
                                            </div>
                                        )}
                                    </div>

                                    {/* Department */}
                                    {certificate.department && (
                                        <div>
                                            <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase">Department</p>
                                            <p className="text-sm text-slate-800 dark:text-gray-100">{certificate.department}</p>
                                        </div>
                                    )}
                                </div>

                                {/* View Details Button */}
                                <button
                                    onClick={() => openCertificateModal(certificate)}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                                >
                                    View Full Details
                                </button>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Certificate Detail Modal */}
            {showModal && selectedCertificate && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        {/* Modal Header */}
                        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-slate-200 dark:border-gray-700 px-6 py-4 flex justify-between items-center">
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {selectedCertificate.certificateName}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrint}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                    title="Print certificate"
                                >
                                    <Printer className="w-5 h-5 text-slate-600 dark:text-gray-300" />
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="w-5 h-5 text-slate-600 dark:text-gray-300" />
                                </button>
                            </div>
                        </div>

                        {/* Modal Content */}
                        <div className="px-6 py-6 space-y-6">
                            {/* Serial and Level */}
                            <div>
                                <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-2">Certificate Identifier</p>
                                <div className="flex gap-2">
                                    <span className="inline-block bg-slate-100 dark:bg-gray-700 text-slate-800 dark:text-gray-100 px-4 py-2 rounded-lg text-sm font-mono font-semibold border border-slate-300 dark:border-gray-600">
                                        {selectedCertificate.serial}
                                    </span>
                                    <span className="inline-block bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-200 px-4 py-2 rounded-lg text-sm font-semibold">
                                        {selectedCertificate.certificateLevel}
                                    </span>
                                </div>
                            </div>

                            {/* Institution */}
                            <div>
                                <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Institution</p>
                                <p className="text-base text-slate-800 dark:text-gray-100">{selectedCertificate.institutionName || 'N/A'}</p>
                                {selectedCertificate.institutionRegistration && (
                                    <p className="text-xs text-slate-600 dark:text-gray-400 mt-1">Reg: {selectedCertificate.institutionRegistration}</p>
                                )}
                            </div>

                            {/* Academic Information */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Department</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">{selectedCertificate.department || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Major</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">{selectedCertificate.major || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Session</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">{selectedCertificate.session || 'N/A'}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Roll Number</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">{selectedCertificate.rollNumber || 'N/A'}</p>
                                </div>
                            </div>

                            {/* Performance */}
                            <div className="grid grid-cols-2 gap-4">
                                {selectedCertificate.cgpa && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">CGPA</p>
                                        <p className="text-lg font-bold text-blue-600 dark:text-blue-300">{selectedCertificate.cgpa}</p>
                                    </div>
                                )}
                                {selectedCertificate.degreeClass && (
                                    <div>
                                        <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Degree Class</p>
                                        <p className="text-lg font-bold text-green-600 dark:text-green-400">{selectedCertificate.degreeClass}</p>
                                    </div>
                                )}
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Issue Date</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">
                                        {selectedCertificate.issueDate
                                            ? format(new Date(selectedCertificate.issueDate), 'dd MMM yyyy')
                                            : 'N/A'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Convocation Date</p>
                                    <p className="text-sm text-slate-800 dark:text-gray-100">
                                        {selectedCertificate.convocationDate
                                            ? format(new Date(selectedCertificate.convocationDate), 'dd MMM yyyy')
                                            : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            {/* Authority */}
                            <div className="border-t border-slate-200 dark:border-gray-700 pt-4">
                                <p className="text-xs font-semibold text-slate-600 dark:text-gray-300 uppercase mb-1">Signed By</p>
                                <p className="text-sm text-slate-800 dark:text-gray-100">{selectedCertificate.authorityName || 'N/A'}</p>
                                <p className="text-xs text-slate-600 dark:text-gray-400">{selectedCertificate.authorityTitle || 'N/A'}</p>
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="border-t border-slate-200 dark:border-gray-700 px-6 py-4 flex gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-200 font-medium rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
                            >
                                Close
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
};

export default ViewCertificates;
