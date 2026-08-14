import { useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { useNotificationStore } from '../../store/notificationStore';
import { relativeDate } from '../../utils/formatters';
import { radius, spacing, font } from '../../styles/theme';

const ICONS = {
  approval: 'checkmark-circle',
  ocr: 'scan',
  expiry: 'time',
};

export default function NotificationsScreen() {
  const { colors } = useTheme();

  const items       = useNotificationStore((s) => s.items);
  const loading     = useNotificationStore((s) => s.loading);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetch       = useNotificationStore((s) => s.fetch);
  const markRead    = useNotificationStore((s) => s.markRead);
  const markAllRead = useNotificationStore((s) => s.markAllRead);

  useEffect(() => { fetch(); }, [fetch]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        <Text style={{ ...font.h1, color: colors.text }}>Notifications</Text>
        {unreadCount > 0 ? (
          <TouchableOpacity onPress={markAllRead} hitSlop={10}>
            <Text style={{ ...font.small, color: colors.primary }}>Mark all read</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <FlatList
        data={items}
        keyExtractor={(n) => n.id}
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
        refreshing={loading}
        onRefresh={fetch}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => !item.read && markRead(item.id)}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderLeftColor: item.read ? 'transparent' : colors.primary,
              },
            ]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name={ICONS[item.type] || 'notifications'} size={18} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{ ...font.label, color: colors.text, fontWeight: item.read ? '500' : '700' }}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={{ ...font.small, color: colors.textMuted }} numberOfLines={2}>
                {item.body}
              </Text>
              <Text style={{ ...font.small, color: colors.textMuted, marginTop: 2 }}>
                {relativeDate(item.createdAt)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="notifications-off-outline"
              title="You're all caught up"
              message="Approvals and OCR updates will show up here."
            />
          )
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
  card: {
    flexDirection: 'row', gap: spacing.md, padding: spacing.md,
    borderRadius: radius.lg, marginBottom: spacing.sm, borderLeftWidth: 3,
  },
  icon: { width: 36, height: 36, borderRadius: radius.full, alignItems: 'center', justifyContent: 'center' },
});
