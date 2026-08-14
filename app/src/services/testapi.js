const wait = (ms = 700) => new Promise((r) => setTimeout(r, ms));

export const testapi = {
  login: async (email, password) => {
    await wait();
    if (password.length < 6) throw new Error('Invalid email or password');
    return {
      user: { id: 'u1', name: 'Shivansh Saxena', email, role: 'admin' },
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    };
  },
  register: async (payload) => {
    await wait();
    if (!payload?.email) throw new Error('Email is required');
    return { ok: true };
  },
  logout: async () => { await wait(200); return { ok: true }; },
  loginWithGoogle: async (idToken) => {
    await wait();
    if (!idToken) throw new Error('Google sign-in failed');
    return {
      user: { id: 'u1', name: 'Shivansh Saxena', email: 'shivansh@example.com', role: 'admin' },
      accessToken: 'mock.access.token',
      refreshToken: 'mock.refresh.token',
    };
  },
};



let DOCS = Array.from({ length: 47 }, (_, i) => ({
  id: String(i + 1),
  name: `Invoice_${1000 + i}.pdf`,
  type: i % 3 === 0 ? 'image/jpeg' : 'application/pdf',
  size: 120000 + i * 8000,
  status: ['pending', 'processing', 'approved', 'rejected'][i % 4],
  folderId: i % 5 === 0 ? 'f1' : null,
  isFavorite: i % 7 === 0,
  createdAt: new Date(Date.now() - i * 86400000).toISOString(),
  ownerName: 'Shivansh',
  version: 1,
}));

testapi.list = async ({ page = 1, limit = 10, q, status, folderId, favoritesOnly, sort } = {}) => {
  await wait(600);
  let items = [...DOCS];

  if (q) items = items.filter((d) => d.name.toLowerCase().includes(q.toLowerCase()));
  if (status) items = items.filter((d) => d.status === status);
  if (folderId) items = items.filter((d) => d.folderId === folderId);
  if (favoritesOnly) items = items.filter((d) => d.isFavorite);

  if (sort === 'createdAt:desc') items.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (sort === 'createdAt:asc')  items.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (sort === 'name:asc')  items.sort((a, b) => a.name.localeCompare(b.name));
  if (sort === 'size:desc') items.sort((a, b) => b.size - a.size);

  const total = items.length;
  const start = (page - 1) * limit;

  return { items: items.slice(start, start + limit), total, page, totalPages: Math.ceil(total / limit) };
};

testapi.getById   = async (id) => { await wait(300); return DOCS.find((d) => d.id === id); };
testapi.updateMeta = async (id, meta) => {
  await wait(300);
  DOCS = DOCS.map((d) => (d.id === id ? { ...d, ...meta } : d));
  return DOCS.find((d) => d.id === id);
};
testapi.remove = async (id) => { await wait(300); DOCS = DOCS.filter((d) => d.id !== id); return { ok: true }; };

testapi.upload = async (file, meta = {}, onProgress) => {
  for (let p = 0; p <= 100; p += 20) {
    await wait(180);
    onProgress?.(p);
  }
  const doc = {
    id: String(Date.now()),
    name: meta.title ? `${meta.title}.${file.name.split('.').pop()}` : file.name,
    type: file.mimeType,
    size: file.size || 0,
    status: 'processing',          
    folderId: meta.folderId || null,
    isFavorite: false,
    createdAt: new Date().toISOString(),
    ownerName: 'Shivansh',
    version: 1,
    tags: meta.tags ? meta.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
  };
  DOCS = [doc, ...DOCS];
  return doc;
};

testapi.versions = async (id) => {
  await wait(300);
  const doc = DOCS.find((d) => d.id === id);
  if (!doc) return [];
  return Array.from({ length: doc.version }, (_, i) => ({
    version: doc.version - i,
    size: doc.size - i * 2000,
    createdAt: new Date(Date.now() - i * 86400000 * 3).toISOString(),
    author: doc.ownerName,
  }));
};

testapi.stats = async () => {
  await wait(400);
  const by = (s) => DOCS.filter((d) => d.status === s).length;
  return {
    total: DOCS.length,
    pending: by('pending'),
    processing: by('processing'),
    approved: by('approved'),
    rejected: by('rejected'),
    favorites: DOCS.filter((d) => d.isFavorite).length,
    storageBytes: DOCS.reduce((sum, d) => sum + (d.size || 0), 0),
  };
};

testapi.setStatus = async (id, status) => {
  await wait(400);
  DOCS = DOCS.map((d) => (d.id === id ? { ...d, status } : d));
  return DOCS.find((d) => d.id === id);
};



let FOLDERS = [
  { id: 'f1', name: 'Invoices',  documentCount: 10, createdAt: new Date().toISOString() },
  { id: 'f2', name: 'Contracts', documentCount: 0,  createdAt: new Date().toISOString() },
  { id: 'f3', name: 'Receipts',  documentCount: 0,  createdAt: new Date().toISOString() },
];

testapi.folders = {
  list: async () => { await wait(400); return [...FOLDERS]; },

  create: async ({ name }) => {
    await wait(400);
    if (!name?.trim()) throw new Error('Folder name is required');
    if (FOLDERS.some((f) => f.name.toLowerCase() === name.trim().toLowerCase())) {
      throw new Error('A folder with that name already exists');
    }
    const folder = { id: `f${Date.now()}`, name: name.trim(), documentCount: 0, createdAt: new Date().toISOString() };
    FOLDERS = [folder, ...FOLDERS];
    return folder;
  },

  rename: async (id, name) => {
    await wait(300);
    FOLDERS = FOLDERS.map((f) => (f.id === id ? { ...f, name } : f));
    return FOLDERS.find((f) => f.id === id);
  },

  remove: async (id) => {
    await wait(300);
    FOLDERS = FOLDERS.filter((f) => f.id !== id);
    DOCS = DOCS.map((d) => (d.folderId === id ? { ...d, folderId: null } : d));  
    return { ok: true };
  },

  move: async (documentId, folderId) => {
    await wait(300);
    DOCS = DOCS.map((d) => (d.id === documentId ? { ...d, folderId } : d));
    return DOCS.find((d) => d.id === documentId);
  },
};



let NOTIFICATIONS = [
  { id: 'n1', title: 'Document approved', body: 'Invoice_1003.pdf was approved by Priya.', type: 'approval', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'n2', title: 'OCR complete',      body: 'Text extraction finished for Invoice_1007.pdf.', type: 'ocr', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'n3', title: 'Approval requested', body: 'Invoice_1012.pdf is waiting for your review.', type: 'approval', read: false, createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'n4', title: 'Document expiring',  body: 'Contract_2201.pdf expires in 7 days.', type: 'expiry', read: true, createdAt: new Date(Date.now() - 172800000).toISOString() },
];

testapi.notifications = {
  list: async () => { await wait(400); return { items: [...NOTIFICATIONS] }; },

  markRead: async (id) => {
    await wait(200);
    NOTIFICATIONS = NOTIFICATIONS.map((n) => (n.id === id ? { ...n, read: true } : n));
    return { ok: true };
  },

  markAllRead: async () => {
    await wait(300);
    NOTIFICATIONS = NOTIFICATIONS.map((n) => ({ ...n, read: true }));
    return { ok: true };
  },
};
