import { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { radius, spacing, font } from '../../styles/theme';
import useTheme from '../../hooks/useTheme';

export default function Input({ label, error, style, ...props }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);
  const [focused, setFocused] = useState(false);

  return (
    <View style={{ marginBottom: spacing.md }}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TextInput
        {...props}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          focused && { borderColor: colors.primary },
          error && { borderColor: colors.danger },
          style,
        ]}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  label: { ...font.label, color: colors.text, marginBottom: spacing.xs },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    ...font.body,
    color: colors.text,
  },
  error: { ...font.small, color: colors.danger, marginTop: spacing.xs },
});