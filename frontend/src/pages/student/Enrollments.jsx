import React, { useEffect, useState } from 'react';
import { Building2, Calendar, MapPin, Phone, Globe, XCircle } from 'lucide-react';
import api from '../../services/api';
import DashboardLayout from '../../components/DashboardLayout';
import LoadingSpinner from '../../components/LoadingSpinner';
import EmptyState from '../../components/EmptyState';

const Enrollments = () => {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      const response = await api.get('/student/enrollments');
      setEnrollments(response.data.enrollments || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load enrollments.';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
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
      <div className="space-y-6">

        {/* Error */}
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

        {/* Enrollment List */}
        <div className="grid gap-4 md:grid-cols-2">
          {enrollments.length > 0 ? (
            enrollments.map((enrollment) => (
              <div
                key={enrollment.enrollmentId}
                className="rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-wide text-primary">{enrollment.institutionName}</p>
                    <p className="text-xs text-slate-600 dark:text-gray-300">Registration: {enrollment.institutionRegistration || 'N/A'}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm text-slate-700 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    <span>{enrollment.address || 'Address not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-primary" />
                    <span>{enrollment.phone || 'Not provided'}</span>
                  </div>
                  {enrollment.website && (
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-primary" />
                      <a href={enrollment.website} className="text-primary hover:underline" target="_blank" rel="noreferrer">
                        {enrollment.website}
                      </a>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-2 rounded-lg bg-slate-50 dark:bg-gray-700 p-3 text-xs text-slate-600 dark:text-gray-300">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Department</span>
                    <span>{enrollment.department || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Session</span>
                    <span>{enrollment.session || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Student ID</span>
                    <span className="font-mono">{enrollment.studentInstitutionId || 'N/A'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Enrolled</span>
                    <div className="flex items-center gap-1 text-slate-700 dark:text-gray-200">
                      <Calendar className="h-4 w-4 text-primary" />
                      <span>{enrollment.enrollmentDateFormatted || enrollment.enrollmentDate || 'Not available'}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="md:col-span-2">
              <EmptyState
                icon={Building2}
                title="No enrollments found"
                description="Once you are enrolled by a university, it will appear here."
              />
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Enrollments;
