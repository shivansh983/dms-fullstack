import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { authService } from '../services/authService';
import { biometrics } from '../services/biometrics';

const ACCESS_KEY  = 'dms.accessToken';
const USER_KEY    = 'dms.user';
const REFRESH_KEY = 'dms.refreshToken';

async function persistSession({ user, accessToken, refreshToken }) {
  await AsyncStorage.multiSet([
    [ACCESS_KEY, accessToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
  await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);
}

export const useAuthStore = create((set, get) => ({
  user: null,
  token: null,
  hydrating: true,
  loading: false,
  error: null,
  locked: false,

  restoreSession: async () => {
    try {
      const [token, rawUser, bioEnabled] = await Promise.all([
        AsyncStorage.getItem(ACCESS_KEY),
        AsyncStorage.getItem(USER_KEY),
        biometrics.isEnabled(),
      ]);
      set({
        token: token || null,
        user: rawUser ? JSON.parse(rawUser) : null,

        locked: Boolean(token) && bioEnabled,
        hydrating: false,
      });
    } catch {
      set({ hydrating: false });
    }
  },

  unlock: async () => {
    const ok = await biometrics.authenticate();
    if (ok) set({ locked: false });
    return ok;
  },

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.login(email, password);

      if (data.mfaRequired) {
        set({ loading: false });
        return { ok: true, mfaRequired: true, tempToken: data.tempToken };
      }

      await persistSession(data);

      set({ user: data.user, token: data.accessToken, loading: false, locked: false });
      return { ok: true };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  verifyMfa: async (tempToken, code) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.mfaVerify(tempToken, code);

      await persistSession(data);

      set({ user: data.user, token: data.accessToken, loading: false, locked: false });
      return { ok: true };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  register: async (payload) => {
    set({ loading: true, error: null });
    try {
      await authService.register(payload);
      set({ loading: false });
      return { ok: true };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  refreshProfile: async () => {
    try {
      const { user } = await authService.profile();
      if (!user) return;
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
      set({ user });
    } catch {}
  },

  logout: async () => {
    try { await authService.logout(); } catch {}
    try {
      if (GoogleSignin.hasPreviousSignIn()) await GoogleSignin.signOut();
    } catch {}
    await AsyncStorage.multiRemove([ACCESS_KEY, USER_KEY]);
    await SecureStore.deleteItemAsync(REFRESH_KEY);
    set({ user: null, token: null, error: null, locked: false });
  },

  isAdmin: () => get().user?.role === 'admin',

  loginWithGoogle: async (idToken) => {
    set({ error: null });
    try {
      const data = await authService.loginWithGoogle(idToken);

      if (data.mfaRequired) {
        return { ok: true, mfaRequired: true, tempToken: data.tempToken };
      }

      await persistSession(data);

      set({ user: data.user, token: data.accessToken, locked: false });
      return { ok: true };
    } catch (e) {
      set({ error: e.message });
      return { ok: false, message: e.message };
    }
  },

  setPassword: async (newPassword) => {
    set({ loading: true, error: null });
    try {
      await authService.setPassword(newPassword);

      const user = { ...get().user, hasPassword: true };
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));

      set({ user, loading: false });
      return { ok: true };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  forgotPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.forgotPassword(email);
      set({ loading: false });
      return { ok: true, message: data.message };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  resetPassword: async (token, newPassword) => {
    set({ loading: true, error: null });
    try {
      const data = await authService.resetPassword(token, newPassword);
      set({ loading: false });
      return { ok: true, message: data.message };
    } catch (e) {
      set({ error: e.message, loading: false });
      return { ok: false, message: e.message };
    }
  },

  setupMfa: async () => {
    try {
      return { ok: true, ...(await authService.mfaSetup()) };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },

  confirmMfa: async (code) => {
    try {
      await authService.mfaConfirm(code);
      await get().refreshProfile();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },

  disableMfa: async (code) => {
    try {
      await authService.mfaDisable(code);
      await get().refreshProfile();
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.message };
    }
  },
}));