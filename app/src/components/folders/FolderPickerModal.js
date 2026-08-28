import { Modal, View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { radius, spacing, font } from '../../styles/theme';

export default function FolderPickerModal({
  visible,
  folders,
  currentFolderId = null,
  count = 1,
  onSelect,
  onClose,
}) {
  const { colors } = useTheme();

  const options = [
    { id: null, name: 'My Documents', root: true },
    ...folders.filter((f) => !f._pending),
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          style={[styles.sheet, { backgroundColor: colors.surface }]}
        >
          <Text style={{ ...font.h1, color: colors.text }}>Move to</Text>
          <Text style={{ ...font.small, color: colors.textMuted, marginBottom: spacing.md }}>
            {count === 1 ? '1 document' : `${count} documents`}
          </Text>

          <FlatList
            data={options}
            keyExtractor={(f) => f.id ?? 'root'}
            style={{ maxHeight: 320 }}
            renderItem={({ item }) => {
              const here = (item.id ?? null) === (currentFolderId ?? null);

              return (
                <TouchableOpacity
                  disabled={here}
                  onPress={() => onSelect(item.id)}
                  style={[styles.row, { opacity: here ? 0.4 : 1 }]}
                >
                  <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons
                      name={item.root ? 'home' : 'folder'}
                      size={18}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={{ ...font.body, color: colors.text, flex: 1 }} numberOfLines={1}>
                    {item.name}
                  </Text>

                  {here ? (
                    <Text style={{ ...font.small, color: colors.textMuted }}>Current</Text>
                  ) : (
                    <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <Text style={{ ...font.small, color: colors.textMuted, padding: spacing.md }}>
                No folders yet. Create one from the Folders screen.
              </Text>
            }
          />

          <TouchableOpacity onPress={onClose} style={styles.cancel}>
            <Text style={{ ...font.body, color: colors.textMuted }}>Cancel</Text>
          </TouchableOpacity>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: {
    padding: spacing.lg,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  icon: { width: 34, height: 34, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  cancel: { alignItems: 'center', paddingTop: spacing.md },
});
