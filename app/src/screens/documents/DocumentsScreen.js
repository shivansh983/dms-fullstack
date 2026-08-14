import { useEffect, useCallback, useRef, useState } from 'react';
import { View, FlatList, RefreshControl, ActivityIndicator, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useDocumentStore } from '../../store/documentStore';
import DocumentCard from '../../components/documents/DocumentCard';
import { SkeletonList } from '../../components/ui/Skeleton';
import * as DocumentPicker from 'expo-document-picker';
import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { SORT_OPTIONS } from '../../constants/enums';
import { spacing, font } from '../../styles/theme';

export default function DocumentsScreen({ navigation, route }) {
  const { colors } = useTheme();

  const documents   = useDocumentStore((s) => s.documents);
  const loading     = useDocumentStore((s) => s.loading);
  const refreshing  = useDocumentStore((s) => s.refreshing);
  const loadingMore = useDocumentStore((s) => s.loadingMore);
  const error       = useDocumentStore((s) => s.error);
  const fromCache   = useDocumentStore((s) => s.fromCache);
  const sort        = useDocumentStore((s) => s.sort);
  const filters     = useDocumentStore((s) => s.filters);
  const fetchDocs   = useDocumentStore((s) => s.fetchDocuments);
  const loadMore    = useDocumentStore((s) => s.loadMore);
  const refresh     = useDocumentStore((s) => s.refresh);
  const setSort     = useDocumentStore((s) => s.setSort);
  const setFilter   = useDocumentStore((s) => s.setFilter);
  const toggleFav   = useDocumentStore((s) => s.toggleFavorite);

  const statusParam = route.params?.status;
  const firstRun = useRef(true);

  const [selectedIds, setSelectedIds] = useState([]);
  const isSelectionMode = selectedIds.length > 0;

  const onLongPress = useCallback((id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id)  : [...prev, id]
    );
  }, []);

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const handlePress = useCallback((id) => {
    if (isSelectionMode) {
      onLongPress(id);
    } else {
      navigation.navigate('Preview', { id });
    }
  }, [isSelectionMode, onLongPress, navigation]);
 

  useEffect(() => {

    if (firstRun.current) {
      firstRun.current = false;
      statusParam !== undefined ? setFilter('status', statusParam) : fetchDocs({ reset: true });
      return;
    }
    if (statusParam !== undefined) setFilter('status', statusParam);
  }, [statusParam]);

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
    [navigation, toggleFav, selectedIds, isSelectionMode, handlePress, onLongPress]
  );


  const cycleSort = () => {
    const i = SORT_OPTIONS.findIndex((o) => o.key === sort);
    setSort(SORT_OPTIONS[(i + 1) % SORT_OPTIONS.length].key);
  };

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
            <Text style={{ ...font.h1, color: colors.text }}>My Documents</Text>
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
        <Text style={{ ...font.small, color: colors.textMuted }}>
          {SORT_OPTIONS.find((o) => o.key === sort)?.label}
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
          contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            error ? (
              <EmptyState icon="cloud-offline-outline" title="Couldn't load documents"
                message={error} actionLabel="Try again" onAction={refresh} />
            ) : filters.favoritesOnly ? (
              <EmptyState icon="star-outline" title="No favorites yet"
                message="Tap the star on any document to keep it here."
                actionLabel="Show all" onAction={() => setFilter('favoritesOnly', false)} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  subHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: spacing.md },
});