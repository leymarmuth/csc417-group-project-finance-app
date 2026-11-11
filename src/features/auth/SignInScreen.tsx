import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { AuthScaffold } from './components/AuthScaffold';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Switch } from '../../components/ui/Switch';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { DEMO_CREDENTIALS } from '../../services/auth.service';
import { validators } from '../../lib/validation';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { radius, spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

interface FormValues {
  email: string;
  password: string;
}

export function SignInScreen({ navigation }: AuthScreenProps<'SignIn'>) {
  const theme = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const [remember, setRemember] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { email: '', password: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      const emailError = validators.email(values.email);
      if (emailError) errors.email = emailError;
      if (!values.password) errors.password = 'Password is required';
      return errors;
    },
  });

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await signIn(form.values.email, form.values.password, remember);
      haptics.success();
    } catch {
      haptics.error();
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemo = () => {
    haptics.tap();
    form.setValues({ email: DEMO_CREDENTIALS.email, password: DEMO_CREDENTIALS.password });
    clearError();
    toast.show('Demo credentials filled in');
  };

  return (
    <AuthScaffold
      eyebrow="Welcome back"
      title="Sign in to Aurum."
      subtitle="Your ledger, budgets and goals are exactly where you left them."
      onBack={() => navigation.goBack()}
      footer={
        <Pressable onPress={() => navigation.navigate('SignUp')} style={styles.footerLink}>
          <Text variant="caption" tone="secondary">
            New to Aurum?{' '}
          </Text>
          <Text variant="caption" style={{ color: theme.colors.accent }}>
            Create an account
          </Text>
        </Pressable>
      }
    >
      <Animated.View entering={FadeInDown.duration(380)} style={{ gap: spacing.lg }}>
        <Input
          label="Email"
          placeholder="you@student.mu.ac.ke"
          icon="mail-outline"
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          returnKeyType="next"
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
          placeholder="Your password"
          icon="lock-closed-outline"
          secure
          autoComplete="password"
          returnKeyType="go"
          value={form.values.password}
          onChangeText={(text) => {
            form.setValue('password', text);
            clearError();
          }}
          onBlur={() => form.blur('password')}
          error={form.visibleError('password')}
          onSubmitEditing={() => void form.submit(submit)()}
        />

        <View style={styles.row}>
          <View style={styles.remember}>
            <Switch value={remember} onChange={setRemember} />
            <Text variant="caption" tone="secondary">
              Keep me signed in
            </Text>
          </View>
          <Pressable onPress={() => navigation.navigate('ForgotPassword')} hitSlop={8}>
            <Text variant="caption" style={{ color: theme.colors.accent }}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

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
          label="Sign in"
          onPress={() => void form.submit(submit)()}
          loading={submitting}
          icon="arrow-forward"
          iconPosition="trailing"
        />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(380)} style={{ gap: spacing.lg }}>
        <View style={styles.dividerRow}>
          <View style={[styles.line, { backgroundColor: theme.colors.hairline }]} />
          <Text variant="micro" tone="tertiary">
            or
          </Text>
          <View style={[styles.line, { backgroundColor: theme.colors.hairline }]} />
        </View>

        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <Button
            label="Apple"
            variant="secondary"
            icon="logo-apple"
            onPress={() => {
              haptics.tap();
              toast.show('Single sign-on needs a native build', {
                description: 'This demo uses email + password.',
              });
            }}
            style={{ flex: 1 }}
            fullWidth={false}
          />
          <Button
            label="Google"
            variant="secondary"
            icon="logo-google"
            onPress={() => {
              haptics.tap();
              toast.show('Single sign-on needs a native build', {
                description: 'This demo uses email + password.',
              });
            }}
            style={{ flex: 1 }}
            fullWidth={false}
          />
        </View>

        <Pressable
          onPress={fillDemo}
          style={[
            styles.demoCard,
            { borderColor: theme.colors.hairline, backgroundColor: theme.colors.surfaceSunken },
          ]}
        >
          <View style={[styles.demoIcon, { backgroundColor: theme.colors.accentSoft }]}>
            <Ionicons name="sparkles-outline" size={15} color={theme.colors.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text variant="label">Use the demo account</Text>
            <Text variant="caption" tone="tertiary">
              {DEMO_CREDENTIALS.email} · {DEMO_CREDENTIALS.password}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={15} color={theme.colors.textTertiary} />
        </Pressable>
      </Animated.View>
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  remember: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth },
  demoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  demoIcon: {
    width: 32,
    height: 32,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footerLink: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
});
