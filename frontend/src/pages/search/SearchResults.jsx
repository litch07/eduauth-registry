import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Search, Filter, X, FileText } from 'lucide-react';
import DashboardLayout from '../../components/layout/DashboardLayout';
import Card from '../../components/shared/Card';
import Badge from '../../components/shared/Badge';
import Button from '../../components/shared/Button';
import LoadingSpinner from '../../components/shared/LoadingSpinner';
import EmptyState from '../../components/shared/EmptyState';
import api from '../../services/api';
import Footer from '../../components/layout/Footer';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('q') || '';
  
  const [results, setResults] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [level, setLevel] = useState(searchParams.get('level') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  /**
   * Fetches results from the API based on the current URL search parameters.
   */
  const fetchResults = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/certificates/search', {
        params: {
          search: query,
          status,
          certificate_level: level,
          date_from: dateFrom,
          date_to: dateTo,
          page,
          per_page: 15
        }
      });
      setResults(data.results.data || []);
      setPagination({
        current_page: data.results.current_page,
        last_page: data.results.last_page,
        total: data.results.total,
      });
    } catch (error) {
      console.error('Search results failed:', error);
    } finally {
      setLoading(false);
    }
  }, [query, status, level, dateFrom, dateTo]);

  useEffect(() => {
    fetchResults(1);
  }, [fetchResults]);

  const handleFilterChange = (key, value) => {
    const params = new URLSearchParams(searchParams);
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    setSearchParams(params);
    
    if (key === 'status') setStatus(value);
    if (key === 'level') setLevel(value);
    if (key === 'dateFrom') setDateFrom(value);
    if (key === 'dateTo') setDateTo(value);
  };

  const clearFilters = () => {
    setStatus('');
    setLevel('');
    setDateFrom('');
    setDateTo('');
    setSearchParams(new URLSearchParams(`q=${query}`));
  };

  const FiltersContent = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Filters</h3>
        <button onClick={clearFilters} className="text-xs font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
          Clear all
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Status</label>
          <select 
            value={status} 
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="input-field"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="revoked">Revoked</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Certificate Level</label>
          <select 
            value={level} 
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className="input-field"
          >
            <option value="">All Levels</option>
            <option value="Bachelors">Bachelors</option>
            <option value="Masters">Masters</option>
            <option value="PhD">PhD</option>
            <option value="Diploma">Diploma</option>
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Issue Date Range</label>
          <div className="mt-1 space-y-2">
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="input-field"
            />
            <input
              type="date"
              value={dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="input-field"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.15em] text-primary-600">Search</p>
            <h1 className="mt-2 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Search Results</h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Showing results for "{query}"
              {!loading && pagination && ` (${pagination.total} found)`}
            </p>
          </div>
          
          <Button
            variant="outline"
            onClick={() => setIsMobileFiltersOpen(true)}
            className="md:hidden"
            aria-label="Open filters"
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        <div className="flex flex-col gap-6 md:flex-row">
          {/* Desktop Sidebar */}
          <div className="hidden md:block w-64 flex-shrink-0">
            <Card>
              <FiltersContent />
            </Card>
          </div>

          {/* Mobile Filters Modal */}
          {isMobileFiltersOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 md:hidden">
              <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800">
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
                  <button onClick={() => setIsMobileFiltersOpen(false)} aria-label="Close filters">
                    <X className="h-5 w-5 text-gray-500" />
                  </button>
                </div>
                <FiltersContent />
                <Button
                  onClick={() => setIsMobileFiltersOpen(false)}
                  className="mt-6 w-full"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          )}

          {/* Results List */}
          <div className="flex-1">
            {loading ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <LoadingSpinner />
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-4">
                {results.map((cert) => (
                  <Card key={cert.id} className="transition hover:shadow-xl">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                          <FileText className="h-5 w-5" />
                        </div>
                        <div>
                          <h4 className="text-base font-semibold text-gray-900 dark:text-white">{cert.certificate_name}</h4>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <span>Serial: {cert.serial}</span>
                            <span>&bull;</span>
                            <span>Student: {cert.student?.user?.name || 'N/A'}</span>
                            <span>&bull;</span>
                            <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={cert.revoked_at ? 'danger' : 'success'}>
                          {cert.revoked_at ? 'Revoked' : 'Active'}
                        </Badge>
                        <button
                          onClick={() => navigate(`/verify?serial=${cert.serial}`)}
                          className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 transition"
                        >
                          View Details &rarr;
                        </button>
                      </div>
                    </div>
                  </Card>
                ))}

                {/* Pagination controls */}
                {pagination && pagination.last_page > 1 && (
                  <div className="mt-6 flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Page {pagination.current_page} of {pagination.last_page}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        disabled={pagination.current_page === 1}
                        onClick={() => fetchResults(pagination.current_page - 1)}
                      >
                        Previous
                      </Button>
                      <Button
                        variant="outline"
                        disabled={pagination.current_page === pagination.last_page}
                        onClick={() => fetchResults(pagination.current_page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <EmptyState
                title="No results found"
                message={`We couldn't find anything matching "${query}". Try adjusting your filters or search term.`}
                icon={Search}
                action={
                  <Button onClick={clearFilters}>
                    Clear all filters
                  </Button>
                }
              />
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
