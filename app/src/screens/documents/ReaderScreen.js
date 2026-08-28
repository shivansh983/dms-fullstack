import { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, FlatList, ActivityIndicator, TouchableOpacity, TextInput, StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { documentService } from '../../services/documentService';
import { cleanText, countWords } from '../../utils/formatters';
import { radius, spacing, font } from '../../styles/theme';

const SIZES = [15, 17, 19, 22];
const PAGE_BATCH = 5;

function Highlighted({ text, query, style, highlight }) {
  if (!query) return <Text selectable style={style}>{text}</Text>;

  const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));

  return (
    <Text selectable style={style}>
      {parts.map((part, index) =>
        part.toLowerCase() === query.toLowerCase() ? (
          <Text key={index} style={highlight}>{part}</Text>
        ) : (
          part
        )
      )}
    </Text>
  );
}

export default function ReaderScreen({ route, navigation }) {
  const { id, name } = route.params;
  const { colors } = useTheme();

  const [pages, setPages] = useState([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [sizeIndex, setSizeIndex] = useState(1);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);

  const nextPage = useRef(1);

  useEffect(() => {
    navigation.setOptions({ title: name || 'Reader' });
  }, [name, navigation]);

  const loadPage = useCallback(
    async (which) => {
      const data = await documentService.content(id, { page: which, limit: PAGE_BATCH });

      setPages((current) => {
        const seen = new Set(current.map((p) => p.pageNumber));
        const fresh = data.pages.filter((p) => !seen.has(p.pageNumber));
        return [...current, ...fresh];
      });

      setTotalPages(data.totalPages);
      return data;
    },
    [id]
  );

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        await loadPage(1);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [loadPage]);

  const onEndReached = async () => {
    if (loading || loadingMore) return;
    if (nextPage.current * PAGE_BATCH >= totalPages) return;

    setLoadingMore(true);
    nextPage.current += 1;

    try {
      await loadPage(nextPage.current);
    } catch {
      nextPage.current -= 1;
    } finally {
      setLoadingMore(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (error || !pages.length) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, justifyContent: 'center' }}>
        <EmptyState
          icon="document-text-outline"
          title="Nothing to read yet"
          message={error || 'No text has been extracted from this document.'}
          actionLabel="Go back"
          onAction={() => navigation.goBack()}
        />
      </View>
    );
  }

  const fontSize = SIZES[sizeIndex];
  const trimmedQuery = query.trim();

  const visible = trimmedQuery
    ? pages.filter((page) =>
        (page.content || '').toLowerCase().includes(trimmedQuery.toLowerCase())
      )
    : pages;

  const totalWords = pages.reduce((sum, page) => sum + countWords(page.content || ''), 0);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        {searching ? (
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search in document"
            placeholderTextColor={colors.textMuted}
            autoFocus
            style={{ flex: 1, color: colors.text, ...font.body, paddingVertical: 0 }}
          />
        ) : (
          <Text style={{ ...font.small, color: colors.textMuted, flex: 1 }}>
            {totalPages > 1 ? `${pages.length} of ${totalPages} pages` : `${totalWords} words`}
            {' loaded'}
          </Text>
        )}

        <TouchableOpacity
          onPress={() => {
            setSearching((on) => !on);
            if (searching) setQuery('');
          }}
          hitSlop={10}
          style={styles.barButton}
        >
          <Ionicons name={searching ? 'close' : 'search'} size={18} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setSizeIndex((i) => (i + 1) % SIZES.length)}
          hitSlop={10}
          style={styles.barButton}
        >
          <Ionicons name="text-outline" size={18} color={colors.primary} />
          <Text style={{ ...font.label, color: colors.primary }}>{fontSize}</Text>
        </TouchableOpacity>
      </View>

      {trimmedQuery && !visible.length ? (
        <View style={styles.center}>
          <Text style={{ ...font.body, color: colors.textMuted }}>
            No match in the pages loaded so far.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visible}
          keyExtractor={(item) => String(item.pageNumber)}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.6}
          contentContainerStyle={{
            padding: spacing.md,
            gap: spacing.lg,
            paddingBottom: spacing.xxl,
          }}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: spacing.lg }} />
            ) : null
          }
          renderItem={({ item }) => (
            <View style={[styles.page, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {totalPages > 1 ? (
                <View style={styles.pageHead}>
                  <Text style={{ ...font.small, color: colors.textMuted }}>
                    Page {item.pageNumber}
                  </Text>

                  {item.confidence != null ? (
                    <Text style={{ ...font.small, color: colors.textMuted }}>
                      {Math.round(item.confidence)}% confidence
                    </Text>
                  ) : null}
                </View>
              ) : null}

              <Highlighted
                text={cleanText(item.content || '')}
                query={trimmedQuery}
                style={{ color: colors.text, fontSize, lineHeight: fontSize * 1.6 }}
                highlight={{ backgroundColor: colors.warningSoft, color: colors.text }}
              />
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  barButton: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  page: { borderRadius: radius.lg, borderWidth: 1, padding: spacing.md },
  pageHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
});
