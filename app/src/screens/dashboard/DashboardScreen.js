import { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import DocumentCard from '../../components/documents/DocumentCard';
import { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { useAuthStore } from '../../store/authStore';
import { useNotificationStore } from '../../store/notificationStore';
import { useDocumentStore } from '../../store/documentStore';
import { documentService } from '../../services/documentService';
import { formatSize } from '../../utils/formatters';
import { DOC_STATUS } from '../../constants/enums';
import { radius, spacing, font } from '../../styles/theme';

export default function DashboardScreen({ navigation }) {
  const { colors } = useTheme();
  const user = useAuthStore((s) => s.user);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const fetchNotifications = useNotificationStore((s) => s.fetch);
  const toggleFavorite = useDocumentStore((s) => s.toggleFavorite);
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const selectionMode = selectedIds.length > 0;

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const onLongPress = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((id_) => id_ !== id) : [...prev, id]
    );
  }, []);

  const handlePress = useCallback((id) => {
    if (selectionMode) {
      onLongPress(id);
    } else {
      navigation.navigate('Preview', { id });
    }
  }, [selectionMode, onLongPress, navigation]);

  const load = useCallback(async (isRefresh = false) => {
    isRefresh ? setRefreshing(true) : setLoading(true);
    setError(null);
    try {
      const [s, list] = await Promise.all([
        documentService.stats(),
        documentService.list({ page: 1, limit: 5, sort: 'createdAt:desc' }),
      ]);
      setStats(s);
      setRecent(list.items);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => {
    load();
    fetchNotifications();
  }, [load, fetchNotifications]));

  const firstName = user?.name?.split(' ')[0] || 'there';

  const goToDocuments = (status) =>
    navigation.navigate('Documents', { status: status ?? null });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView
        contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />
        }
      >
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={{ ...font.small, color: colors.textMuted }}>Welcome back</Text>
            <Text style={{ ...font.h1, color: colors.text }}>{firstName}</Text>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate('Alerts')} hitSlop={10}>
            <Ionicons name="notifications-outline" size={24} color={colors.text} />
            {unreadCount > 0 ? (
              <View style={[styles.dot, { backgroundColor: colors.danger, borderColor: colors.background }]}>
                <Text style={styles.dotText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
              </View>
            ) : null}
          </TouchableOpacity>
        </View>

        {error ? (
          <EmptyState
            icon="cloud-offline-outline"
            title="Couldn't load dashboard"
            message={error}
            actionLabel="Try again"
            onAction={() => load()}
          />
        ) : (
          <>
            <View style={styles.statRow}>
              <Stat
                label="Total"
                value={loading ? '-' : stats.total}
                icon="documents"
                colors={colors}
                onPress={() => goToDocuments(null)}
              />
              <Stat
                label="Pending"
                value={loading ? '-' : stats.pending}
                icon="hourglass"
                tone={colors.warning}
                colors={colors}
                onPress={() => goToDocuments(DOC_STATUS.PENDING)}
              />
            </View>

            <View style={styles.statRow}>
              <Stat
                label="Approved"
                value={loading ? '-' : stats.approved}
                icon="checkmark-circle"
                tone={colors.success}
                colors={colors}
                onPress={() => goToDocuments(DOC_STATUS.APPROVED)}
              />
              <Stat
                label="Storage"
                value={loading ? '-' : formatSize(stats.storageBytes)}
                icon="server"
                colors={colors}
              />
            </View>

            <Text style={{ ...font.h3, color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm }}>
              Quick actions
            </Text>
            <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.lg }}>
              <Action icon="cloud-upload" label="Upload" colors={colors}
                onPress={() => navigation.navigate('Upload')} />
              <Action icon="search" label="Search" colors={colors}
                onPress={() => navigation.navigate('Search')} />
              <Action icon="qr-code" label="Scan QR" colors={colors}
                onPress={() => navigation.navigate('ScanQR')} />
              <Action icon="folder" label="Folders" colors={colors}
                onPress={() => navigation.navigate('Folders')} />
            </View>

            <View style={styles.sectionHeader}>
              <Text style={{ ...font.h3, color: colors.text }}>Recent documents</Text>
              <TouchableOpacity onPress={() => goToDocuments(null)} hitSlop={10}>
                <Text style={{ ...font.small, color: colors.primary }}>See all</Text>
              </TouchableOpacity>
            </View>
            {loading ? (
              <SkeletonList count={4} />
            ) : recent.length === 0 ? (
              <EmptyState
                title="Nothing here yet"
                message="Upload your first document to get started."
                actionLabel="Upload"
                onAction={() => navigation.navigate('Upload')}
              />
            ) : (
              recent.map((doc) => {
                const isSelected = selectedIds.includes(doc.id);
                return (
                  <DocumentCard
                    key={doc.id}
                    document={doc}
                    tag={doc.tag}
                    onToggleFavorite={async () => {
                      const next = !doc.isFavorite;
                      const apply = (value) =>
                        setRecent((prevList) =>
                          prevList.map((item) =>
                            item.id === doc.id ? { ...item, isFavorite: value } : item
                          )
                        );
                      apply(next);
                      const res = await toggleFavorite(doc.id, next);
                      if (!res.ok) apply(!next);
                    }}
                    selectionMode={selectionMode}
                    selected={isSelected}
                    onPress={() => handlePress(doc.id)}
                    onLongPress={() => onLongPress(doc.id)}
                    onPreview={() => navigation.navigate('Preview', { id: doc.id })}
                    onDownload={() => {
                      console.log('Download clicked for:', doc.name);
                    }}
                  />
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Stat({ label, value, icon, tone, colors, onPress }) {
  const color = tone || colors.primary;
  return (
    <TouchableOpacity
      activeOpacity={onPress ? 0.8 : 1}
      onPress={onPress}
      style={[styles.stat, { backgroundColor: colors.surface }]}
    >
      <Ionicons name={icon} size={20} color={color} />
      <Text style={{ ...font.h2, color: colors.text, marginTop: spacing.xs }}>{value}</Text>
      <Text style={{ ...font.small, color: colors.textMuted }}>{label}</Text>
    </TouchableOpacity>
  );
}

function Action({ icon, label, onPress, colors }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.action, { backgroundColor: colors.surface }]}
      activeOpacity={0.8}
    >
      <Ionicons name={icon} size={22} color={colors.primary} />
      <Text style={{ ...font.small, color: colors.text }} numberOfLines={1}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  dot: {
    position: 'absolute', top: -4, right: -6, minWidth: 18, height: 18, borderRadius: radius.full,
    borderWidth: 2, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3,
  },
  dotText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  stat: { flex: 1, padding: spacing.md, borderRadius: radius.lg },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', marginBottom: spacing.sm,
  },
  action: {
    flex: 1, alignItems: 'center', gap: spacing.xs,
    paddingVertical: spacing.md, borderRadius: radius.lg,
  },
});
