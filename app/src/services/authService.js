import * as SecureStore from 'expo-secure-store';
import api from './api';
import { ENDPOINTS } from '../constants/endpoints';
import { testapi } from './testapi';

const USE_MOCK = false;

const REFRESH_KEY = 'dms.refreshToken';

export const authService = {
  login: (email, password) =>
    USE_MOCK ? testapi.login(email, password) : realLogin(email, password),
  register: (payload) =>
    USE_MOCK ? testapi.register(payload) : realRegister(payload),
  logout: () => (USE_MOCK ? testapi.logout() : realLogout()),
  profile: () => (USE_MOCK ? Promise.resolve({ user: null }) : realProfile()),
  loginWithGoogle: (idToken) =>
    USE_MOCK ? testapi.loginWithGoogle(idToken) : realGoogleSso(idToken),
  mfaSetup: () => realMfaSetup(),
  mfaConfirm: (code) => realMfaConfirm(code),
  mfaVerify: (tempToken, code) => realMfaVerify(tempToken, code),
  mfaDisable: (code) => realMfaDisable(code),
  forgotPassword: (email) => realForgotPassword(email),
  resetPassword: (token, newPassword) => realResetPassword(token, newPassword),
  setPassword: (newPassword) => realSetPassword(newPassword),
};

async function realSetPassword(newPassword) {
  const { data } = await api.post(ENDPOINTS.setPassword, { newPassword });
  return data;
}

async function realForgotPassword(email) {
  const { data } = await api.post(ENDPOINTS.forgotPassword, { email });
  return data;
}

async function realResetPassword(token, newPassword) {
  const { data } = await api.post(ENDPOINTS.resetPassword, { token, newPassword });
  return data;
}

async function realMfaSetup() {
  const { data } = await api.post(ENDPOINTS.mfaSetup);
  return data;
}

async function realMfaConfirm(code) {
  const { data } = await api.post(ENDPOINTS.mfaConfirm, { code });
  return data;
}

async function realMfaVerify(tempToken, code) {
  const { data } = await api.post(ENDPOINTS.mfaVerify, { tempToken, code });
  return data;
}

async function realMfaDisable(code) {
  const { data } = await api.post(ENDPOINTS.mfaDisable, { code });
  return data;
}

async function realLogin(email, password) {
  const { data } = await api.post(ENDPOINTS.login, { email, password });
  return data;
}

async function realGoogleSso(idToken) {
  const { data } = await api.post(ENDPOINTS.googleSso, { idToken });
  return data;
}

async function realRegister(payload) {
  const { data } = await api.post(ENDPOINTS.register, payload);
  return data;
}

async function realLogout() {
  const refreshToken = await SecureStore.getItemAsync(REFRESH_KEY);
  try {
    const { data } = await api.post(ENDPOINTS.logout, { refreshToken });
    return data;
  } catch {
    return { ok: true };
  }
}

async function realProfile() {
  const { data } = await api.get(ENDPOINTS.profile);
  return data;
}
