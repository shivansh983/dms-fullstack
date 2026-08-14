import { Platform } from 'react-native';
import Constants from 'expo-constants';

const API_PORT = 8000;

function devHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ||
    Constants.expoGoConfig?.debuggerHost ||
    '';

  const host = hostUri.split(':')[0];

  if (host && host !== 'localhost' && host !== '127.0.0.1') return host;

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_BASE_URL = __DEV__
  ? `http://${devHost()}:${API_PORT}/api`
  : 'https://api.yourdomain.com/api';

export const PAGE_SIZE = 10;
export const REQUEST_TIMEOUT = 20000;
