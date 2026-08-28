export const ENDPOINTS = {
  login: '/auth/login',
  register: '/auth/register',
  refresh: '/auth/refresh',
  logout: '/auth/logout',
  googleSso: '/auth/sso/google',

  mfaSetup: '/auth/mfa/setup',
  mfaConfirm: '/auth/mfa/confirm',
  mfaVerify: '/auth/mfa/verify',
  mfaDisable: '/auth/mfa/disable',

  forgotPassword: '/auth/forgot-password',
  resetPassword: '/auth/reset-password',
  setPassword: '/auth/set-password',


  documents: '/documents',
  documentById: (id) => `/documents/${id}`,
  documentContent: (id) => `/documents/${id}/content`,
  download: (id) => `/documents/${id}/download`,

  folders: '/folders',
  folderById: (id) => `/folders/${id}`,
  moveDocument: (id) => `/documents/${id}/move`,

  approve: (id) => `/approvals/${id}/approve`,
  reject: (id) => `/approvals/${id}/reject`,

  notifications: '/notifications',
  profile: '/profile',

  storage: '/storage',

  uploadInit: '/uploads/init',
  uploadChunk: (id, index) => `/uploads/${id}/chunk/${index}`,
  uploadStatus: (id) => `/uploads/${id}`,
  uploadComplete: (id) => `/uploads/${id}/complete`,
  uploadAbort: (id) => `/uploads/${id}`,
};