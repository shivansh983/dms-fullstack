import { useState } from 'react';
import {
  Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity
} from 'react-native';
import { useAuthStore } from '../../store/authStore';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function ResetPasswordScreen({ route, navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [values, setValues] = useState({
    token: route.params?.token || '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});

  const resetPassword = useAuthStore((s) => s.resetPassword);
  const loading = useAuthStore((s) => s.loading);

  const onChange = (key) => (text) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async () => {
    const next = {};

    if (!values.token.trim()) next.token = 'Paste the token from your reset link';
    if (values.newPassword.length < 6) next.newPassword = 'Password must be at least 6 characters';
    if (values.newPassword !== values.confirmPassword) next.confirmPassword = 'Passwords do not match';

    setErrors(next);
    if (Object.keys(next).length) return;

    const res = await resetPassword(values.token.trim(), values.newPassword);
    if (!res.ok) return setErrors({ form: res.message });

    navigation.navigate('Login', { resetMessage: res.message });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Reset password</Text>
        <Text style={styles.subtitle}>
          Paste the token from your reset link and choose a new password.
        </Text>

        <Input
          label="Reset token"
          value={values.token}
          onChangeText={onChange('token')}
          error={errors.token}
          placeholder="Paste token here"
          autoCapitalize="none"
          autoCorrect={false}
        />

        <Input
          label="New password"
          value={values.newPassword}
          onChangeText={onChange('newPassword')}
          error={errors.newPassword}
          placeholder="New password"
          secureTextEntry
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
          title="Update password"
          onPress={onSubmit}
          loading={loading}
          style={{ marginTop: spacing.sm }}
        />

        <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.link}>
          <Text style={{ color: colors.textMuted, ...font.body }}>Back to sign in</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...font.h1, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted, marginBottom: spacing.xl },
  formError: { ...font.small, color: colors.danger, marginBottom: spacing.sm },
  link: { marginTop: spacing.lg, alignItems: 'center' },
});
