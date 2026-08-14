import api from './api';
import { testapi } from './testapi';
import { ENDPOINTS } from '../constants/endpoints';

const USE_MOCK = false;

export const folderService = {
  list: async () => {
    if (USE_MOCK) return testapi.folders.list();
    return (await api.get(ENDPOINTS.folders)).data;
  },

  create: async ({ name }) => {
    if (USE_MOCK) return testapi.folders.create({ name });
    return (await api.post(ENDPOINTS.folders, { name })).data;
  },

  rename: async (id, name) => {
    if (USE_MOCK) return testapi.folders.rename(id, name);
    return (await api.put(ENDPOINTS.folderById(id), { name })).data;
  },

  remove: async (id) => {
    if (USE_MOCK) return testapi.folders.remove(id);
    return (await api.delete(ENDPOINTS.folderById(id))).data;
  },
};
