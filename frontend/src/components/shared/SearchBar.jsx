import React, { useState, useEffect, useRef } from 'react';
import { Search, Loader2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { cn } from '../../utils/helpers';

export default function SearchBar({ value, onChange, placeholder = "Search certificates...", onClear, className = '' }) {
  const isControlled = value !== undefined;
  const [internalQuery, setInternalQuery] = useState('');
  const query = isControlled ? value : internalQuery;
  const setQuery = isControlled ? onChange : setInternalQuery;

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
    if (isControlled) return; 

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
        setResults(data.results?.data || []);
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
  }, [query, isControlled]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim() && !isControlled) {
      setIsOpen(false);
      navigate(`/search?q=${encodeURIComponent(query)}`);
    }
  };

  const handleClear = () => {
    setQuery('');
    if (onClear) onClear();
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className={cn("relative w-full max-w-md", className)}>
      <form onSubmit={handleSearchSubmit} className="relative flex items-center">
        <div className="absolute left-3 flex items-center text-[var(--text-muted)]">
          <Search className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={query || ''}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            if (query.trim() && !isControlled) setIsOpen(true);
          }}
          className={cn(
            "h-[40px] w-full rounded-[8px] border border-[var(--border)] bg-[var(--bg-elevated)] pl-9 pr-9 text-[14px] text-[var(--text-primary)] outline-none transition-all placeholder-[var(--text-muted)]",
            "focus:border-[var(--brand)] focus:bg-[var(--bg-surface)] focus:shadow-[0_0_0_3px_rgba(99,102,241,0.12)]"
          )}
          placeholder={placeholder}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 flex items-center text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </form>

      {isOpen && !isControlled && (query.trim() !== '') && (
        <div className="absolute mt-1 w-full overflow-hidden rounded-[8px] border border-[var(--border)] bg-[var(--bg-surface)] shadow-[var(--shadow-lg)] z-50">
          <div className="max-h-64 overflow-y-auto">
            {results.length > 0 ? (
              <div className="py-2">
                <p className="px-4 py-1 text-xs font-semibold text-[var(--text-secondary)]">Certificates</p>
                {results.map((cert) => (
                  <button
                    key={cert.id}
                    onClick={() => {
                      setIsOpen(false);
                      navigate(`/verify?serial=${cert.serial}`);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-[var(--bg-elevated)] flex flex-col"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">{cert.certificate_name}</span>
                    <span className="text-xs text-[var(--text-muted)]">Serial: {cert.serial}</span>
                  </button>
                ))}
              </div>
            ) : !loading && (
              <div className="px-4 py-3 text-sm text-[var(--text-muted)] text-center">
                No results found.
              </div>
            )}
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--bg-elevated)]">
            <button
              onClick={() => {
                setIsOpen(false);
                navigate(`/search?q=${encodeURIComponent(query)}`);
              }}
              className="w-full px-4 py-3 text-sm font-medium text-[var(--brand)] hover:text-[var(--brand-hover)] text-center transition-colors"
            >
              See all results for "{query}"
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
