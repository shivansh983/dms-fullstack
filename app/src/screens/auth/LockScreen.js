import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { radius, spacing, font } from '../../styles/theme';

export default function LockScreen() {
  const { colors } = useTheme();
  const user   = useAuthStore((s) => s.user);
  const unlock = useAuthStore((s) => s.unlock);
  const logout = useAuthStore((s) => s.logout);

  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const attempt = async () => {
    setBusy(true);
    const ok = await unlock();
    setFailed(!ok);
    setBusy(false);
  };

  useEffect(() => { attempt(); }, []);

  return (
    <View style={[styles.wrap, { backgroundColor: colors.background }]}>
      <View style={[styles.badge, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name="finger-print" size={44} color={colors.primary} />
      </View>

      <Text style={{ ...font.h2, color: colors.text, marginTop: spacing.lg }}>
        {user?.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'App locked'}
      </Text>
      <Text style={{ ...font.body, color: colors.textMuted, textAlign: 'center', marginTop: spacing.xs }}>
        {failed
          ? 'Authentication failed or was cancelled.'
          : 'Unlock with your fingerprint or face to continue.'}
      </Text>

      <Button
        title="Unlock"
        onPress={attempt}
        loading={busy}
        style={{ marginTop: spacing.xl, minWidth: 200 }}
      />
      <Button
        title="Sign in as someone else"
        variant="outline"
        onPress={logout}
        style={{ marginTop: spacing.sm, minWidth: 200 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  badge: { width: 96, height: 96, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
