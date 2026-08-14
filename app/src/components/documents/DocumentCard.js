import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import StatusBadge from './StatusBadge';
import useTheme from '../../hooks/useTheme';
import { formatSize, relativeDate, fileIcon } from '../../utils/formatters';
import { radius, spacing, font } from '../../styles/theme';

function DocumentCard({ document, onPress, onLongPress, onToggleFavorite, onPreview, onDownload, selectionMode, selected }) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
      style={[styles.card, { backgroundColor: selected ? colors.primarySoft : colors.surface }]}
    >
      <View style={styles.topRow}>
        {selectionMode && (
          <Ionicons
            name={selected ? 'checkbox' : 'square-outline'}
            size={22}
            color={selected ? colors.primary : colors.textMuted}
            style={{ marginTop: 2 }}
          />
        )}

        <View style={[styles.icon, { backgroundColor: colors.primarySoft }]}>
          <Ionicons name={fileIcon(document.type)} size={22} color={colors.primary} />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ ...font.label, fontSize: 15, color: colors.text }} numberOfLines={1}>
            {document.name}
          </Text>
          <Text style={{ ...font.small, color: colors.textMuted, marginTop: 2 }}>
            {formatSize(document.size)} · {relativeDate(document.createdAt)}
          </Text>
          <View style={{ marginTop: spacing.xs }}>
            <StatusBadge status={document.status} />
          </View>
        </View>

        <TouchableOpacity onPress={onToggleFavorite} hitSlop={10} style={styles.starButton}>
          <Ionicons
            name={document.isFavorite ? 'star' : 'star-outline'}
            size={20}
            color={document.isFavorite ? colors.warning : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      {(onPreview || onDownload) && (
        <>
          <View style={[styles.divider, { backgroundColor: colors.border || 'rgba(150,150,150,0.2)' }]} />
          
          <View style={styles.actionRow}>
            {onPreview && (
              <TouchableOpacity onPress={onPreview} style={styles.actionButton}>
                <Text style={{ ...font.small, color: colors.primary, fontWeight: '600' }}>Preview</Text>
              </TouchableOpacity>
            )}
            {onDownload && (
              <TouchableOpacity onPress={onDownload} style={styles.actionButton}>
                <Text style={{ ...font.small, color: colors.primary, fontWeight: '600' }}>Download</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm, 
  },
  topRow: { 
    flexDirection: 'row',
    alignItems: 'flex-start', 
    gap: spacing.md 
  },
  icon: { 
    width: 44, 
    height: 44, 
    borderRadius: radius.md,
    alignItems: 'center', 
    justifyContent: 'center' 
  },
  starButton: {
    padding: spacing.xs,
    alignSelf: 'flex-start', 
  },
  divider: {
    height: 1,
    marginVertical: spacing.sm,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  actionButton: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
});

export default React.memo(DocumentCard);