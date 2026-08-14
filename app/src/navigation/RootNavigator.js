import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';

import { useAuthStore } from '../store/authStore';
import useTheme from '../hooks/useTheme';
import useNetworkStatus from '../hooks/useNetworkStatus';
import OfflineBanner from '../components/layout/OfflineBanner';
import AuthNavigator from './AuthNavigator';
import AppNavigator from './AppNavigator';
import LockScreen from '../screens/auth/LockScreen';
import CreatePasswordScreen from '../screens/auth/CreatePasswordScreen';

const linking = {
  prefixes: ['dmsapp://', 'exp+dms-app://'],
  config: {
    screens: {
      ResetPassword: 'reset-password',
      ForgotPassword: 'forgot-password',
    },
  },
};

export default function RootNavigator() {
  const { colors, isDark } = useTheme();
  const token     = useAuthStore((s) => s.token);
  const user      = useAuthStore((s) => s.user);
  const hydrating = useAuthStore((s) => s.hydrating);
  const locked    = useAuthStore((s) => s.locked);
  const restore   = useAuthStore((s) => s.restoreSession);

  useNetworkStatus();   

  useEffect(() => { restore(); }, [restore]);


  if (hydrating) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }


  if (token && locked) return <LockScreen />;

  if (token && user?.hasPassword === false) return <CreatePasswordScreen />;

  const navTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      background: colors.background,
      card: colors.surface,
      text: colors.text,
      border: colors.border,
      primary: colors.primary,
    },
  };

  return (
    <NavigationContainer theme={navTheme} linking={linking}>

      {token ? <AppNavigator /> : <AuthNavigator />}
      <OfflineBanner />

    </NavigationContainer>
  );
}
