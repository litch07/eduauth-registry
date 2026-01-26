import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Mail, Phone, GraduationCap, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';
import LoadingSpinner from '../../components/LoadingSpinner';

const Students = () => {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('roll'); // 'roll' | 'name' | 'email'
  const [sortDir, setSortDir] = useState('asc'); // 'asc' | 'desc'

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    // Filter
    let list = [];
    if (searchQuery.trim() === '') {
      list = students;
    } else {
      const query = searchQuery.toLowerCase();
      list = students.filter((student) => {
        const name = student.studentName || `${student.firstName || ''} ${student.middleName || ''} ${student.lastName || ''}`.trim();
        const fullName = name.toLowerCase();
        const email = (student.studentEmail || student.email || '').toLowerCase();
        const studentId = (student.studentInstitutionId || student.studentId || '').toLowerCase();
        const department = student.department?.toLowerCase() || '';
        return (
          fullName.includes(query) ||
          email.includes(query) ||
          studentId.includes(query) ||
          department.includes(query)
        );
      });
    }

    // Sort
    const getKey = (s) => {
      if (sortBy === 'name') {
        const name = s.studentName || `${s.firstName || ''} ${s.middleName || ''} ${s.lastName || ''}`.trim();
        return name.toLowerCase();
      }
      if (sortBy === 'email') {
        return (s.studentEmail || s.email || '').toLowerCase();
      }
      // default roll
      return (s.studentInstitutionId || s.studentId || '').toLowerCase();
    };

    const sorted = [...list].sort((a, b) => {
      const A = getKey(a);
      const B = getKey(b);
      if (A < B) return sortDir === 'asc' ? -1 : 1;
      if (A > B) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredStudents(sorted);
  }, [searchQuery, students, sortBy, sortDir]);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/university/students');
      setStudents(response.data.students || []);
      setFilteredStudents(response.data.students || []);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load students.';
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
      <div className="mx-auto max-w-7xl space-y-6 p-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Enrolled Students</h1>
          <p className="text-sm text-slate-600 dark:text-gray-300">
            Manage and view all students enrolled at your institution.
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

        {/* Search and Stats Bar */}
        <div className="rounded-xl bg-white dark:bg-gray-800 p-5 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-600">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{students.length}</p>
                <p className="text-sm text-slate-600 dark:text-gray-300">Total Enrolled Students</p>
              </div>
            </div>

            {/* Search Bar */}
            <div className="flex w-full flex-col items-stretch gap-3 md:w-auto md:flex-row md:items-center">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search by name, email, ID, or department..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 py-2 pl-10 pr-4 text-sm text-slate-800 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="roll">Sort: Roll</option>
                  <option value="name">Sort: Name</option>
                  <option value="email">Sort: Email</option>
                </select>
                <select
                  value={sortDir}
                  onChange={(e) => setSortDir(e.target.value)}
                  className="rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  <option value="asc">Asc</option>
                  <option value="desc">Desc</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Students List */}
        <div className="rounded-xl bg-white dark:bg-gray-800 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="border-b border-slate-200 dark:border-gray-700 px-5 py-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Students List
              {searchQuery && (
                <span className="ml-2 text-sm font-normal text-slate-600 dark:text-gray-300">
                  ({filteredStudents.length} {filteredStudents.length === 1 ? 'result' : 'results'})
                </span>
              )}
            </h2>
          </div>

          <div className="p-5">
            {filteredStudents.length > 0 ? (
              <div className="space-y-4">
                {filteredStudents.map((student) => (
                  <div
                    key={student.studentId || student.id}
                    className="flex flex-col gap-4 rounded-lg border border-slate-200 dark:border-gray-700 bg-slate-50 dark:bg-gray-700 p-4 transition hover:border-primary/30 hover:bg-white dark:hover:bg-gray-600 hover:shadow-sm md:flex-row md:items-center md:justify-between"
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-primary-light text-white">
                        <GraduationCap className="h-6 w-6" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {student.studentName || `${student.firstName || ''} ${student.middleName ? `${student.middleName} ` : ''}${student.lastName || ''}`.trim()}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-gray-300">
                          <div className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            <span>{student.studentEmail || student.email}</span>
                          </div>
                          {student.phone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-4 w-4" />
                              <span>{student.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 text-sm md:items-end">
                      {student.studentInstitutionId && (
                        <div className="rounded-lg bg-white dark:bg-gray-800 px-3 py-1 font-mono text-xs font-semibold text-primary ring-1 ring-slate-200 dark:ring-gray-600">
                          ID: {student.studentInstitutionId}
                        </div>
                      )}
                      {student.department && (
                        <div className="text-slate-600 dark:text-gray-300">
                          <span className="font-semibold">Department:</span> {student.department}
                        </div>
                      )}
                      {student.session && (
                        <div className="text-slate-600 dark:text-gray-300">
                          <span className="font-semibold">Session:</span> {student.session}
                        </div>
                      )}
                      {student.enrollmentDate && (
                        <div className="text-xs text-slate-500 dark:text-gray-400">
                          Enrolled: {student.enrollmentDate}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Users className="w-20 h-20 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {searchQuery ? 'No Students Found' : 'No Students Enrolled Yet'}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">
                  {searchQuery
                    ? 'Try adjusting your search criteria'
                    : 'Start by enrolling students to your institution'}
                </p>
                {searchQuery ? (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="btn-primary"
                  >
                    Clear Search
                  </button>
                ) : (
                  <button
                    onClick={() => navigate('/university/enroll-student')}
                    className="btn-primary"
                  >
                    Enroll Student
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Students;
