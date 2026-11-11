import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeInDown, ZoomIn } from 'react-native-reanimated';
import { AuthScaffold } from './components/AuthScaffold';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/useAuthStore';
import { validators } from '../../lib/validation';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { spacing, useTheme } from '../../theme';
import type { AuthScreenProps } from '../../navigation/types';

export function ForgotPasswordScreen({ navigation }: AuthScreenProps<'ForgotPassword'>) {
  const theme = useTheme();
  const requestReset = useAuthStore((state) => state.requestReset);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const form = useForm<{ email: string }>({
    initialValues: { email: '' },
    validate: (values) => {
      const emailError = validators.email(values.email);
      return emailError ? { email: emailError } : {};
    },
  });

  const submit = async () => {
    setSending(true);
    try {
      await requestReset(form.values.email);
      haptics.success();
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <AuthScaffold
      eyebrow={sent ? 'Check your inbox' : 'Recovery'}
      title={sent ? 'Link sent.' : 'Reset your password.'}
      subtitle={
        sent
          ? 'If an account exists for that address, a secure reset link is on its way.'
          : 'Enter the email on your account and we will send a secure reset link.'
      }
      onBack={() => navigation.goBack()}
    >
      {sent ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={{ alignItems: 'center', gap: spacing.lg }}
        >
          <Animated.View
            entering={ZoomIn.springify().damping(14)}
            style={[
              styles.successBadge,
              {
                backgroundColor: theme.colors.positiveSoft,
                borderColor: `${theme.colors.positive}44`,
              },
            ]}
          >
            <Ionicons name="paper-plane-outline" size={30} color={theme.colors.positive} />
          </Animated.View>
          <Text variant="body" tone="secondary" align="center">
            Sent to {form.values.email}
          </Text>
          <Button label="Back to sign in" onPress={() => navigation.navigate('SignIn')} />
          <Pressable onPress={() => setSent(false)} hitSlop={8}>
            <Text variant="caption" style={{ color: theme.colors.accent }}>
              Use a different email
            </Text>
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInDown.duration(380)} style={{ gap: spacing.lg }}>
          <Input
            label="Email"
            placeholder="you@student.mu.ac.ke"
            icon="mail-outline"
            autoCapitalize="none"
            keyboardType="email-address"
            value={form.values.email}
            onChangeText={(text) => form.setValue('email', text)}
            onBlur={() => form.blur('email')}
            error={form.visibleError('email')}
          />
          <Button
            label="Send reset link"
            onPress={() => void form.submit(submit)()}
            loading={sending}
            icon="send-outline"
          />
          <View style={styles.note}>
            <Ionicons
              name="information-circle-outline"
              size={15}
              color={theme.colors.textTertiary}
            />
            <Text variant="caption" tone="tertiary" style={{ flex: 1 }}>
              In this demo build no email actually leaves the device — the flow is wired end to end
              so you can see the full interaction.
            </Text>
          </View>
        </Animated.View>
      )}
    </AuthScaffold>
  );
}

const styles = StyleSheet.create({
  successBadge: {
    width: 84,
    height: 84,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
});
