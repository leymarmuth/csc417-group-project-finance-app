import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/useAuthStore';
import { toast } from '../../store/useToastStore';
import { passwordStrength } from '../../lib/validation';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';

interface FormValues {
  current: string;
  next: string;
  confirm: string;
}

export function ChangePasswordScreen({ navigation }: RootScreenProps<'ChangePassword'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const changePassword = useAuthStore((state) => state.changePassword);
  const [saving, setSaving] = useState(false);

  const form = useForm<FormValues>({
    initialValues: { current: '', next: '', confirm: '' },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (!values.current) errors.current = 'Enter your current password';
      if (values.next.length < 8) errors.next = 'Use at least 8 characters';
      else if (!/[0-9]/.test(values.next)) errors.next = 'Include a number';
      if (values.confirm !== values.next) errors.confirm = 'Passwords do not match';
      return errors;
    },
  });

  const strength = passwordStrength(form.values.next);

  const submit = async () => {
    if (!user || saving) return;
    setSaving(true);
    try {
      await changePassword(form.values.current, form.values.next, user.email);
      haptics.success();
      toast.success('Password updated');
      navigation.goBack();
    } catch (error) {
      haptics.error();
      toast.error(error instanceof Error ? error.message : 'Could not update password.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Security" />
      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <Animated.View
          entering={FadeInDown.duration(340)}
          style={{ gap: spacing.md, marginTop: spacing.lg }}
        >
          <Input
            label="Current password"
            icon="lock-closed-outline"
            secure
            value={form.values.current}
            onChangeText={(text) => form.setValue('current', text)}
            onBlur={() => form.blur('current')}
            error={form.visibleError('current')}
          />
          <Input
            label="New password"
            icon="key-outline"
            secure
            value={form.values.next}
            onChangeText={(text) => form.setValue('next', text)}
            onBlur={() => form.blur('next')}
            error={form.visibleError('next')}
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
                        index < strength.score
                          ? strength.score <= 1
                            ? theme.colors.negative
                            : strength.score === 2
                              ? theme.colors.warning
                              : theme.colors.positive
                          : theme.colors.surfaceSunken,
                    },
                  ]}
                />
              ))}
            </View>
            <Text variant="caption" tone="tertiary">
              {form.values.next ? strength.label : 'Use 8+ characters with a number and a symbol.'}
            </Text>
          </View>

          <Input
            label="Confirm new password"
            icon="checkmark-circle-outline"
            secure
            value={form.values.confirm}
            onChangeText={(text) => form.setValue('confirm', text)}
            onBlur={() => form.blur('confirm')}
            error={form.visibleError('confirm')}
          />

          <View
            style={[
              styles.note,
              { backgroundColor: theme.colors.surfaceSunken, borderColor: theme.colors.hairline },
            ]}
          >
            <Ionicons name="shield-checkmark-outline" size={16} color={theme.colors.accent} />
            <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
              Passwords are hashed locally in this demo build. In production this call hits your
              auth provider.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.footer,
          { paddingBottom: insets.bottom + spacing.lg, backgroundColor: theme.colors.background },
        ]}
      >
        <Button
          label="Update password"
          onPress={() => void form.submit(submit)()}
          loading={saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meter: { flexDirection: 'row', gap: 5 },
  segment: { flex: 1, height: 4, borderRadius: 2 },
  note: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    marginTop: spacing.sm,
  },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: spacing.xl },
});
