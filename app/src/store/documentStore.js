import { create } from 'zustand';
import { documentService } from '../services/documentService';
import { cache } from '../services/cache';
import { PAGE_SIZE } from '../constants/config';

const initialFilters = { status: null, folderId: null, favoritesOnly: false };


const cacheKey = ({ query, sort, filters }) =>
  `documents.${sort}.${query || ''}.${filters.status || ''}.${filters.folderId || ''}.${filters.favoritesOnly ? 'fav' : ''}`;

export const useDocumentStore = create((set, get) => ({
  documents: [],
  page: 1,
  hasMore: true,
  loading: false,
  refreshing: false,
  loadingMore: false,
  error: null,
  fromCache: false,
  query: '',
  sort: 'createdAt:desc',
  filters: initialFilters,
  currentFolder: null,

  fetchDocuments: async ({ reset = false, refresh = false } = {}) => {
    const { page, query, sort, filters, loading, refreshing, loadingMore, hasMore } = get();
    const targetPage = reset || refresh ? 1 : page;

    if (!reset && !refresh) {
      if (loading || refreshing || loadingMore || !hasMore) return;
      set({ loadingMore: true, error: null });
    } else {
      set(refresh ? { refreshing: true, error: null } : { loading: true, error: null });
    }

    try {
      const data = await documentService.list({
        page: targetPage,
        limit: PAGE_SIZE,
        q: query || undefined,
        sort,
        status: filters.status || undefined,
        folderId: filters.folderId || undefined,
        favoritesOnly: filters.favoritesOnly || undefined,
      });

      set((s) => ({
        documents: targetPage === 1 ? data.items : [...s.documents, ...data.items],
        page: targetPage + 1,
        hasMore: targetPage < data.totalPages,
        loading: false,
        refreshing: false,
        loadingMore: false,
        fromCache: false,
      }));

      if (targetPage === 1) cache.set(cacheKey({ query, sort, filters }), data.items);
    } catch (e) {

      if (targetPage === 1) {
        const cached = await cache.get(cacheKey({ query, sort, filters }), { ignoreTtl: true });
        if (cached?.length) {
          return set({
            documents: cached,
            fromCache: true,
            hasMore: false,
            loading: false,
            refreshing: false,
            loadingMore: false,
            error: null,
          });
        }
      }
      set({ error: e.message, loading: false, refreshing: false, loadingMore: false });
    }
  },

  loadMore: () => get().fetchDocuments({}),

  refresh: () => {
    set({ page: 1, hasMore: true });
    return get().fetchDocuments({ refresh: true });
  },

  setQuery: (query) => {
    set({ query, page: 1, hasMore: true });
    get().fetchDocuments({ reset: true });
  },

  setSort: (sort) => {
    set({ sort, page: 1, hasMore: true });
    get().fetchDocuments({ reset: true });
  },

  setFilter: (key, value) => {
    set((s) => ({ filters: { ...s.filters, [key]: value }, page: 1, hasMore: true }));
    get().fetchDocuments({ reset: true });
  },

  toggleFavorite: async (id, next) => {
    const before = get().documents;
    const target = before.find((d) => d.id === id);
    const value = next !== undefined ? next : !target?.isFavorite;

    set({ documents: before.map((d) => (d.id === id ? { ...d, isFavorite: value } : d)) });

    try {
      await documentService.updateMeta(id, { isFavorite: value });
      return { ok: true };
    } catch (e) {
      set({ documents: before });
      return { ok: false, message: e.message };
    }
  },

  openFolder: (folder) => {
    set((s) => ({
      currentFolder: folder,
      filters: { ...s.filters, folderId: folder?.id ?? null },
      page: 1,
      hasMore: true,
    }));
    get().fetchDocuments({ reset: true });
  },

  moveDocuments: async (ids, folderId) => {
    const before = get().documents;
    const viewing = get().filters.folderId;

    set({
      documents: folderId === viewing ? before : before.filter((d) => !ids.includes(d.id)),
    });

    try {
      await Promise.all(ids.map((id) => documentService.move(id, folderId)));
      return { ok: true };
    } catch (e) {
      set({ documents: before });
      return { ok: false, message: e.message };
    }
  },

  removeDocuments: async (ids) => {
    const before = get().documents;
    set({ documents: before.filter((d) => !ids.includes(d.id)) });

    try {
      await Promise.all(ids.map((id) => documentService.remove(id)));
      return { ok: true };
    } catch (e) {
      set({ documents: before, error: e.message });
      return { ok: false, message: e.message };
    }
  },

  removeDocument: async (id) => {
    const before = get().documents;
    set({ documents: before.filter((d) => d.id !== id) });
    try {
      await documentService.remove(id);
    } catch (e) {
      set({ documents: before, error: e.message });
    }
  },
}));