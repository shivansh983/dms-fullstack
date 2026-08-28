import { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Switch, Alert
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import { validateLogin } from '../../utils/validator';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

import { GoogleSignin, GoogleSigninButton, statusCodes } from '@react-native-google-signin/google-signin';


export default function LoginScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = makeStyles(colors);

  const [values, setValues] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({});

  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const googleInFlight = useRef(false);
  const loginWithGoogle = useAuthStore((s) => s.loginWithGoogle);

  const login = useAuthStore((s) => s.login);
  const loading = useAuthStore((s) => s.loading);

  const onChange = (key) => (text) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async () => {
    const { errors: errs, isValid } = validateLogin(values);
    setErrors(errs);
    if (!isValid) return;

    const res = await login(values.email.trim(), values.password);
    if (!res.ok) return setErrors({ form: res.message });

    if (res.mfaRequired) navigation.navigate('Mfa', { tempToken: res.tempToken });
  };

  const handleGoogleSignIn = async () => {
    if (googleInFlight.current) return;
    googleInFlight.current = true;

    try {
      setIsGoogleLoading(true);
      await GoogleSignin.hasPlayServices();
      
      const userInfo = await GoogleSignin.signIn();
      if (userInfo.type === 'cancelled') return;

      const idToken = userInfo.idToken || userInfo.data?.idToken;

      if (!idToken) throw new Error('Failed to retrieve ID token from Google');

      const res = await loginWithGoogle(idToken);
      if (!res.ok) return setErrors({ form: res.message });

      if (res.mfaRequired) navigation.navigate('Mfa', { tempToken: res.tempToken });

    } catch (error) {
      if (error.code === statusCodes.SIGN_IN_CANCELLED) {
        console.log('User closed the Google popup');
      } else if (
        error.code === statusCodes.IN_PROGRESS ||
        String(error.code) === '12502'
      ) {
        try { await GoogleSignin.signOut(); } catch {}
        Alert.alert(
          'Sign-in already running',
          'A previous Google sign-in never finished. It has been cleared - please tap the button again.'
        );
      } else if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
        Alert.alert(
          'Google Play Services',
          'Update or enable Google Play Services on this device to sign in with Google.'
        );
      } else if (String(error.code) === '10') {
        Alert.alert(
          'Google sign-in not configured',
          'This build is not registered with Google. Add an Android OAuth client for this package name and signing certificate in Google Cloud Console, then try again.'
        );
        console.error(error);
      } else {
        Alert.alert('Login Failed', error.message || 'Could not sign in with Google.');
        console.error(error);
      }
    } finally {
      googleInFlight.current = false;
      setIsGoogleLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.toggleContainer}>
        <Text style={[styles.toggleLabel, { color: colors.text }]}>
          {isDark ? 'Dark' : 'Light'}
        </Text>
        <Switch
          value={isDark}
          onValueChange={toggleTheme}
          trackColor={{ false: colors.textMuted, true: colors.primary }}
          thumbColor="#ffffff"
        />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Document Manager</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        <Input
          label="Email"
          value={values.email}
          onChangeText={onChange('email')}
          error={errors.email}
          placeholder="Email"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          value={values.password}
          onChangeText={onChange('password')}
          error={errors.password}
          placeholder="Password"
          secureTextEntry
        />

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Button title="Sign In" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

        <TouchableOpacity
          onPress={() => navigation.navigate('ForgotPassword')}
          style={styles.forgotLink}
        >
          <Text style={{ color: colors.primary, ...font.body }}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.dividerContainer}>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.textMuted }]}>OR</Text>
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
        </View>

        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={isDark ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
          onPress={handleGoogleSignIn}
          disabled={isGoogleLoading}
          style={styles.googleButton}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Register')} style={styles.link}>
          <Text style={{ color: colors.textMuted, ...font.body }}>
            Don't have an account? <Text style={{ color: colors.primary }}>Register</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  toggleContainer: { 
    position: 'absolute', 
    top: Platform.OS === 'ios' ? 50 : 20, 
    right: 20, 
    zIndex: 1, 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 8 
  },
  toggleLabel: { ...font.small },
  title: { ...font.h1, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted, marginBottom: spacing.xl },
  formError: { ...font.small, color: colors.danger, marginTop: spacing.xs },
  link: { marginTop: spacing.lg, alignItems: 'center' },
  forgotLink: { marginTop: spacing.md, alignItems: 'center' },

  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    ...font.small,
  },
  googleButton: {
    width: '100%',
    height: 48,
  },

});