import { useEffect, useCallback, useRef, useState } from 'react';
import {
  View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity,
  Alert, BackHandler, StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useDocumentStore } from '../../store/documentStore';
import { useFolderStore } from '../../store/folderStore';
import DocumentCard from '../../components/documents/DocumentCard';
import FolderPickerModal from '../../components/folders/FolderPickerModal';
import { SkeletonList } from '../../components/ui/Skeleton';
import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { SORT_OPTIONS } from '../../constants/enums';
import { radius, spacing, font } from '../../styles/theme';

export default function DocumentsScreen({ navigation, route }) {
  const { colors } = useTheme();

  const documents     = useDocumentStore((s) => s.documents);
  const loading       = useDocumentStore((s) => s.loading);
  const refreshing    = useDocumentStore((s) => s.refreshing);
  const loadingMore   = useDocumentStore((s) => s.loadingMore);
  const error         = useDocumentStore((s) => s.error);
  const fromCache     = useDocumentStore((s) => s.fromCache);
  const sort          = useDocumentStore((s) => s.sort);
  const filters       = useDocumentStore((s) => s.filters);
  const currentFolder = useDocumentStore((s) => s.currentFolder);
  const fetchDocs     = useDocumentStore((s) => s.fetchDocuments);
  const loadMore      = useDocumentStore((s) => s.loadMore);
  const refresh       = useDocumentStore((s) => s.refresh);
  const setSort       = useDocumentStore((s) => s.setSort);
  const setFilter     = useDocumentStore((s) => s.setFilter);
  const toggleFav     = useDocumentStore((s) => s.toggleFavorite);
  const openFolder    = useDocumentStore((s) => s.openFolder);
  const moveDocuments = useDocumentStore((s) => s.moveDocuments);
  const removeDocs    = useDocumentStore((s) => s.removeDocuments);

  const folders      = useFolderStore((s) => s.folders);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);

  const statusParam = route.params?.status;
  const firstRun = useRef(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const [picking, setPicking] = useState(false);
  const isSelectionMode = selectedIds.length > 0;
  const atRoot = !currentFolder;

  const onLongPress = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const handlePress = useCallback((id) => {
    if (isSelectionMode) onLongPress(id);
    else navigation.navigate('Preview', { id });
  }, [isSelectionMode, onLongPress, navigation]);

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  useEffect(() => {
    if (firstRun.current) {
      firstRun.current = false;
      statusParam !== undefined ? setFilter('status', statusParam) : fetchDocs({ reset: true });
      return;
    }
    if (statusParam !== undefined) setFilter('status', statusParam);
  }, [statusParam]);

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (isSelectionMode) { clearSelection(); return true; }
        if (currentFolder) { openFolder(null); return true; }
        return false;
      });
      return () => sub.remove();
    }, [isSelectionMode, currentFolder, clearSelection, openFolder])
  );

  const onMove = async (folderId) => {
    const ids = selectedIds;
    setPicking(false);
    clearSelection();

    const res = await moveDocuments(ids, folderId);
    if (!res.ok) return Alert.alert('Could not move', res.message);
    fetchFolders();
  };

  const confirmDelete = () => {
    const ids = selectedIds;
    const label = ids.length === 1 ? 'this document' : `${ids.length} documents`;

    Alert.alert('Delete documents', `Permanently delete ${label}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          clearSelection();
          const res = await removeDocs(ids);
          if (!res.ok) Alert.alert('Could not delete', res.message);
          fetchFolders();
        },
      },
    ]);
  };

  const renderItem = useCallback(
    ({ item }) => (
      <DocumentCard
        document={item}
        selectionMode={isSelectionMode}
        selected={selectedIds.includes(item.id)}
        onPress={() => handlePress(item.id)}
        onLongPress={() => onLongPress(item.id)}
        onToggleFavorite={() => toggleFav(item.id)}
      />
    ),
    [toggleFav, selectedIds, isSelectionMode, handlePress, onLongPress]
  );

  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex((o) => o.key === sort);
    setSort(SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].key);
  };

  const visibleFolders = folders.filter((f) => !f._pending);

  const listHeader = atRoot && visibleFolders.length > 0 && !isSelectionMode ? (
    <View style={{ marginBottom: spacing.md }}>
      <View style={styles.sectionRow}>
        <Text style={{ ...font.small, color: colors.textMuted, letterSpacing: 1 }}>FOLDERS</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Folders')} hitSlop={8}>
          <Text style={{ ...font.small, color: colors.primary }}>Manage</Text>
        </TouchableOpacity>
      </View>

      {visibleFolders.map((f) => (
        <TouchableOpacity
          key={f.id}
          onPress={() => openFolder(f)}
          activeOpacity={0.8}
          style={[styles.folderRow, { backgroundColor: colors.surface }]}
        >
          <View style={[styles.folderIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name="folder" size={18} color={colors.primary} />
          </View>
          <Text style={{ ...font.label, fontSize: 15, color: colors.text, flex: 1 }} numberOfLines={1}>
            {f.name}
          </Text>
          <Text style={{ ...font.small, color: colors.textMuted }}>{f.documentCount ?? 0}</Text>
          <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      ))}

      <Text style={{ ...font.small, color: colors.textMuted, letterSpacing: 1, marginTop: spacing.lg }}>
        DOCUMENTS
      </Text>
    </View>
  ) : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={clearSelection} hitSlop={10}>
              <Ionicons name="close" size={22} color={colors.text} />
            </TouchableOpacity>
            <Text style={{ ...font.h1, color: colors.text }}>{selectedIds.length} Selected</Text>
            <View style={{ width: 22 }} />
          </>
        ) : (
          <>
            <View style={styles.titleRow}>
              {currentFolder ? (
                <TouchableOpacity onPress={() => openFolder(null)} hitSlop={10}>
                  <Ionicons name="arrow-back" size={22} color={colors.text} />
                </TouchableOpacity>
              ) : null}
              <Text style={{ ...font.h1, color: colors.text, flexShrink: 1 }} numberOfLines={1}>
                {currentFolder ? currentFolder.name : 'My Documents'}
              </Text>
            </View>

            <View style={{ flexDirection: 'row', gap: spacing.md }}>
              <TouchableOpacity
                onPress={() => setFilter('favoritesOnly', !filters.favoritesOnly)}
                hitSlop={10}
              >
                <Ionicons
                  name={filters.favoritesOnly ? 'star' : 'star-outline'}
                  size={22}
                  color={filters.favoritesOnly ? colors.warning : colors.text}
                />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={10}>
                <Ionicons name="search" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={cycleSort} hitSlop={10}>
                <Ionicons name="swap-vertical" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      <View style={styles.subHeader}>
        <Text style={{ ...font.small, color: colors.textMuted }} numberOfLines={1}>
          {currentFolder
            ? `My Documents › ${currentFolder.name}`
            : SORT_OPTIONS.find((o) => o.key === sort)?.label}
          {filters.favoritesOnly ? ' · Favorites' : ''}
          {filters.status ? ` · ${filters.status}` : ''}
        </Text>
        {fromCache ? (
          <Text style={{ ...font.small, color: colors.warning }}>Cached copy</Text>
        ) : null}
      </View>

      {loading && documents.length === 0 ? (
        <View style={{ padding: spacing.md }}><SkeletonList count={7} /></View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: isSelectionMode ? 96 : 40 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="Could not load documents"
                message={error} actionLabel="Try again" onAction={refresh} />
            ) : filters.favoritesOnly ? (
              <EmptyState icon="star-outline" title="No favorites yet"
                message="Tap the star on any document to keep it here."
                actionLabel="Show all" onAction={() => setFilter('favoritesOnly', false)} />
            ) : currentFolder ? (
              <EmptyState icon="folder-open-outline" title="This folder is empty"
                message="Long-press a document in My Documents to move it here."
                actionLabel="Back to My Documents" onAction={() => openFolder(null)} />
            ) : (
              <EmptyState title="No documents yet"
                message="Upload your first document to get started."
                actionLabel="Upload" onAction={() => navigation.navigate('Upload')} />
            )
          }
          ListFooterComponent={
            loadingMore ? <ActivityIndicator style={{ margin: spacing.lg }} color={colors.primary} /> : null
          }
          removeClippedSubviews
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      )}

      {isSelectionMode ? (
        <View style={[styles.actionBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity onPress={() => setPicking(true)} style={styles.action}>
            <Ionicons name="folder-open-outline" size={20} color={colors.primary} />
            <Text style={{ ...font.small, color: colors.primary }}>Move</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmDelete} style={styles.action}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={{ ...font.small, color: colors.danger }}>Delete</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FolderPickerModal
        visible={picking}
        folders={folders}
        currentFolderId={filters.folderId}
        count={selectedIds.length}
        onSelect={onMove}
        onClose={() => setPicking(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  folderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, marginBottom: spacing.sm },
  folderIcon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  actionBar: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', justifyContent: 'space-around', paddingVertical: spacing.md, borderTopWidth: 1 },
  action: { alignItems: 'center', gap: 2 },
});
