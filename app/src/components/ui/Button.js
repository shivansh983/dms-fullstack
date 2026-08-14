import { TouchableOpacity, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { radius, spacing, font } from '../../styles/theme';
import  useTheme  from '../../hooks/useTheme';

export default function Button({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = 'primary',
  style,
}) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.85}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.onPrimary} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && { color: colors.primary }]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const makeStyles = (colors) => ({
  base: {
    height: 50,
    borderRadius: radius.md, 
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg, 
  },
  primary: { backgroundColor: colors.primary },
  outline: { borderWidth: 1, borderColor: colors.primary, backgroundColor: 'transparent' },
  danger:  { backgroundColor: colors.danger },
  disabled: { opacity: 0.5 },
  text: { ...font.label, fontSize: 15, color: colors.onPrimary }, 
});