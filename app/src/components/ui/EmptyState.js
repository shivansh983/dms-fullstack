import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function EmptyState({ icon = 'document-outline', title, message, actionLabel, onAction }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      <Ionicons name={icon} size={56} color={colors.textMuted} />
      <Text style={{ ...font.h3, color: colors.text, marginTop: spacing.sm }}>{title}</Text>
      {message ? (
        <Text style={{ ...font.body, color: colors.textMuted, textAlign: 'center' }}>{message}</Text>
      ) : null}
      {actionLabel ? (
        <Button title={actionLabel} variant="outline" onPress={onAction} style={{ marginTop: spacing.md }} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
});
