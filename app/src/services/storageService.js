import api from './api';
import { ENDPOINTS } from '../constants/endpoints';

export const storageService = {
  summary: async () => (await api.get(ENDPOINTS.storage)).data,
};
