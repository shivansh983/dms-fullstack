import { useEffect, useState } from 'react';
import { View, Text, Switch, TouchableOpacity, ScrollView, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import useNetworkStatus from '../../hooks/useNetworkStatus';
import { useAuthStore } from '../../store/authStore';
import { cache } from '../../services/cache';
import { biometrics } from '../../services/biometrics';
import { storageService } from '../../services/storageService';
import { formatSize } from '../../utils/formatters';
import { radius, spacing, font } from '../../styles/theme';

export default function ProfileScreen({ navigation }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const isOffline = useNetworkStatus();

  const user   = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const refreshProfile = useAuthStore((s) => s.refreshProfile);

  const [bioAvailable, setBioAvailable] = useState(false);
  const [bioEnabled, setBioEnabled] = useState(false);
  const [storage, setStorage] = useState(null);
  const [storageError, setStorageError] = useState(null);

  useEffect(() => {
    (async () => {
      setBioAvailable(await biometrics.isAvailable());
      setBioEnabled(await biometrics.isEnabled());
    })();
  }, []);

  useEffect(() => {
    let alive = true;

    storageService
      .summary()
      .then((data) => alive && setStorage(data))
      .catch((e) => alive && setStorageError(e.message));

    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => { refreshProfile(); }, [refreshProfile]);

  const onToggleBiometrics = async (next) => {

    if (next && !(await biometrics.authenticate())) {
      return Alert.alert('Not enabled', 'Biometric check failed, so nothing was changed.');
    }
    await biometrics.setEnabled(next);
    setBioEnabled(next);
  };

  const initials = (user?.name || '?')
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const onClearCache = () => {
    Alert.alert('Clear offline cache', 'Cached documents will be re-downloaded next time you open them.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: async () => {
          await cache.clear();
          Alert.alert('Cache cleared');
        },
      },
    ]);
  };

  const onLogout = () => {
    Alert.alert('Sign out', 'You will need to sign in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}>
        <Text style={{ ...font.h1, color: colors.text, marginBottom: spacing.lg }}>Profile</Text>

        <View style={[styles.card, { backgroundColor: colors.surface, alignItems: 'center' }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={{ ...font.h2, color: colors.onPrimary }}>{initials}</Text>
          </View>
          <Text style={{ ...font.h3, color: colors.text, marginTop: spacing.sm }}>{user?.name}</Text>
          <Text style={{ ...font.small, color: colors.textMuted }}>{user?.email}</Text>

          <View style={[styles.rolePill, { backgroundColor: colors.primarySoft, marginTop: spacing.sm }]}>
            <Text style={{ ...font.small, color: colors.primary, fontWeight: '600' }}>
              {user?.role === 'admin' ? 'Administrator' : 'Standard user'}
            </Text>
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={[styles.rowLeft, { marginBottom: spacing.sm }]}>
            <Ionicons name="cloud-outline" size={20} color={colors.textMuted} />
            <Text style={{ ...font.label, color: colors.text }}>Storage</Text>
          </View>

          {storage ? (
            <>
              <View
                style={[styles.meterTrack, { backgroundColor: colors.border }]}
                accessibilityRole="progressbar"
                accessibilityLabel={`${storage.percentUsed}% of storage used`}
              >
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${Math.max(storage.percentUsed, 2)}%`,
                      backgroundColor:
                        storage.percentUsed >= 90
                          ? colors.danger
                          : storage.percentUsed >= 75
                            ? colors.warning
                            : colors.primary,
                    },
                  ]}
                />
              </View>

              <Text style={{ ...font.body, color: colors.text, marginTop: spacing.sm }}>
                {formatSize(storage.remainingBytes)} left
              </Text>
              <Text style={{ ...font.small, color: colors.textMuted, marginTop: 2 }}>
                {formatSize(storage.usedBytes)} of {formatSize(storage.quotaBytes)} used
                {storage.reservedBytes > 0
                  ? ` · ${formatSize(storage.reservedBytes)} uploading`
                  : ''}
              </Text>

              <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.sm }]} />

              <View style={styles.row}>
                <Text style={{ ...font.small, color: colors.textMuted }}>Largest file you can upload</Text>
                <Text style={{ ...font.label, color: colors.text }}>
                  {formatSize(storage.maxUploadableBytes)}
                </Text>
              </View>

              <View style={styles.row}>
                <Text style={{ ...font.small, color: colors.textMuted }}>Free space on server</Text>
                <Text style={{ ...font.small, color: colors.textMuted }}>
                  {storage.diskFreeBytes === null ? 'unknown' : formatSize(storage.diskFreeBytes)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={{ ...font.small, color: storageError ? colors.danger : colors.textMuted }}>
              {storageError || 'Checking available space...'}
            </Text>
          )}
        </View>

        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons name={isDark ? 'moon' : 'sunny'} size={20} color={colors.textMuted} />
              <Text style={{ ...font.body, color: colors.text }}>Dark mode</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#ffffff"
            />
          </View>

          {bioAvailable ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <View style={styles.rowLeft}>
                  <Ionicons name="finger-print" size={20} color={colors.textMuted} />
                  <View>
                    <Text style={{ ...font.body, color: colors.text }}>Biometric lock</Text>
                    <Text style={{ ...font.small, color: colors.textMuted }}>
                      Require fingerprint on app open
                    </Text>
                  </View>
                </View>
                <Switch
                  value={bioEnabled}
                  onValueChange={onToggleBiometrics}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor="#ffffff"
                />
              </View>
            </>
          ) : null}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <Ionicons
                name={isOffline ? 'cloud-offline' : 'cloud-done'}
                size={20}
                color={isOffline ? colors.warning : colors.success}
              />
              <Text style={{ ...font.body, color: colors.text }}>Connection</Text>
            </View>
            <Text style={{ ...font.small, color: isOffline ? colors.warning : colors.success }}>
              {isOffline ? 'Offline' : 'Online'}
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('MfaSetup')}>
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.textMuted} />
              <View>
                <Text style={{ ...font.body, color: colors.text }}>Two-step verification</Text>
                <Text style={{ ...font.small, color: colors.textMuted }}>
                  {user?.mfaEnabled ? 'On' : 'Off'} · code from your authenticator app
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Folders')}>
            <View style={styles.rowLeft}>
              <Ionicons name="folder-outline" size={20} color={colors.textMuted} />
              <Text style={{ ...font.body, color: colors.text }}>Manage folders</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <TouchableOpacity style={styles.row} onPress={onClearCache}>
            <View style={styles.rowLeft}>
              <Ionicons name="trash-outline" size={20} color={colors.textMuted} />
              <Text style={{ ...font.body, color: colors.text }}>Clear offline cache</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>

        <Button title="Sign Out" variant="danger" onPress={onLogout} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  avatar: { width: 72, height: 72, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
  rolePill: { paddingHorizontal: spacing.md, paddingVertical: 4, borderRadius: radius.full },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  divider: { height: 1 },
  meterTrack: { height: 8, borderRadius: radius.full, overflow: 'hidden' },
  meterFill: { height: 8, borderRadius: radius.full },
});
