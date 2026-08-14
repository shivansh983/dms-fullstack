import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import useTheme from '../../hooks/useTheme';
import { useUiStore } from '../../store/uiStore';
import { spacing, font } from '../../styles/theme';

export default function OfflineBanner() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const isOffline = useUiStore((s) => s.isOffline);

  if (!isOffline) return null;

  return (
    <View
      style={[
        styles.bar,
        { backgroundColor: colors.warningSoft, paddingTop: insets.top + spacing.xs },
      ]}
    >
      <Ionicons name="cloud-offline" size={14} color={colors.warning} />
      <Text style={{ ...font.small, color: colors.warning }}>
        Offline - showing cached documents
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    elevation: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingBottom: spacing.xs,
  },
});
