import { View, Text, StyleSheet } from 'react-native';
import useTheme from '../../hooks/useTheme';
import { radius, spacing, font } from '../../styles/theme';
import { DOC_STATUS } from '../../constants/enums';

export default function StatusBadge({ status }) {
  const { colors } = useTheme();

  const MAP = {
    [DOC_STATUS.PENDING]:    { label: 'Pending',     bg: colors.warningSoft, fg: colors.warning },
    [DOC_STATUS.PROCESSING]: { label: 'OCR running', bg: colors.primarySoft, fg: colors.primary },
    [DOC_STATUS.APPROVED]:   { label: 'Approved',    bg: colors.successSoft, fg: colors.success },
    [DOC_STATUS.REJECTED]:   { label: 'Rejected',    bg: colors.dangerSoft,  fg: colors.danger },
  };

  const cfg = MAP[status] || MAP[DOC_STATUS.PENDING];

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.text, { color: cfg.fg }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { paddingHorizontal: spacing.sm, paddingVertical: 3, borderRadius: radius.full, alignSelf: 'flex-start' },
  text: { ...font.small, fontSize: 11, fontWeight: '600' },
});