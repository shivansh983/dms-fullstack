import { useState } from 'react';
import {
  View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Alert,
} from 'react-native';

import { useAuthStore } from '../../store/authStore';
import { validateRegister } from '../../utils/validator';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import useTheme from '../../hooks/useTheme';
import { spacing, font } from '../../styles/theme';

export default function RegisterScreen({ navigation }) {
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const [values, setValues] = useState({ name: '', email: '', password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});

  const register = useAuthStore((s) => s.register);
  const loading  = useAuthStore((s) => s.loading);

  const onChange = (key) => (text) => {
    setValues((v) => ({ ...v, [key]: text }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const onSubmit = async () => {
    const { errors: errs, isValid } = validateRegister(values);
    setErrors(errs);
    if (!isValid) return;

    const res = await register({
      name: values.name.trim(),
      email: values.email.trim(),
      password: values.password,
    });

    if (!res.ok) return setErrors({ form: res.message });

    Alert.alert('Account created', 'You can now sign in with your new account.', [
      { text: 'Sign in', onPress: () => navigation.replace('Login') },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create account</Text>
        <Text style={styles.subtitle}>Start managing your documents</Text>

        <Input
          label="Full name"
          value={values.name}
          onChangeText={onChange('name')}
          error={errors.name}
          placeholder="Shivansh Saxena"
        />

        <Input
          label="Email"
          value={values.email}
          onChangeText={onChange('email')}
          error={errors.email}
          placeholder="you@company.com"
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Input
          label="Password"
          value={values.password}
          onChangeText={onChange('password')}
          error={errors.password}
          placeholder="At least 6 characters"
          secureTextEntry
        />

        <Input
          label="Confirm password"
          value={values.confirmPassword}
          onChangeText={onChange('confirmPassword')}
          error={errors.confirmPassword}
          placeholder="Re-enter your password"
          secureTextEntry
        />

        {errors.form ? <Text style={styles.formError}>{errors.form}</Text> : null}

        <Button title="Create Account" onPress={onSubmit} loading={loading} style={{ marginTop: spacing.sm }} />

        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.link}>
          <Text style={{ color: colors.textMuted, ...font.body }}>
            Already have an account? <Text style={{ color: colors.primary }}>Sign in</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (colors) => StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.lg },
  title: { ...font.h1, color: colors.text },
  subtitle: { ...font.body, color: colors.textMuted, marginBottom: spacing.xl },
  formError: { ...font.small, color: colors.danger, marginTop: spacing.xs },
  link: { marginTop: spacing.lg, alignItems: 'center' },
});
