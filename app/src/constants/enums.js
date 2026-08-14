export const DOC_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};

export const ROLES = { ADMIN: 'admin', USER: 'user' };

export const SORT_OPTIONS = [
  { key: 'createdAt:desc', label: 'Newest first' },
  { key: 'createdAt:asc',  label: 'Oldest first' },
  { key: 'name:asc',       label: 'Name A-Z' },
  { key: 'size:desc',      label: 'Largest first' },
];