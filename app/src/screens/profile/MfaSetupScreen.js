import { useEffect, useState } from 'react';
import { View, Text, Image, ScrollView, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { radius, spacing, font } from '../../styles/theme';

export default function MfaSetupScreen({ navigation }) {
  const { colors } = useTheme();

  const user = useAuthStore((s) => s.user);
  const setupMfa = useAuthStore((s) => s.setupMfa);
  const confirmMfa = useAuthStore((s) => s.confirmMfa);
  const disableMfa = useAuthStore((s) => s.disableMfa);

  const isEnabled = Boolean(user?.mfaEnabled);

  const [setup, setSetup] = useState(null);
  const [preparing, setPreparing] = useState(!isEnabled);
  const [code, setCode] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEnabled) return;

    let alive = true;

    setupMfa().then((res) => {
      if (!alive) return;
      if (res.ok) setSetup(res);
      else setError(res.message);
      setPreparing(false);
    });

    return () => {
      alive = false;
    };
  }, [isEnabled, setupMfa]);

  const onChange = (text) => {
    setCode(text.replace(/[^0-9]/g, '').slice(0, 6));
    if (error) setError(null);
  };

  const onSubmit = async () => {
    if (code.length !== 6) return setError('Enter the 6-digit code');

    setSubmitting(true);
    const res = isEnabled ? await disableMfa(code) : await confirmMfa(code);
    setSubmitting(false);

    if (!res.ok) {
      setCode('');
      return setError(res.message);
    }

    Alert.alert(
      isEnabled ? 'Two-step verification off' : 'Two-step verification on',
      isEnabled
        ? 'You will only need your password to sign in.'
        : 'You will need a code from your authenticator app each time you sign in.',
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        {isEnabled ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Text style={{ ...font.h3, color: colors.text }}>Turn off two-step verification</Text>
            <Text style={{ ...font.small, color: colors.textMuted, marginTop: spacing.xs }}>
              Enter a current code from your authenticator app to confirm it is you.
            </Text>
          </View>
        ) : (
          <View style={[styles.card, { backgroundColor: colors.surface, alignItems: 'center' }]}>
            {preparing ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.xl }} />
            ) : setup ? (
              <>
                <Text style={{ ...font.h3, color: colors.text, alignSelf: 'flex-start' }}>
                  Scan this code
                </Text>
                <Text
                  style={{
                    ...font.small,
                    color: colors.textMuted,
                    alignSelf: 'flex-start',
                    marginTop: spacing.xs,
                  }}
                >
                  Open Google Authenticator or Authy, add an account, and scan.
                </Text>

                <Image
                  source={{ uri: setup.qrDataUrl }}
                  style={styles.qr}
                  resizeMode="contain"
                  accessibilityLabel="Two-step verification QR code"
                />

                <Text style={{ ...font.small, color: colors.textMuted }}>
                  Cannot scan? Enter this key by hand:
                </Text>
                <Text selectable style={[styles.secret, { color: colors.text }]}>
                  {setup.secret}
                </Text>
              </>
            ) : (
              <Text style={{ ...font.body, color: colors.danger }}>{error}</Text>
            )}
          </View>
        )}

        {isEnabled || setup ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <Input
              label="Authentication code"
              value={code}
              onChangeText={onChange}
              error={error}
              placeholder="000000"
              keyboardType="number-pad"
              maxLength={6}
              style={styles.codeInput}
            />

            <Button
              title={isEnabled ? 'Turn off' : 'Confirm and enable'}
              variant={isEnabled ? 'danger' : 'primary'}
              onPress={onSubmit}
              loading={submitting}
              disabled={code.length !== 6}
            />
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  qr: { width: 200, height: 200, marginVertical: spacing.lg },
  secret: { ...font.label, letterSpacing: 2, marginTop: spacing.xs, textAlign: 'center' },
  codeInput: { letterSpacing: 8, textAlign: 'center' },
});
