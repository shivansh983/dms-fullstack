import { useState } from 'react';
import {
  Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function CreatePasswordScreen() {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [values, setValues] = useState({ newPassword: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const user = useAuthStore((s) => s.user);
  const setPassword = useAuthStore((s) => s.setPassword);
  const loading = useAuthStore((s) => s.loading);

  const onChange = (key) => (text) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async () => {
    const next = {};

    if (values.newPassword.length < 6) next.newPassword = 'Password must be at least 6 characters';
    if (values.newPassword !== values.confirmPassword) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await setPassword(values.newPassword);
    if (!res.ok) setErrors({ form: res.message });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create a password</Text>
        <Text style={styles.subtitle}>
          You signed in with Google as {user?.email}. Set a password so you can also sign in
          without Google and recover your account by email.
        </Text>

        <Input
          label="Password"
          value={values.newPassword}
          onChangeText={onChange('newPassword')}
          error={errors.newPassword}
          placeholder="At least 6 characters"
          secureTextEntry
          autoFocus
        />

        <Input
          label="Confirm password"
          value={values.confirmPassword}
          onChangeText={onChange('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="Confirm password"
          secureTextEntry
        />

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Button
          title="Save password"
          onPress={onSubmit}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...font.h1, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted, marginBottom: spacing.xl },
  formError: { ...font.small, color: colors.danger, marginBottom: spacing.sm },
});
