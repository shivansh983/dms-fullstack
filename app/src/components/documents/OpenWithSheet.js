import { Modal, View, Text, TouchableOpacity, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import useTheme from '../../hooks/useTheme';
import { radius, spacing, font } from '../../styles/theme';

export default function OpenWithSheet({ visible, onClose, onSelect, hasText, isImage, processing }) {
  const { colors } = useTheme();

  const readerSubtitle = processing
    ? 'Still reading text from this document'
    : hasText
      ? 'Extracted text, sized for reading'
      : 'No text was found in this file';

  const options = [
    {
      key: 'reader',
      icon: 'book-outline',
      title: 'Read in app',
      subtitle: readerSubtitle,
      disabled: !hasText,
    },
    {
      key: 'viewer',
      icon: isImage ? 'image-outline' : 'document-outline',
      title: 'View in app',
      subtitle: 'The original file, without leaving DMS',
      disabled: false,
    },
    {
      key: 'browser',
      icon: 'open-outline',
      title: 'Open in browser',
      subtitle: "Use your device's default viewer",
      disabled: false,
    },
  ];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={[styles.sheet, { backgroundColor: colors.surface }]}
          onPress={(event) => event.stopPropagation()}
        >
          <View style={[styles.grabber, { backgroundColor: colors.border }]} />

          <Text style={{ ...font.h3, color: colors.text, marginBottom: spacing.sm }}>
            Open with
          </Text>

          {options.map((option) => (
            <TouchableOpacity
              key={option.key}
              disabled={option.disabled}
              onPress={() => {
                onClose();
                onSelect(option.key);
              }}
              style={[styles.row, { opacity: option.disabled ? 0.4 : 1 }]}
            >
              <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
                <Ionicons name={option.icon} size={20} color={colors.primary} />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ ...font.label, color: colors.text }}>{option.title}</Text>
                <Text style={{ ...font.small, color: colors.textMuted }}>{option.subtitle}</Text>
              </View>

              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  grabber: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
