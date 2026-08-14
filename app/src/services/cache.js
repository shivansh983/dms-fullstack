import AsyncStorage from '@react-native-async-storage/async-storage';

const TTL = 1000 * 60 * 30;   

export const cache = {
  set: async (key, data) =>
    AsyncStorage.setItem(`cache.${key}`, JSON.stringify({ data, savedAt: Date.now() })),

  get: async (key, { ignoreTtl = false } = {}) => {
    const raw = await AsyncStorage.getItem(`cache.${key}`);
    if (!raw) return null;
    const { data, savedAt } = JSON.parse(raw);
    if (!ignoreTtl && Date.now() - savedAt > TTL) return null;
    return data;
  },

  clear: async () => {
    const keys = await AsyncStorage.getAllKeys();
    await AsyncStorage.multiRemove(keys.filter((k) => k.startsWith('cache.')));
  },
};