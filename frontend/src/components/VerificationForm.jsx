import React, { useMemo, useState } from 'react';
import { AlertCircle, Search } from 'lucide-react';

const serialPattern = /^(BSC|MSC|PHD)[A-Z0-9]{4,17}$/;

const formatSerial = (value) => {
  let cleaned = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
  if (cleaned.length > 3) {
    cleaned = `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
  }
  if (cleaned.length > 6) {
    cleaned = `${cleaned.slice(0, 6)}-${cleaned.slice(6)}`;
  }
  return cleaned.slice(0, 20);
};

const formatDobInput = (value) => {
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split('-');
    return `${day}/${month}/${year}`;
  }
  const digits = trimmed.replace(/\D/g, '').slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

const isValidDob = (value) => {
  let match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) {
    const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!iso) return false;
    match = [value, iso[3], iso[2], iso[1]];
  }
  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  if (month < 1 || month > 12) return false;
  if (year < 1900) return false;
  const date = new Date(year, month - 1, day);
  if (Number.isNaN(date.getTime())) return false;
  if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
    return false;
  }
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date <= today;
};

function VerificationForm({
  onSubmit,
  initialSerial = '',
  initialDob = '',
  submitLabel = 'Verify Now',
  loading = false
}) {
  const [serial, setSerial] = useState(formatSerial(initialSerial));
  const [dateOfBirth, setDateOfBirth] = useState(formatDobInput(initialDob));
  const [error, setError] = useState('');

  const isFormValid = useMemo(() => {
    const rawSerial = serial.replace(/-/g, '');
    if (!serialPattern.test(rawSerial)) return false;
    if (!isValidDob(dateOfBirth)) return false;
    return true;
  }, [serial, dateOfBirth]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setError('');

    const rawSerial = serial.replace(/-/g, '');
    if (!serialPattern.test(rawSerial)) {
      setError('Serial must start with BSC, MSC, or PHD and be 7-20 characters long.');
      return;
    }
    if (!isValidDob(dateOfBirth)) {
      setError('Date of birth must be a valid past date in DD/MM/YYYY format.');
      return;
    }

    onSubmit?.({ serial, dateOfBirth });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="rounded-lg border border-red-200 dark:border-red-700 bg-red-50 dark:bg-red-900/30 px-4 py-3 text-sm text-red-700 dark:text-red-200 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Serial Number</label>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <Search className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={serial}
              onChange={(e) => setSerial(formatSerial(e.target.value))}
              placeholder="BSC-25-000001M"
              maxLength={20}
              className="w-full py-2 font-mono text-sm tracking-wider text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none uppercase bg-transparent"
              required
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">Format: BSC-25-000001M</p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700 dark:text-gray-200">Date of Birth</label>
          <div className="flex items-center rounded-lg border border-slate-200 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 shadow-sm focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
            <AlertCircle className="mr-2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(formatDobInput(e.target.value))}
              placeholder="DD/MM/YYYY"
              maxLength={10}
              className="w-full py-2 text-sm text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none bg-transparent"
              required
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-gray-400">Use DD/MM/YYYY (or paste YYYY-MM-DD).</p>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="btn-primary w-full flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></span>
        ) : (
          <Search className="h-4 w-4" />
        )}
        {loading ? 'Verifying...' : submitLabel}
      </button>
    </form>
  );
}

export default VerificationForm;
