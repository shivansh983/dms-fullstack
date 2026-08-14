import { create } from 'zustand';
import { notificationService } from '../services/notificationService';

export const useNotificationStore = create((set) => ({
  items: [],
  unreadCount: 0,
  loading: false,

  fetch: async () => {
    set({ loading: true });
    try {
      const data = await notificationService.list();
      set({
        items: data.items,
        unreadCount: data.items.filter((n) => !n.read).length,
        loading: false,
      });
    } catch {
      set({ loading: false });
    }
  },

  markRead: async (id) => {
    set((s) => ({
      items: s.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
      unreadCount: Math.max(0, s.unreadCount - 1),
    }));
    try { await notificationService.markRead(id); } catch {}
  },

  markAllRead: async () => {
    set((s) => ({ items: s.items.map((n) => ({ ...n, read: true })), unreadCount: 0 }));
    try { await notificationService.markAllRead(); } catch {}
  },
}));