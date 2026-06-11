export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const formatDate = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

export const formatDateTime = (value) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} ${hours}:${minutes}`;
};

export const roleLabel = (role) => {
  switch (role) {
    case 'student':
      return 'Student';
    case 'university':
      return 'University';
    case 'verifier':
      return 'Verifier';
    case 'admin':
      return 'Admin';
    default:
      return 'User';
  }
};

export const typography = {
  pageTitle: 'text-xl font-semibold tracking-tight',
  sectionTitle: 'text-base font-semibold',
  cardTitle: 'text-sm font-semibold text-[var(--text-secondary)]',
  body: 'text-sm text-[var(--text-primary)]',
  bodyMuted: 'text-sm text-[var(--text-secondary)]',
  caption: 'text-xs text-[var(--text-muted)]',
  label: 'text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide',
};

export const generateBatchOptions = () => {
  const currentYear = new Date().getFullYear();
  const intakes = ['Spring', 'Summer', 'Fall'];
  const years = [currentYear, currentYear + 1];
  
  const options = [];
  years.forEach(year => {
    intakes.forEach(intake => {
      options.push({
        value: `${intake} ${year}`,
        label: `${intake} ${year}`
      });
    });
  });
  
  // Also push a generic "Other" just in case they don't fall into these
  options.push({ value: 'Other', label: 'Other' });
  
  return options;
};
