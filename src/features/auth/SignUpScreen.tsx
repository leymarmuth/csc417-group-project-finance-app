import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { AuthScaffold } from './components/AuthScaffold';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/useAuthStore';
import { passwordStrength, validators } from '../../lib/validation';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { radius, spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

interface FormValues {
  name: string;
  email: string;
  password: string;
}

export function SignUpScreen({ navigation }: AuthScreenProps<'SignUp'>) {
  const theme = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { name: '', email: '', password: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      const nameError = validators.minLength(values.name, 2, 'Name');
      if (nameError) errors.name = nameError;
      const emailError = validators.email(values.email);
      if (emailError) errors.email = emailError;
      const passwordError = validators.password(values.password);
      if (passwordError) errors.password = passwordError;
      return errors;
    },
  });

  const strength = passwordStrength(form.values.password);
  const strengthColor =
    strength.score <= 1
      ? theme.colors.negative
      : strength.score === 2
        ? theme.colors.warning
        : theme.colors.positive;

  const submit = async () => {
    if (!accepted || submitting) {
      haptics.warning();
      return;
    }
    setSubmitting(true);
    try {
      await signUp(form.values.name, form.values.email, form.values.password);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow="Begin"
      title="Create your account."
      subtitle="Three months of sample history is waiting so you can explore immediately."
      onBack={() => navigation.goBack()}
      footer={
        <Pressable onPress={() => navigation.navigate('SignIn')} style={styles.footerLink}>
          <Text variant="caption" tone="secondary">
            Already have an account?{' '}
          </Text>
          <Text variant="caption" style={{ color: theme.colors.accent }}>
            Sign in
          </Text>
        </Pressable>
      }
    >
      <Animated.View entering={FadeInDown.duration(380)} style={{ gap: spacing.lg }}>
        <Input
          label="Full name"
          placeholder="Brian Kiptoo"
          icon="person-outline"
          autoCapitalize="words"
          autoComplete="name"
          value={form.values.name}
          onChangeText={(text) => {
            form.setValue('name', text);
            clearError();
          }}
          onBlur={() => form.blur('name')}
          error={form.visibleError('name')}
        />
        <Input
          label="Email"
          placeholder="you@student.mu.ac.ke"
          icon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          value={form.values.email}
          onChangeText={(text) => {
            form.setValue('email', text);
            clearError();
          }}
          onBlur={() => form.blur('email')}
          error={form.visibleError('email')}
        />
        <Input
          label="Password"
          placeholder="At least 8 characters"
          icon="lock-closed-outline"
          secure
          autoComplete="new-password"
          value={form.values.password}
          onChangeText={(text) => {
            form.setValue('password', text);
            clearError();
          }}
          onBlur={() => form.blur('password')}
          error={form.visibleError('password')}
        />

        <View style={{ gap: spacing.sm }}>
          <View style={styles.meter}>
            {[0, 1, 2, 3].map((index) => (
              <View
                key={index}
                style={[
                  styles.segment,
                  {
                    backgroundColor:
                      index < strength.score ? strengthColor : theme.colors.surfaceSunken,
                  },
                ]}
              />
            ))}
          </View>
          <View style={styles.checks}>
            {strength.checks.map((check) => (
              <View key={check.id} style={styles.check}>
                <Ionicons
                  name={check.met ? 'checkmark-circle' : 'ellipse-outline'}
                  size={13}
                  color={check.met ? theme.colors.positive : theme.colors.textTertiary}
                />
                <Text variant="caption" tone={check.met ? 'secondary' : 'tertiary'}>
                  {check.label}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={() => {
            haptics.select();
            setAccepted((prev) => !prev);
          }}
          style={styles.termsRow}
        >
          <View
            style={[
              styles.checkbox,
              {
                borderColor: accepted ? theme.colors.accent : theme.colors.hairlineStrong,
                backgroundColor: accepted ? theme.colors.accent : 'transparent',
              },
            ]}
          >
            {accepted ? (
              <Ionicons name="checkmark" size={12} color={theme.colors.onAccent} />
            ) : null}
          </View>
          <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
            I agree to the Terms of Service and Privacy Policy.
          </Text>
        </Pressable>

        {error ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[
              styles.errorBanner,
              {
                backgroundColor: theme.colors.negativeSoft,
                borderColor: `${theme.colors.negative}44`,
              },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={16} color={theme.colors.negative} />
            <Text variant="caption" style={{ color: theme.colors.negative, flex: 1 }}>
              {error}
            </Text>
          </Animated.View>
        ) : null}

        <Button
          label={submitting ? 'Creating your ledger…' : 'Create account'}
          onPress={() => void form.submit(submit)()}
          loading={submitting}
          disabled={!accepted}
          icon="arrow-forward"
          iconPosition="trailing"
        />

        <View style={styles.trustRow}>
          <Ionicons name="shield-checkmark-outline" size={13} color={theme.colors.textTertiary} />
          <Text variant="caption" tone="tertiary">
            Stored on-device, encrypted at rest.
          </Text>
        </View>
      </Animated.View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  meter: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  checks: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  check: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth * 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  trustRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
