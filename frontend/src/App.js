import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DarkModeProvider } from './context/DarkModeContext';
import { Loader2 } from 'lucide-react';

// Public pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import RegisterRoleSelect from './pages/RegisterRoleSelect';
import StudentRegister from './pages/StudentRegister';
import UniversityRegister from './pages/UniversityRegister';
import Verify from './pages/Verify';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Student pages
import StudentDashboard from './pages/student/Dashboard';
import StudentCertificates from './pages/student/Certificates';
import StudentEnrollments from './pages/student/Enrollments';
import Profile from './pages/shared/Profile';

// University pages
import UniversityDashboard from './pages/university/Dashboard';
import UniversityEnrollStudent from './pages/university/EnrollStudent';
import IssueCertificate from './pages/university/IssueCertificate';
import UniversityStudents from './pages/university/Students';
import UniversityCertificates from './pages/university/Certificates';

// Admin pages
import AdminDashboard from './pages/admin/Dashboard';
import VerificationAnalytics from './pages/admin/VerificationAnalytics';
import ActivityLogs from './pages/admin/ActivityLogs';
import PendingApprovals from './pages/admin/PendingApprovals';
import Verifiers from './pages/admin/Verifiers';
import AdminUsers from './pages/admin/Users';
import AdminCertificates from './pages/admin/Certificates';
import AdminVerifications from './pages/admin/Verifications';

// Verifier pages
import VerifierRegister from './pages/VerifierRegister';
import VerifierDashboard from './pages/verifier/Dashboard';
import SearchStudent from './pages/verifier/SearchStudent';
import MyRequests from './pages/verifier/MyRequests';
import ActiveAccess from './pages/verifier/ActiveAccess';
import ViewCertificates from './pages/verifier/ViewCertificates';
import VerificationHistory from './pages/verifier/VerificationHistory';

// Student request management pages
import CertificateRequests from './pages/student/CertificateRequests';
import GrantedAccess from './pages/student/GrantedAccess';

/**
 * ProtectedRoute Component
 * Wraps routes that require authentication and optional role-based access
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Child components to render
 * @param {string} props.requiredRole - Required role for access (optional)
 */
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role-based access if required
  if (requiredRole && user.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  // User is authenticated and has correct role
  return children;
};

/**
 * Main App Component
 * Sets up routing and authentication context
 */
function App() {
  return (
    <DarkModeProvider>
      <AuthProvider>
        <BrowserRouter>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<RegisterRoleSelect />} />
          <Route path="/register/student" element={<StudentRegister />} />
          <Route path="/register/university" element={<UniversityRegister />} />
          <Route path="/register/verifier" element={<VerifierRegister />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />

          {/* Student Protected Routes */}
          <Route
            path="/student/dashboard"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificates"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/enrollments"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <StudentEnrollments />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/certificate-requests"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <CertificateRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/granted-access"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <GrantedAccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student/profile"
            element={
              <ProtectedRoute requiredRole="STUDENT">
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* University Protected Routes */}
          <Route
            path="/university/dashboard"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <UniversityDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/enroll-student"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <UniversityEnrollStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/issue-certificate"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <IssueCertificate />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/certificates"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <UniversityCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/students"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <UniversityStudents />
              </ProtectedRoute>
            }
          />
          <Route
            path="/university/profile"
            element={
              <ProtectedRoute requiredRole="UNIVERSITY">
                <Profile />
              </ProtectedRoute>
            }
          />

          {/* Verifier Protected Routes */}
          <Route
            path="/verifier/dashboard"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <VerifierDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/profile"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/search"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <SearchStudent />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/requests"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <MyRequests />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/access"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <ActiveAccess />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/view-certificates/:studentId"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <ViewCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/verifier/verification-history"
            element={
              <ProtectedRoute requiredRole="VERIFIER">
                <VerificationHistory />
              </ProtectedRoute>
            }
          />

          {/* Admin Protected Routes */}
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/profile"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/analytics"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <VerificationAnalytics />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/logs"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <ActivityLogs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/pending-approvals"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <PendingApprovals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/certificates"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminCertificates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifications"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <AdminVerifications />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/verifiers"
            element={
              <ProtectedRoute requiredRole="ADMIN">
                <Verifiers />
              </ProtectedRoute>
            }
          />
          <Route path="/admin/verification-analytics" element={<Navigate to="/admin/analytics" replace />} />
          <Route path="/admin/activity-logs" element={<Navigate to="/admin/logs" replace />} />
          <Route path="/admin/pending-verifiers" element={<Navigate to="/admin/pending-approvals" replace />} />
          {/* 404 Fallback - Redirect to home */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
    </DarkModeProvider>
  );
}

export default App;
