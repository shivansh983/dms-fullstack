import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';

const ENABLED_KEY = 'dms.biometricEnabled';

export const biometrics = {

  isAvailable: async () => {
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    return hasHardware && isEnrolled;
  },

  isEnabled: async () => (await AsyncStorage.getItem(ENABLED_KEY)) === 'true',

  setEnabled: (value) =>
    value
      ? AsyncStorage.setItem(ENABLED_KEY, 'true')
      : AsyncStorage.removeItem(ENABLED_KEY),

  authenticate: async () => {
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Document Manager',
      fallbackLabel: 'Use passcode',
      cancelLabel: 'Cancel',
    });
    return result.success;
  },
};
