import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function MfaScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const tempToken = route.params?.tempToken;

  const [code, setCode] = useState('');
  const [error, setError] = useState(null);

  const verifyMfa = useAuthStore((s) => s.verifyMfa);
  const loading = useAuthStore((s) => s.loading);

  const onChange = (text) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
    if (error) setError(null);
  };

  const onSubmit = async () => {
    if (code.length !== 6) return setError('Enter the 6-digit code');

    const res = await verifyMfa(tempToken, code);
    if (!res.ok) {
      setCode('');
      setError(res.message);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Two-step verification</Text>
        <Text style={styles.subtitle}>
          Open your authenticator app and enter the current 6-digit code.
        </Text>

        <Input
          label="Authentication code"
          value={code}
          onChangeText={onChange}
          error={error}
          placeholder="000000"
          keyboardType="number-pad"
          textContentType="oneTimeCode"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
          style={styles.codeInput}
        />

        <Button
          title="Verify"
          onPress={onSubmit}
          loading={loading}
          disabled={code.length !== 6}
          style={{ marginTop: spacing.sm }}
        />

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
  link: { marginTop: spacing.lg, alignItems: 'center' },
  codeInput: { letterSpacing: 8, textAlign: 'center' },
});
