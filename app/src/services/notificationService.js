import api from './api';
import { testapi } from './testapi';
import { ENDPOINTS } from '../constants/endpoints';

const USE_MOCK = false;

export const notificationService = {
  list: async () => {
    if (USE_MOCK) return testapi.notifications.list();
    return (await api.get(ENDPOINTS.notifications)).data;
  },

  markRead: async (id) => {
    if (USE_MOCK) return testapi.notifications.markRead(id);
    return (await api.put(`${ENDPOINTS.notifications}/${id}/read`)).data;
  },

  markAllRead: async () => {
    if (USE_MOCK) return testapi.notifications.markAllRead();
    return (await api.put(`${ENDPOINTS.notifications}/read-all`)).data;
  },
};
