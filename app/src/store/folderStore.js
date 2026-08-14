import { create } from 'zustand';
import { folderService } from '../services/folderService';

export const useFolderStore = create((set, get) => ({
  folders: [],
  loading: false,
  error: null,

  fetchFolders: async () => {
    set({ loading: true, error: null });
    try {
      set({ folders: await folderService.list(), loading: false });
    } catch (e) {
      set({ error: e.message, loading: false });
    }
  },

  createFolder: async (name) => {
    const temp = { id: `tmp-${Date.now()}`, name, documentCount: 0, _pending: true };
    set((s) => ({ folders: [temp, ...s.folders] }));

    try {
      const real = await folderService.create({ name });
      set((s) => ({ folders: s.folders.map((f) => (f.id === temp.id ? real : f)) }));
      return { ok: true };
    } catch (e) {
      set((s) => ({ folders: s.folders.filter((f) => f.id !== temp.id) }));
      return { ok: false, message: e.message };
    }
  },

  renameFolder: async (id, name) => {
    const before = get().folders;
    set({ folders: before.map((f) => (f.id === id ? { ...f, name } : f)) });
    try { await folderService.rename(id, name); }
    catch { set({ folders: before }); }
  },

  deleteFolder: async (id) => {
    const before = get().folders;
    set({ folders: before.filter((f) => f.id !== id) });
    try { await folderService.remove(id); }
    catch (e) { set({ folders: before, error: e.message }); }
  },
}));