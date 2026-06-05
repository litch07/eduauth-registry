import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { Building2, Search, MapPin, Globe, ArrowLeft, Upload, X, Send } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Button from '../../components/shared/Button';
import Input from '../../components/shared/Input';
import Modal from '../../components/shared/Modal';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import api from '../../services/api';

export default function BrowseUniversities() {
  const navigate = useNavigate();
  const [institutions, setInstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ current_page: 1, last_page: 1, total: 0 });
  const [applyingTo, setApplyingTo] = useState(null);

  const fetchInstitutions = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/student/universities', {
        params: { search, page },
      });
      setInstitutions(data.institutions || []);
      if (data.pagination) setPagination(data.pagination);
    } catch (_err) {
      toast.error('Failed to load universities');
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    setPage(1);
  }, [search]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchInstitutions();
    }, search ? 300 : 0);
    return () => clearTimeout(timeout);
  }, [fetchInstitutions, search]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Education</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">
              Browse Universities
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Discover approved universities and submit enrollment applications
            </p>
          </div>
          <Button variant="secondary" onClick={() => navigate('/student/my-university')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to My University
          </Button>
        </div>

        {/* Search */}
        <Card>
          <div className="relative">
            <Input
              type="text"
              placeholder="Search by university name, city, or address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-11"
            />
            <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>
        </Card>

        {/* Content */}
        {loading ? (
          <Card>
            <div className="flex min-h-64 items-center justify-center">
              <LoadingSpinner />
            </div>
          </Card>
        ) : institutions.length === 0 ? (
          <EmptyState
            title={search ? 'No universities found' : 'No approved universities'}
            message={search ? 'Try adjusting your search query.' : 'There are no approved universities available at this time.'}
            icon={Building2}
          />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {institutions.map((uni) => (
                <Card
                  key={uni.id}
                  className="group border border-transparent transition-all hover:border-primary-200 hover:shadow-xl dark:hover:border-primary-900/40"
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="rounded-xl bg-primary-50 p-3 text-primary-700 dark:bg-primary-900/30 dark:text-primary-300 shrink-0">
                        <Building2 className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-base font-semibold text-gray-900 dark:text-white truncate">
                          {uni.name}
                        </h3>
                        {uni.registration_number && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                            Reg: {uni.registration_number}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2 flex-1">
                      {(uni.city || uni.address) && (
                        <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-gray-400" />
                          <span className="line-clamp-2">
                            {[uni.address, uni.city].filter(Boolean).join(', ')}
                          </span>
                        </div>
                      )}
                      {uni.website && (
                        <div className="flex items-center gap-2 text-sm">
                          <Globe className="h-4 w-4 shrink-0 text-gray-400" />
                          <a
                            href={uni.website.startsWith('http') ? uni.website : `https://${uni.website}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 truncate"
                          >
                            {uni.website.replace(/^https?:\/\//, '')}
                          </a>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                      <Button
                        className="w-full"
                        onClick={() => setApplyingTo(uni)}
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Apply
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {pagination.last_page > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-6 dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Showing page <span className="font-medium">{pagination.current_page}</span> of{' '}
                  <span className="font-medium">{pagination.last_page}</span> ({pagination.total} universities)
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page === 1}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setPage((p) => Math.min(pagination.last_page, p + 1))}
                    disabled={pagination.current_page === pagination.last_page}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Application Modal */}
        {applyingTo && (
          <ApplicationModal
            university={applyingTo}
            onClose={() => setApplyingTo(null)}
            onSuccess={() => {
              setApplyingTo(null);
              fetchInstitutions();
            }}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── APPLICATION MODAL ──────────────────────────────────────
function ApplicationModal({ university, onClose, onSuccess }) {
  const [program, setProgram] = useState('');
  const [batch, setBatch] = useState('');
  const [reason, setReason] = useState('');
  const [file, setFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (selected) {
      if (selected.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        e.target.value = '';
        return;
      }
      const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
      if (!allowed.includes(selected.type)) {
        toast.error('Only PDF, JPG, and PNG files are allowed');
        e.target.value = '';
        return;
      }
      setFile(selected);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('institution_id', university.id);
      if (program) formData.append('program', program);
      if (batch) formData.append('batch', batch);
      if (reason) formData.append('reason', reason);
      if (file) formData.append('document', file);

      const { data } = await api.post('/student/enrollment-applications', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success(data.message || 'Application submitted successfully');
      onSuccess();
    } catch (err) {
      const errorMsg = err.response?.data?.message
        || err.response?.data?.errors?.institution_id?.[0]
        || 'Failed to submit application';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={true} onClose={onClose} title={`Apply to ${university.name}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-2xl bg-primary-50 p-4 dark:bg-primary-900/20">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary-600 p-2">
              <Building2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="font-semibold text-gray-900 dark:text-white">{university.name}</p>
              {(university.city || university.address) && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {[university.address, university.city].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800/30 dark:bg-amber-900/20">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <strong>Note:</strong> Your application will be sent to the university for review.
            All fields below are optional but help the university process your application faster.
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900/30 dark:bg-red-900/20">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Program of Interest <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            placeholder="e.g. BSc in Computer Science"
            maxLength={255}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Batch / Intake <span className="text-gray-400">(Optional)</span>
          </label>
          <input
            type="text"
            className="block w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm text-gray-900 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="e.g. Spring 2026"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Reason for Applying <span className="text-gray-400">(Optional)</span>
          </label>
          <textarea
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white dark:focus:border-primary-400 dark:focus:ring-primary-400 min-h-[100px]"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Tell the university why you'd like to enroll..."
            maxLength={2000}
          />
          {reason.length > 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{reason.length}/2000 characters</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
            Supporting Document <span className="text-gray-400">(Optional)</span>
          </label>
          <div className="relative">
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100 dark:text-gray-400 dark:file:bg-primary-900/30 dark:file:text-primary-300"
            />
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            PDF, JPG, or PNG files up to 5MB
          </p>
          {file && (
            <div className="mt-2 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
              <Upload className="h-3 w-3" />
              <span>{file.name} ({(file.size / 1024).toFixed(1)} KB)</span>
              <button type="button" onClick={() => setFile(null)} className="text-red-500 hover:text-red-700">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={submitting} className="flex-1">
            <Send className="mr-2 h-4 w-4" />
            Submit Application
          </Button>
        </div>
      </form>
    </Modal>
  );
}
