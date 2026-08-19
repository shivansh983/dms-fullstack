import { useState, useEffect } from 'react';
import { View, FlatList, TextInput, TouchableOpacity, Text, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useDebounce from '../../hooks/useDebounce';
import { useDocumentStore } from '../../store/documentStore';
import DocumentCard from '../../components/documents/DocumentCard';
import EmptyState from '../../components/ui/EmptyState';
import { SkeletonList } from '../../components/ui/Skeleton';
import useTheme from '../../hooks/useTheme';
import { DOC_STATUS } from '../../constants/enums';
import { radius, spacing, font } from '../../styles/theme';

const CHIPS = [
  { key: null, label: 'All' },
  { key: DOC_STATUS.PENDING, label: 'Pending' },
  { key: DOC_STATUS.PROCESSING, label: 'Processing' },
  { key: DOC_STATUS.APPROVED, label: 'Approved' },
  { key: DOC_STATUS.REJECTED, label: 'Rejected' },
];

export default function SearchScreen({ navigation }) {
  const { colors } = useTheme();
  const [text, setText] = useState('');
  const debounced = useDebounce(text, 350);

  const documents = useDocumentStore((s) => s.documents);
  const loading   = useDocumentStore((s) => s.loading);
  const filters   = useDocumentStore((s) => s.filters);
  const setQuery  = useDocumentStore((s) => s.setQuery);
  const setFilter = useDocumentStore((s) => s.setFilter);

  useEffect(() => { setQuery(debounced); }, [debounced]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={[styles.bar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Search name or contents..."
          placeholderTextColor={colors.textMuted}
          style={{ flex: 1, ...font.body, color: colors.text }}
          autoFocus
          returnKeyType="search"
        />
        {text ? (
          <TouchableOpacity onPress={() => setText('')} hitSlop={10}>
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={{ maxHeight: 44 }} contentContainerStyle={{ paddingHorizontal: spacing.md, gap: spacing.sm }}>
        {CHIPS.map((chip) => {
          const active = filters.status === chip.key;
          return (
            <TouchableOpacity
              key={chip.label}
              onPress={() => setFilter('status', chip.key)}
              style={[
                styles.chip,
                { backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border },
              ]}
            >
              <Text style={{ ...font.small, color: active ? colors.onPrimary : colors.text }}>
                {chip.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {loading ? (
        <View style={{ padding: spacing.md }}><SkeletonList count={5} /></View>
      ) : (
        <FlatList
          data={documents}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: spacing.md }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <DocumentCard document={item} onPress={() => navigation.navigate('Preview', { id: item.id })} />
          )}
          ListEmptyComponent={
            <EmptyState icon="search-outline" title="No matches"
              message={text ? `Nothing found for "${text}".` : 'Start typing to search.'} />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, margin: spacing.md,
         paddingHorizontal: spacing.md, height: 46, borderRadius: radius.md, borderWidth: 1 },
  chip: { paddingHorizontal: spacing.md, height: 32, justifyContent: 'center', borderRadius: radius.full, borderWidth: 1 },
});