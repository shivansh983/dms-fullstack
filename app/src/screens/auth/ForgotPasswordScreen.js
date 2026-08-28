import { useState } from 'react';
import {
  Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function ForgotPasswordScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [email, setEmail] = useState('');
  const [error, setError] = useState(null);
  const [sent, setSent] = useState(null);

  const forgotPassword = useAuthStore((s) => s.forgotPassword);
  const loading = useAuthStore((s) => s.loading);

  const onChange = (text) => {
    setEmail(text);
    if (error) setError(null);
  };

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed || !trimmed.includes('@')) {
      return setError('Enter a valid email address');
    }

    const res = await forgotPassword(trimmed);
    if (!res.ok) return setError(res.message);

    setSent(res.message);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Forgot password</Text>
        <Text style={styles.subtitle}>
          Enter your email and we'll send you a link to reset your password.
        </Text>

        {sent ? (
          <>
            <Text style={styles.success}>{sent}</Text>
            <Text style={styles.hint}>
              Open the email and tap "Reset my password". The link brings you back
              into the app with everything filled in.
            </Text>
          </>
        ) : (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={onChange}
              error={error}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              autoFocus
            />

            <Button
              title="Send reset link"
              onPress={onSubmit}
              loading={loading}
              disabled={!email.trim()}
              style={{ marginTop: spacing.sm }}
            />
          </>
        )}

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={{ color: colors.textMuted, ...font.body }}>Back to sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...font.h1, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted, marginBottom: spacing.xl },
  success: { ...font.body, color: colors.text, marginBottom: spacing.sm },
  hint: { ...font.small, color: colors.textMuted, marginBottom: spacing.md },
  link: { marginTop: spacing.lg, alignItems: 'center' },
});
