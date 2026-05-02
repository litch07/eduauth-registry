export const cn = (...classes) => classes.filter(Boolean).join(' ');

export const formatDate = (value) => {
  if (!value) return '-';
  return new Date(value).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
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
