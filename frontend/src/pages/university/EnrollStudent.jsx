import React, { useEffect, useRef, useState } from 'react';
import { Search, User, CheckCircle, Loader2, AlertCircle, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

const EnrollStudent = () => {
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Enrollment form state
  const [enrollmentData, setEnrollmentData] = useState({
    studentInstitutionId: '',
    enrollmentDate: new Date().toISOString().split('T')[0],
    department: '',
    session: ''
  });
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollmentError, setEnrollmentError] = useState(null);
  const [enrollmentSuccess, setEnrollmentSuccess] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const detailsRef = useRef(null);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        performSearch();
      } else {
        setSearchResults([]);
        setSelectedStudent(null);
        setSearchError(null);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Perform student search
  const performSearch = async () => {
    setSearching(true);
    setSearchError(null);
    setEnrollmentSuccess(false);

    try {
      const response = await api.get('/university/students/search', {
        params: { q: searchQuery }
      });

      setSearchResults(response.data.students || []);

      if (response.data.students && response.data.students.length === 0) {
        setSearchError('No students found matching your search.');
      }
    } catch (err) {
      setSearchError(err.response?.data?.error || 'Error searching for students');
      setSearchResults([]);
      console.error('Error:', err);
    } finally {
      setSearching(false);
    }
  };

  // Select a student from search results
  const selectStudent = (student) => {
    setSelectedStudent(student);
    setIsEnrolled(student.isEnrolled || false);
    setEnrollmentData({
      studentInstitutionId: student.studentInstitutionId || '',
      enrollmentDate: new Date().toISOString().split('T')[0],
      department: student.department || '',
      session: ''
    });
    setEnrollmentError(null);
    setSearchResults([]);
  };

  useEffect(() => {
    if (selectedStudent && detailsRef.current) {
      detailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedStudent]);

  // Handle form input changes
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setEnrollmentData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Validate enrollment form
  const validateForm = () => {
    if (!enrollmentData.studentInstitutionId.trim()) {
      setEnrollmentError('Student Institution ID is required');
      return false;
    }
    if (!enrollmentData.department.trim()) {
      setEnrollmentError('Department is required');
      return false;
    }
    if (!enrollmentData.session.trim()) {
      setEnrollmentError('Session is required');
      return false;
    }
    return true;
  };

  // Submit enrollment
  const handleEnroll = async (e) => {
    e.preventDefault();
    setEnrollmentError(null);
    setEnrollmentSuccess(false);

    if (!validateForm()) {
      return;
    }

    if (!selectedStudent?.id) {
      setEnrollmentError('Please select a student');
      return;
    }

    setEnrolling(true);

    try {
      await api.post('/university/students/enroll', {
        studentId: selectedStudent.id,
        studentInstitutionId: enrollmentData.studentInstitutionId,
        enrollmentDate: enrollmentData.enrollmentDate,
        department: enrollmentData.department,
        session: enrollmentData.session
      });

      setEnrollmentSuccess(true);
      setSelectedStudent(null);
      setSearchQuery('');
      setSearchResults([]);
      setEnrollmentData({
        studentInstitutionId: '',
        enrollmentDate: new Date().toISOString().split('T')[0],
        department: '',
        session: ''
      });
    } catch (err) {
      setEnrollmentError(err.response?.data?.error || 'Failed to enroll student. Please try again.');
      console.error('Error:', err);
    } finally {
      setEnrolling(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-2xl py-8 text-slate-900 dark:text-white">
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enroll New Student</h1>
          <p className="text-slate-600 dark:text-gray-300 text-sm">
            Search for a student and enroll them in your institution
          </p>
        </div>

        {/* Success Message */}
        {enrollmentSuccess && (
          <div className="mb-6 rounded-lg border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/30 px-4 py-4 flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-green-900 dark:text-green-100">Student Enrolled Successfully</h3>
              <p className="mt-1 text-sm text-green-700 dark:text-green-200">The student has been enrolled in your institution.</p>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="mb-8 rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ring-1 ring-slate-200 dark:ring-gray-700">
          <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Search Students</h2>

          <div className="flex gap-2">
            <div className="flex-1 relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by email, NID, or name..."
                className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 pl-10 pr-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
              {searching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                </div>
              )}
            </div>
          </div>

          {searchError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
              <div className="flex items-start">
                <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                  <div className="text-sm text-red-700 dark:text-red-300">{searchError}</div>
                </div>
              </div>
            </div>
          )}

          {/* Search Results */}
          {searchResults.length > 0 ? (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium text-slate-700 dark:text-gray-200">
                Found {searchResults.length} student{searchResults.length !== 1 ? 's' : ''}
              </p>
              {searchResults.map((student) => (
                <button
                  key={student.id}
                  onClick={() => selectStudent(student)}
                  className="w-full text-left rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-3 hover:bg-slate-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {student.photo ? (
                        <img
                          src={student.photo}
                          alt={student.firstName}
                          className="h-10 w-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-gray-300">{student.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-600 dark:text-gray-300">ID: {student.nid}</p>
                      {student.isEnrolled && (
                        <span className="inline-block mt-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-xs font-semibold text-green-700 dark:text-green-200">
                          Enrolled
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : !searching && searchQuery.trim().length >= 2 ? (
            <div className="text-center py-16">
              <Search className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Students Found</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">Try adjusting the search keywords</p>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="btn-primary"
              >
                Clear Search
              </button>
            </div>
          ) : null}
        </div>

        {/* Enrollment Form */}
        {selectedStudent && (
          <div
            ref={detailsRef}
            className="rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-lg ring-1 ring-slate-200 dark:ring-gray-700"
          >
            <h2 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Enrollment Details</h2>

            {/* Student Summary */}
            <div className="mb-6 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-4">
              <div className="flex items-start gap-4">
                {selectedStudent.photo ? (
                  <img
                    src={selectedStudent.photo}
                    alt={selectedStudent.firstName}
                    className="h-16 w-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center">
                    <User className="h-8 w-8 text-blue-600 dark:text-blue-300" />
                  </div>
                )}
                <div className="flex-1">
                  <p className="font-semibold text-slate-900 dark:text-white">
                    {selectedStudent.firstName} {selectedStudent.lastName}
                  </p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">{selectedStudent.email}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">Student ID: {selectedStudent.nid}</p>
                  <p className="text-sm text-slate-600 dark:text-gray-300">
                    DOB: {new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB')}
                  </p>
                </div>
              </div>
            </div>

            {/* Already Enrolled Badge */}
            {isEnrolled && (
              <div className="mb-6 flex items-start gap-3 rounded-lg border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 px-4 py-3">
                <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-amber-900 dark:text-amber-100">Already Enrolled</p>
                  <p className="text-sm text-amber-700 dark:text-amber-200">This student is already enrolled in an institution.</p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {enrollmentError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                <div className="flex items-start">
                  <XCircle className="w-5 h-5 text-red-600 dark:text-red-400 mr-2 flex-shrink-0" />
                  <div>
                    <div className="font-medium text-red-900 dark:text-red-100">Error</div>
                    <div className="text-sm text-red-700 dark:text-red-300">{enrollmentError}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Enrollment Form */}
            {!isEnrolled && (
              <form onSubmit={handleEnroll} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                    Student Institution ID (Roll Number) *
                  </label>
                  <input
                    type="text"
                    name="studentInstitutionId"
                    value={enrollmentData.studentInstitutionId}
                    onChange={handleFormChange}
                    placeholder="e.g., CSE-2021-001"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                      Enrollment Date *
                    </label>
                    <input
                      type="date"
                      name="enrollmentDate"
                      value={enrollmentData.enrollmentDate}
                      onChange={handleFormChange}
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-slate-800 dark:text-white shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                      Department *
                    </label>
                    <input
                      type="text"
                      name="department"
                      value={enrollmentData.department}
                      onChange={handleFormChange}
                      placeholder="e.g., Computer Science"
                      required
                      className="mt-2 w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-gray-200">
                    Session (e.g., 2020-2024) *
                  </label>
                  <input
                    type="text"
                    name="session"
                    value={enrollmentData.session}
                    onChange={handleFormChange}
                    placeholder="e.g., 2020-2024"
                    required
                    className="mt-2 w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-slate-800 dark:text-white placeholder-slate-400 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="submit"
                    disabled={enrolling}
                    className="btn-primary flex-1 flex items-center justify-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                  >
                    {enrolling && <Loader2 className="h-4 w-4 animate-spin" />}
                    {enrolling ? 'Enrolling...' : 'Enroll Student'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStudent(null);
                      setEnrollmentError(null);
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default EnrollStudent;
