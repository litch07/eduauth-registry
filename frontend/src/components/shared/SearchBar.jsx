import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function SearchBar() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const fetchResults = async () => {
      if (!query.trim()) {
        setResults([]);
        setIsOpen(false);
        return;
      }

      setLoading(true);
      setIsOpen(true);
      try {
        const { data } = await api.get('/certificates/search', {
          params: { search: query, per_page: 5 }
        });
        setResults(data.results.data || []);
      } catch (error) {
        console.error('Search failed:', error);
      } finally {
        setLoading(false);
      }
    };

    const timerId = setTimeout(() => {
      fetchResults();
    }, 500);

    return () => clearTimeout(timerId);
  }, [query]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <form onSubmit={handleSearchSubmit} className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search className="h-4 w-4 text-gray-400" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
          className="block w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-10 pr-3 text-sm text-gray-900 placeholder-gray-500 focus:border-primary-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white dark:placeholder-gray-400 dark:focus:border-primary-500 dark:focus:bg-gray-900"
          placeholder="Search certificates..."
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 flex items-center pr-3">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </form>

      {isOpen && (query.trim() !== '') && (
        <div className="absolute mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-800 dark:bg-gray-900 z-50">
          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-semibold text-gray-500 dark:text-gray-400">Certificates</p>
                {results.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => {
                      setIsOpen(false);
                      // Navigate to certificate page depending on role, or verify page
                      navigate(`/verify?serial=${cert.serial}`);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800 flex flex-col"
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{cert.certificate_name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Serial: {cert.serial}</span>
                  </button>
                ))}
              </div>
            ) : !loading && (
              <div className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 text-center">
                No results found.
              </div>
            )}
          </div>
          <div className="border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }}
              className="w-full px-4 py-3 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 text-center transition-colors"
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
