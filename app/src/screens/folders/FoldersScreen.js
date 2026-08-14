import { useEffect, useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import EmptyState from '../../components/ui/EmptyState';
import useTheme from '../../hooks/useTheme';
import { useFolderStore } from '../../store/folderStore';
import { useDocumentStore } from '../../store/documentStore';
import { radius, spacing, font } from '../../styles/theme';

export default function FoldersScreen({ navigation }) {
  const { colors } = useTheme();

  const folders      = useFolderStore((s) => s.folders);
  const loading      = useFolderStore((s) => s.loading);
  const fetchFolders = useFolderStore((s) => s.fetchFolders);
  const createFolder = useFolderStore((s) => s.createFolder);
  const renameFolder = useFolderStore((s) => s.renameFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);

  const setFilter = useDocumentStore((s) => s.setFilter);

  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [draft, setDraft] = useState('');

  useEffect(() => { fetchFolders(); }, [fetchFolders]);

  const onCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    const res = await createFolder(name.trim());
    setCreating(false);

    if (res.ok) setName('');
    else Alert.alert('Could not create folder', res.message);
  };

  const startRename = (folder) => {
    setEditingId(folder.id);
    setDraft(folder.name);
  };

  const commitRename = () => {
    const next = draft.trim();
    const current = folders.find((f) => f.id === editingId);
    if (next && current && next !== current.name) renameFolder(editingId, next);
    setEditingId(null);
    setDraft('');
  };

  const onDelete = (folder) => {
    Alert.alert('Delete folder', `"${folder.name}" will be deleted. Documents inside are kept.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteFolder(folder.id) },
    ]);
  };

  const openFolder = (folder) => {
    setFilter('folderId', folder.id);
    navigation.navigate('Tabs', { screen: 'Documents' });
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ padding: spacing.md, flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="New folder name"
            onSubmitEditing={onCreate}
            returnKeyType="done"
          />
        </View>
        <Button title="Add" onPress={onCreate} loading={creating} disabled={!name.trim()} />
      </View>

      <FlatList
        data={folders}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ paddingHorizontal: spacing.md, paddingBottom: spacing.xl }}
        refreshing={loading}
        onRefresh={fetchFolders}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => openFolder(item)}
            activeOpacity={0.8}
            style={[styles.row, { backgroundColor: colors.surface, opacity: item._pending ? 0.5 : 1 }]}
          >
            <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
              <Ionicons name="folder" size={20} color={colors.primary} />
            </View>

            <View style={{ flex: 1 }}>
              {editingId === item.id ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onSubmitEditing={commitRename}
                  onBlur={commitRename}
                  autoFocus
                  returnKeyType="done"
                  style={{ ...font.label, color: colors.text, padding: 0 }}
                />
              ) : (
                <Text style={{ ...font.label, color: colors.text }} numberOfLines={1}>{item.name}</Text>
              )}
              <Text style={{ ...font.small, color: colors.textMuted }}>
                {item.documentCount} {item.documentCount === 1 ? 'document' : 'documents'}
              </Text>
            </View>

            <TouchableOpacity onPress={() => startRename(item)} hitSlop={8} style={{ padding: spacing.xs }}>
              <Ionicons name="create-outline" size={20} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => onDelete(item)} hitSlop={8} style={{ padding: spacing.xs }}>
              <Ionicons name="trash-outline" size={20} color={colors.danger} />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          loading ? null : (
            <EmptyState
              icon="folder-open-outline"
              title="No folders yet"
              message="Create a folder above to start organising your documents."
            />
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md,
         borderRadius: radius.lg, marginBottom: spacing.sm },
  icon: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
});
