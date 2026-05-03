import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import Landing from './pages/public/Landing';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import EmailVerification from './pages/auth/EmailVerification';
import EmailVerified from './pages/auth/EmailVerified';
import StudentDashboard from './pages/student/Dashboard';
import StudentCertificates from './pages/student/Certificates';
import UniversityDashboard from './pages/university/Dashboard';
import IssueCertificate from './pages/university/IssueCertificate';
import VerifierDashboard from './pages/verifier/Dashboard';
import AdminDashboard from './pages/admin/Dashboard';
import UserApprovals from './pages/admin/UserApprovals';
import VerifyCertificate from './pages/public/VerifyCertificate';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/email-verification" element={<EmailVerification />} />
            <Route path="/email-verified" element={<EmailVerified />} />
            <Route path="/verify" element={<VerifyCertificate />} />

            <Route element={<ProtectedRoute allowedRoles={['student']} />}>
              <Route path="/student/dashboard" element={<StudentDashboard />} />
              <Route path="/student/certificates" element={<StudentCertificates />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['university']} />}>
              <Route path="/university/dashboard" element={<UniversityDashboard />} />
              <Route path="/university/issue-certificate" element={<IssueCertificate />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['verifier']} />}>
              <Route path="/verifier/dashboard" element={<VerifierDashboard />} />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/user-approvals" element={<UserApprovals />} />
            </Route>

            <Route path="*" element={<NotFound />} />
            <Route path="/home" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
