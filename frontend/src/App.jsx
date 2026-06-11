import React, { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';
import ErrorBoundary from './components/shared/ErrorBoundary';
import PageLoader from './components/shared/PageLoader';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const Landing = React.lazy(() => import('./pages/public/Landing'));
const Login = React.lazy(() => import('./pages/auth/Login'));
const Register = React.lazy(() => import('./pages/auth/Register'));
const RegisterLanding = React.lazy(() => import('./pages/auth/RegisterLanding'));
const EmailVerification = React.lazy(() => import('./pages/auth/EmailVerification'));
const EmailVerified = React.lazy(() => import('./pages/auth/EmailVerified'));
const VerifyEmailChange = React.lazy(() => import('./pages/auth/VerifyEmailChange'));
const ForgotPassword = React.lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = React.lazy(() => import('./pages/auth/ResetPassword'));
const Profile = React.lazy(() => import('./pages/profile/Profile'));
const Settings = React.lazy(() => import('./pages/profile/Settings'));
const StudentDashboard = React.lazy(() => import('./pages/student/Dashboard'));
const StudentCertificates = React.lazy(() => import('./pages/student/Certificates'));
const StudentAccessRequests = React.lazy(() => import('./pages/student/AccessRequests'));
const MyUniversity = React.lazy(() => import('./pages/student/MyUniversity'));
const BrowseUniversities = React.lazy(() => import('./pages/student/BrowseUniversities'));
const UniversityDashboard = React.lazy(() => import('./pages/university/Dashboard'));
const UniversityCertificates = React.lazy(() => import('./pages/university/Certificates'));
const Enrollments = React.lazy(() => import('./pages/university/Enrollments'));
const IssueCertificate = React.lazy(() => import('./pages/university/IssueCertificate'));
const UniversitySettings = React.lazy(() => import('./pages/university/Settings'));
const VerifierDashboard = React.lazy(() => import('./pages/verifier/Dashboard'));
const VerifierAccessRequests = React.lazy(() => import('./pages/verifier/AccessRequests'));
const VerifierVerifyCertificate = React.lazy(() => import('./pages/verifier/VerifyCertificate'));
const VerificationHistory = React.lazy(() => import('./pages/verifier/VerificationHistory'));
const AdminDashboard = React.lazy(() => import('./pages/admin/Dashboard'));
const AdminAnalytics = React.lazy(() => import('./pages/admin/Analytics'));
const AdminCertificates = React.lazy(() => import('./pages/admin/Certificates'));
const AdminUsers = React.lazy(() => import('./pages/admin/Users'));
const AdminUserDetails = React.lazy(() => import('./pages/admin/UserDetails'));
const ProfileChangeRequests = React.lazy(() => import('./pages/admin/ProfileChangeRequests'));
const AdminActivityLogs = React.lazy(() => import('./pages/admin/ActivityLogs'));
const VerifyCertificate = React.lazy(() => import('./pages/public/VerifyCertificate'));
const NotFound = React.lazy(() => import('./pages/NotFound'));
const SearchResults = React.lazy(() => import('./pages/search/SearchResults'));
const Notifications = React.lazy(() => import('./pages/notifications/Notifications'));

// Public pages
const ParticipatingUniversities = React.lazy(() => import('./pages/public/ParticipatingUniversities'));
const HelpCenter = React.lazy(() => import('./pages/public/HelpCenter'));
const PrivacyPolicy = React.lazy(() => import('./pages/public/PrivacyPolicy'));
const TermsOfService = React.lazy(() => import('./pages/public/TermsOfService'));
const SecurityCompliance = React.lazy(() => import('./pages/public/SecurityCompliance'));
const VerificationAPI = React.lazy(() => import('./pages/public/VerificationAPI'));
const SystemStatus = React.lazy(() => import('./pages/public/SystemStatus'));
const ContactSupport = React.lazy(() => import('./pages/public/ContactSupport'));

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ScrollToTop />
      <AuthProvider>
        <ThemeProvider>
          <NotificationProvider>
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 3500,
                style: {
                  borderRadius: '12px',
                  background: '#111827',
                  color: '#fff',
                },
              }}
            />
            <ErrorBoundary>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<RegisterLanding />} />
                  <Route path="/register/:role" element={<Register />} />
                  <Route path="/email-verification" element={<EmailVerification />} />
                  <Route path="/email-verified" element={<EmailVerified />} />
                  <Route path="/verify-email-change" element={<VerifyEmailChange />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/verify" element={<VerifyCertificate />} />
                  
                  {/* Public Information Pages */}
                  <Route path="/universities" element={<ParticipatingUniversities />} />
                  <Route path="/help" element={<HelpCenter />} />
                  <Route path="/privacy" element={<PrivacyPolicy />} />
                  <Route path="/terms" element={<TermsOfService />} />
                  <Route path="/security" element={<SecurityCompliance />} />
                  <Route path="/api-docs" element={<VerificationAPI />} />
                  <Route path="/status" element={<SystemStatus />} />
                  <Route path="/contact" element={<ContactSupport />} />

                  <Route element={<ProtectedRoute allowedRoles={['student', 'university', 'verifier', 'admin']} />}>
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/search" element={<SearchResults />} />
                    <Route path="/notifications" element={<Notifications />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['student']} />}>
                    <Route path="/student/dashboard" element={<StudentDashboard />} />
                    <Route path="/student/certificates" element={<StudentCertificates />} />
                    <Route path="/student/access-requests" element={<StudentAccessRequests />} />
                    <Route path="/student/my-university" element={<MyUniversity />} />
                    <Route path="/student/universities" element={<BrowseUniversities />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['university']} />}>
                    <Route path="/university/dashboard" element={<UniversityDashboard />} />
                    <Route path="/university/certificates" element={<UniversityCertificates />} />
                    <Route path="/university/enrollments" element={<Enrollments />} />
                    <Route path="/university/issue-certificate" element={<IssueCertificate />} />
                    <Route path="/university/settings" element={<UniversitySettings />} />
                    <Route path="/university/departments" element={<Navigate to="/university/settings?tab=departments" replace />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['verifier']} />}>
                    <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
                    <Route path="/verifier/access-requests" element={<VerifierAccessRequests />} />
                    <Route path="/verifier/verify-certificate" element={<VerifierVerifyCertificate />} />
                    <Route path="/verifier/verification-history" element={<VerificationHistory />} />
                  </Route>

                  <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
                    <Route path="/admin/dashboard" element={<AdminDashboard />} />
                    <Route path="/admin/certificates" element={<AdminCertificates />} />
                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/users/:id" element={<AdminUserDetails />} />
                    <Route path="/admin/user-approvals" element={<Navigate to="/admin/users?status=pending" replace />} />
                    <Route path="/admin/profile-change-requests" element={<ProfileChangeRequests />} />
                    <Route path="/admin/activity-logs" element={<AdminActivityLogs />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                  <Route path="/home" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </NotificationProvider>
        </ThemeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
