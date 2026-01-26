import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Award, CheckCircle, Loader2, Search, XCircle } from 'lucide-react';
import DashboardLayout from '../../components/DashboardLayout';
import api from '../../services/api';

const certificateLevels = ['BACHELOR', 'MASTER', 'DOCTORATE'];

const IssueCertificate = () => {
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [highlightIndex, setHighlightIndex] = useState(-1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [generatedSerial, setGeneratedSerial] = useState('');

  const [formData, setFormData] = useState({
    studentId: '',
    certificateLevel: 'BACHELOR',
    certificateName: '',
    department: '',
    major: '',
    session: '',
    IDNumber: '',
    cgpa: '',
    issueDate: new Date().toISOString().split('T')[0],
    convocationDate: ''
  });
  const [studentSearch, setStudentSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(studentSearch.trim().toLowerCase()), 300);
    return () => clearTimeout(t);
  }, [studentSearch]);

  // Server-side search on debounced term
  useEffect(() => {
    const search = async () => {
      if (!debouncedSearch || debouncedSearch.length < 2) {
        setSearchResults([]);
        setSearching(false);
        setPage(1);
        setHasMore(false);
        setTotal(0);
        setHighlightIndex(-1);
        return;
      }
      setSearching(true);
    try {
      const resp = await api.get('/university/students/enrolled/search', {
        params: { q: debouncedSearch, limit: 20, page: 1, sort: 'asc' }
      });
        const results = resp.data.results || [];
        const totalCount = resp.data.pagination?.total || 0;
        const limit = resp.data.pagination?.limit || 20;
        setSearchResults(results);
        setPage(1);
        setHasMore(results.length < totalCount);
        setTotal(totalCount);
        setHighlightIndex(results.length > 0 ? 0 : -1);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to search students.';
      setError(message);
      console.error('Error:', err);
    } finally {
      setSearching(false);
    }
  };
    search();
  }, [debouncedSearch]);

  const loadMore = async () => {
    try {
      const nextPage = page + 1;
      setSearching(true);
      const resp = await api.get('/university/students/enrolled/search', {
        params: { q: debouncedSearch, limit: 20, page: nextPage, sort: 'asc' }
      });
      const results = resp.data.results || [];
      const totalCount = resp.data.pagination?.total || total;
      const combined = [...searchResults, ...results];
      setSearchResults(combined);
      setPage(nextPage);
      setHasMore(combined.length < totalCount);
      setTotal(totalCount);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to load more results.';
      setError(message);
      console.error('Error:', err);
    } finally {
      setSearching(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSelectStudent = (studentId) => {
    const selected = searchResults.find((s) => String(s.studentId) === String(studentId));
    setFormData((prev) => ({
      ...prev,
      studentId: studentId,
      IDNumber: selected?.studentInstitutionId || ''
    }));
    // keep highlight synced to selected item
    const idx = searchResults.findIndex((s) => String(s.studentId) === String(studentId));
    setHighlightIndex(idx);
  };

  const onKeyDownSearch = (e) => {
    if (!searchResults || searchResults.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.min(prev + 1, searchResults.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightIndex((prev) => Math.max(prev - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightIndex >= 0 && highlightIndex < searchResults.length) {
        const s = searchResults[highlightIndex];
        handleSelectStudent(s.studentId);
      }
    }
  };

  const validateForm = () => {
    if (!formData.studentId || !formData.certificateLevel || !formData.certificateName || !formData.department || !formData.issueDate) {
      setError('Please fill in all required fields.');
      return false;
    }

    if (formData.cgpa && (parseFloat(formData.cgpa) < 0 || parseFloat(formData.cgpa) > 4.0)) {
      setError('CGPA must be between 0.00 and 4.00.');
      return false;
    }

    const today = new Date().toISOString().split('T')[0];
    if (formData.issueDate > today) {
      setError('Issue date cannot be in the future.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await api.post('/university/certificates/issue', {
        ...formData,
        cgpa: formData.cgpa ? parseFloat(formData.cgpa) : null,
        convocationDate: formData.convocationDate || null
      });

      setGeneratedSerial(response.data.serial);
      setShowModal(true);
    } catch (err) {
      const message = err.response?.data?.error || 'Failed to issue certificate.';
      setError(message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueAnother = () => {
    setShowModal(false);
    setGeneratedSerial('');
    setFormData({
      studentId: '',
      certificateLevel: 'BACHELOR',
      certificateName: '',
      department: '',
      major: '',
      session: '',
      IDNumber: '',
      cgpa: '',
      issueDate: new Date().toISOString().split('T')[0],
      convocationDate: ''
    });
    setStudentSearch('');
    setError(null);
  };

  const inputBase = 'w-full rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-slate-800 dark:text-white shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15';
  const labelBase = 'text-sm font-semibold text-slate-700 dark:text-gray-200';

  // No initial loader; results appear as you type

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-4xl space-y-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Issue Certificate</h1>
            <p className="text-sm text-slate-600 dark:text-gray-300">
              Generate a secure, verified digital certificate for an enrolled student.
            </p>
          </div>
          <button
            type="submit"
            form="issueCertificateForm"
            disabled={loading}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:bg-slate-400"
          >
            {loading ? 'Issuing...' : 'Issue Certificate'}
          </button>
        </div>
        <div className="flex items-center gap-3 rounded-lg bg-white dark:bg-gray-800 px-4 py-3 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-white">Generate a secure, verified digital certificate for an enrolled student.</p>
            <p className="text-sm text-slate-600 dark:text-gray-300">Select a student, fill in certificate details, then issue.</p>
          </div>
        </div>

        <div className="rounded-xl bg-white dark:bg-gray-800 p-6 shadow-sm ring-1 ring-slate-200 dark:ring-gray-700">
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

          <form id="issueCertificateForm" onSubmit={handleSubmit} className="space-y-6">
            {/* Section 1: Select Student (Searchable List) */}
            <div className="space-y-2">
              <label className={labelBase}>Search and Select Student *</label>
              
              {!formData.studentId ? (
                <>
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    onKeyDown={onKeyDownSearch}
                    className={inputBase}
                    placeholder="Search by roll, name, or email"
                  />
                  {total > 0 && (
                    <div className="text-xs text-slate-600 dark:text-gray-300">{total} match{total !== 1 ? 'es' : ''} found</div>
                  )}
                  <div className="max-h-56 overflow-y-auto rounded-lg border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                    {searching && (
                      <div className="px-3 py-2 text-sm text-slate-600 dark:text-gray-300 flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Searching...
                      </div>
                    )}
                    {!searching && debouncedSearch.length >= 2 && searchResults.length === 0 && (
                      <div className="text-center py-8">
                        <Search className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-3" />
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No Students Found</h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">Try another roll, name, or email</p>
                        <button
                          type="button"
                          onClick={() => setStudentSearch('')}
                          className="btn-primary"
                        >
                          Clear Search
                        </button>
                      </div>
                    )}
                    {searchResults.map((student, idx) => {
                        const isHighlighted = idx === highlightIndex;
                        return (
                          <button
                            type="button"
                            key={student.studentId}
                            onClick={() => handleSelectStudent(student.studentId)}
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-gray-700"
                          >
                            <div className="flex min-w-0 flex-col">
                              <span className={`truncate font-medium ${isHighlighted ? 'text-primary' : 'text-slate-800 dark:text-gray-100'}`}>{student.studentInstitutionId} - {student.firstName} {student.lastName}</span>
                              {student.email && (
                                <span className="truncate text-xs text-slate-500 dark:text-gray-400">{student.email}</span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    {hasMore && (
                      <div className="p-2">
                        <button
                          type="button"
                          onClick={loadMore}
                          className="w-full rounded-md border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm font-medium text-slate-700 dark:text-gray-200 hover:bg-slate-50 dark:hover:bg-gray-600 disabled:opacity-60"
                          disabled={searching}
                        >
                          {searching ? 'Loading...' : 'Load more'}
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="rounded-lg border border-primary/30 dark:border-primary/40 bg-primary/5 dark:bg-primary/10 p-4">
                  <p className="text-sm font-semibold text-slate-800 dark:text-gray-100">Selected Student</p>
                  <p className="mt-2 text-sm text-slate-700 dark:text-gray-300">
                    ID: <span className="font-semibold">{formData.IDNumber}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, studentId: '', IDNumber: '' }));
                      setStudentSearch('');
                      setSearchResults([]);
                    }}
                    className="mt-3 text-sm text-primary hover:text-primary-hover font-medium"
                  >
                    Change Student
                  </button>
                </div>
              )}
            </div>

            {/* Section 2: Certificate Details */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Certificate Details</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelBase}>Certificate Level *</label>
                  <select
                    value={formData.certificateLevel}
                    onChange={(e) => handleChange('certificateLevel', e.target.value)}
                    className={inputBase}
                    required
                  >
                    {certificateLevels.map((level) => (
                      <option key={level} value={level}>{level}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className={labelBase}>Department *</label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => handleChange('department', e.target.value)}
                    className={inputBase}
                    placeholder="e.g., Computer Science"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className={labelBase}>Certificate Name *</label>
                <input
                  type="text"
                  value={formData.certificateName}
                  onChange={(e) => handleChange('certificateName', e.target.value)}
                  className={inputBase}
                  placeholder="e.g., Bachelor of Science in Computer Science"
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelBase}>Major (Optional)</label>
                  <input
                    type="text"
                    value={formData.major}
                    onChange={(e) => handleChange('major', e.target.value)}
                    className={inputBase}
                    placeholder="e.g., Software Engineering"
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelBase}>Session</label>
                  <input
                    type="text"
                    value={formData.session}
                    onChange={(e) => handleChange('session', e.target.value)}
                    className={inputBase}
                    placeholder="e.g., 2020-2024"
                  />
                </div>
              </div>

              {/* Roll number is auto-filled from selected student/enrollment; no manual input */}
            </div>

            {/* Section 3: Grading */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Grading</h3>
              <div className="space-y-2">
                <label className={labelBase}>CGPA (0.00 - 4.00)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="4.0"
                  value={formData.cgpa}
                  onChange={(e) => handleChange('cgpa', e.target.value)}
                  className={inputBase}
                  placeholder="e.g., 3.75"
                />
              </div>
            </div>

            {/* Section 4: Dates */}
            <div className="space-y-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">Dates</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className={labelBase}>Issue Date *</label>
                  <input
                    type="date"
                    value={formData.issueDate}
                    onChange={(e) => handleChange('issueDate', e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    className={inputBase}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className={labelBase}>Convocation Date (Optional)</label>
                  <input
                    type="date"
                    value={formData.convocationDate}
                    onChange={(e) => handleChange('convocationDate', e.target.value)}
                    className={inputBase}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-3 border-t border-slate-200 dark:border-gray-700 pt-4">
              <button
                type="button"
                onClick={() => navigate('/university/dashboard')}
                className="rounded-lg border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 text-sm font-semibold text-slate-700 dark:text-gray-200 transition hover:bg-slate-50 dark:hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.studentId}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-70"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />}
                {loading ? 'Issuing...' : 'Issue Certificate'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Success Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-center">
              <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-3">
                <CheckCircle className="h-12 w-12 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <h2 className="mb-2 text-center text-xl font-bold text-slate-900 dark:text-white">Certificate Issued Successfully!</h2>
            <p className="mb-4 text-center text-sm text-slate-600 dark:text-gray-300">
              A secure certificate has been generated and stored in the system.
            </p>
            <div className="mb-6 rounded-lg bg-slate-50 dark:bg-gray-700 p-4 text-center">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-300">Generated Serial</p>
              <p className="inline-flex items-center gap-2 rounded-md bg-primary/10 px-4 py-2 font-mono text-2xl font-bold tracking-wider text-primary">
                {generatedSerial}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleIssueAnother}
                className="btn-secondary flex-1 text-sm"
              >
                Issue Another Certificate
              </button>
              <button
                onClick={() => navigate('/university/dashboard')}
                className="btn-primary flex-1 text-sm"
              >
                View Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

export default IssueCertificate;
