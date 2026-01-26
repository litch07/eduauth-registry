import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building, Phone, Mail, Lock, AlertCircle, ArrowLeft, UserCheck, XCircle } from 'lucide-react';
import api from '../services/api';
import EmailVerificationModal from '../components/EmailVerificationModal';

const VerifierRegister = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [showVerificationModal, setShowVerificationModal] = useState(false);
    const [registeredEmail, setRegisteredEmail] = useState('');
    const [registrationSuccess, setRegistrationSuccess] = useState(false);

    const [formData, setFormData] = useState({
        companyName: '',
        companyRegistration: '',
        website: '',
        contactPhone: '',
        purpose: '',
        additionalInfo: '',
        email: '',
        password: '',
        confirmPassword: ''
    });

    /**
     * Handle form field changes
     */
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error for this field when user starts typing
        if (validationErrors[name]) {
            setValidationErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    /**
     * Validate email format
     */
    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    /**
     * Validate phone format (basic international format)
     */
    const validatePhone = (phone) => {
        const phoneRegex = /^[0-9+\-\s()]{10,}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    };

    /**
     * Validate URL format
     */
    const validateURL = (url) => {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    };

    /**
     * Validate all form fields
     */
    const validateForm = () => {
        const errors = {};

        // Company Information validation
        if (!formData.companyName.trim()) {
            errors.companyName = 'Company/Organization name is required';
        }

        if (!formData.contactPhone.trim()) {
            errors.contactPhone = 'Contact phone is required';
        } else if (!validatePhone(formData.contactPhone)) {
            errors.contactPhone = 'Invalid phone format';
        }

        if (formData.website && !validateURL(formData.website)) {
            errors.website = 'Invalid URL format. Start with http:// or https://';
        }

        // Verification Purpose validation
        if (!formData.purpose) {
            errors.purpose = 'Please select a verification purpose';
        }

        if (formData.purpose === 'Other' && !formData.additionalInfo.trim()) {
            errors.additionalInfo = 'Please provide additional information when selecting "Other"';
        }

        // Account Credentials validation
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!validateEmail(formData.email)) {
            errors.email = 'Invalid email format';
        }

        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 8) {
            errors.password = 'Password must be at least 8 characters';
        }

        if (!formData.confirmPassword) {
            errors.confirmPassword = 'Please confirm your password';
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = 'Passwords do not match';
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    /**
     * Handle form submission
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMessage(null);

        // Validate form
        if (!validateForm()) {
            return;
        }

        setLoading(true);

        try {
            await api.post(
                '/auth/register/verifier',
                {
                    companyName: formData.companyName.trim(),
                    companyRegistration: formData.companyRegistration.trim() || null,
                    website: formData.website.trim() || null,
                    contactPhone: formData.contactPhone.trim(),
                    purpose: formData.purpose,
                    email: formData.email.trim().toLowerCase(),
                    password: formData.password
                }
            );

            const normalizedEmail = formData.email.trim().toLowerCase();
            setRegisteredEmail(normalizedEmail);
            setShowVerificationModal(true);
            setRegistrationSuccess(false);
            setSuccessMessage('Registration successful! Check your email for the verification code.');
            await api.post('/auth/send-verification-code', { email: normalizedEmail });
        } catch (error) {
            const errorMsg = error.response?.data?.error || 'Registration failed. Please try again.';
            setErrorMessage(errorMsg);
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-50 to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 px-4 py-10 text-slate-900 dark:text-white">
            <div className="max-w-2xl mx-auto">
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="mb-4 flex justify-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-purple-500 to-purple-600 shadow-lg">
                            <UserCheck className="h-8 w-8 text-white" />
                        </div>
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                        Verifier Registration
                    </h1>
                    <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">
                        For employers and background verification agencies
                    </p>
                </div>

                {/* Main Form Card */}
                <div className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl ring-1 ring-slate-200 dark:ring-gray-700">
                    {/* Success Message */}
                    {successMessage && (
                        <div className="mb-4 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-3 text-sm text-green-700 dark:text-green-200">
                            {successMessage}
                        </div>
                    )}

                    {/* Error Message */}
                    {errorMessage && (
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                            <div className="flex items-start">
                                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                                <div>
                                    <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                                    <div className="text-sm text-red-700 dark:text-red-300">{errorMessage}</div>
                                </div>
                            </div>
                        </div>
                    )}
                    {registrationSuccess && (
                        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-6">
                            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
                                Email Verified Successfully!
                            </h3>
                            <p className="text-sm text-green-700 dark:text-green-300">
                                Your account is now pending admin approval. You will receive an email notification once your account is approved.
                            </p>
                            <button
                                onClick={() => navigate('/login')}
                                className="mt-3 text-blue-600 hover:underline text-sm font-medium"
                                type="button"
                            >
                                Go to Login -&gt;
                            </button>
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Section 1: Company Information */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                                <Building className="w-5 h-5 mr-2 text-blue-600" />
                                Company Information
                            </h2>

                            <div className="space-y-4">
                                {/* Company Name */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Company/Organization Name <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                        placeholder="e.g., Acme Corporation"
                                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            validationErrors.companyName ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {validationErrors.companyName && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.companyName}</p>
                                    )}
                                </div>

                                {/* Company Registration */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Company Registration Number
                                    </label>
                                    <input
                                        type="text"
                                        name="companyRegistration"
                                        value={formData.companyRegistration}
                                        onChange={handleChange}
                                        placeholder="e.g., REG-2023-12345"
                                        className="w-full px-4 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>

                                {/* Website */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Official Website
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        placeholder="https://example.com"
                                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            validationErrors.website ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {validationErrors.website && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.website}</p>
                                    )}
                                </div>

                                {/* Contact Phone */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Contact Phone <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center">
                                        <Phone className="w-5 h-5 text-slate-400 dark:text-gray-400 ml-3 mr-0 absolute" />
                                        <input
                                            type="tel"
                                            name="contactPhone"
                                            value={formData.contactPhone}
                                            onChange={handleChange}
                                            placeholder="+880 1234-567890"
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                validationErrors.contactPhone ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                            }`}
                                        />
                                    </div>
                                    {validationErrors.contactPhone && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.contactPhone}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-slate-200 dark:border-gray-700" />

                        {/* Section 2: Verification Purpose */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">
                                Verification Purpose
                            </h2>

                            <div className="space-y-4">
                                {/* Purpose Dropdown */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Select Purpose <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleChange}
                                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            validationErrors.purpose ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                        }`}
                                    >
                                        <option value="">Choose a purpose...</option>
                                        <option value="Employment">Employment Verification</option>
                                        <option value="Admission">Educational Admission</option>
                                        <option value="Background Check">Background Check</option>
                                        <option value="Other">Other</option>
                                    </select>
                                    {validationErrors.purpose && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.purpose}</p>
                                    )}
                                </div>

                                {/* Additional Info (shown only for "Other") */}
                                {formData.purpose === 'Other' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                            Additional Information <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            name="additionalInfo"
                                            value={formData.additionalInfo}
                                            onChange={handleChange}
                                            placeholder="Please describe your verification purpose..."
                                            rows="3"
                                            className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                validationErrors.additionalInfo ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                            }`}
                                        />
                                        {validationErrors.additionalInfo && (
                                            <p className="text-red-500 text-sm mt-1">{validationErrors.additionalInfo}</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Divider */}
                        <hr className="border-slate-200 dark:border-gray-700" />

                        {/* Section 3: Account Credentials */}
                        <div>
                            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4 flex items-center">
                                <Lock className="w-5 h-5 mr-2 text-blue-600" />
                                Account Credentials
                            </h2>

                            <div className="space-y-4">
                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Email <span className="text-red-500">*</span>
                                    </label>
                                    <div className="flex items-center">
                                        <Mail className="w-5 h-5 text-slate-400 dark:text-gray-400 ml-3 mr-0 absolute" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            placeholder="your@company.com"
                                            className={`w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                                validationErrors.email ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                            }`}
                                        />
                                    </div>
                                    {validationErrors.email && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="Min 8 characters"
                                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            validationErrors.password ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {validationErrors.password && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.password}</p>
                                    )}
                                </div>

                                {/* Confirm Password */}
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 dark:text-gray-200 mb-1">
                                        Confirm Password <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="Confirm your password"
                                        className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-700 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            validationErrors.confirmPassword ? 'border-red-500 dark:border-red-500' : 'border-slate-300 dark:border-gray-600'
                                        }`}
                                    />
                                    {validationErrors.confirmPassword && (
                                        <p className="text-red-500 text-sm mt-1">{validationErrors.confirmPassword}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Notice Box */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 dark:border-yellow-700 p-4 rounded">
                            <div className="flex items-start">
                                <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0 mr-3" />
                                <div className="text-sm text-yellow-800 dark:text-yellow-200">
                                    <p className="font-semibold mb-2">Your account will require:</p>
                                    <ul className="list-decimal list-inside space-y-1">
                                        <li>Email verification (check your inbox)</li>
                                        <li>Admin approval (1-2 business days)</li>
                                    </ul>
                                    <p className="mt-2">You will be notified when your account is approved.</p>
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                            {loading ? 'Registering...' : 'Create Verifier Account'}
                        </button>
                    </form>

                    {/* Login Link */}
                    <div className="mt-4 text-center text-sm text-slate-600 dark:text-gray-300">
                        Already have an account?{' '}
                        <Link to="/login" className="font-semibold text-primary hover:text-primary-hover">
                            Sign In
                        </Link>
                    </div>
                </div>

                {/* Back Link */}
                <div className="mt-4 text-center">
                    <Link 
                        to="/register" 
                        className="inline-flex items-center gap-1 text-sm font-semibold text-secondary hover:text-secondary-hover"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Choose Different Role
                    </Link>
                </div>
            </div>
            <EmailVerificationModal
                isOpen={showVerificationModal}
                onClose={() => setShowVerificationModal(false)}
                email={registeredEmail}
                onVerified={() => {
                    setRegistrationSuccess(true);
                }}
            />
        </div>
    );
};

export default VerifierRegister;
