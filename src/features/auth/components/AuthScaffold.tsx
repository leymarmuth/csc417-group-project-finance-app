import { type ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AmbientGlow } from '../../../components/ui/AmbientGlow';
import { IconButton } from '../../../components/ui/IconButton';
import { Text } from '../../../components/ui/Text';
import { spacing, useTheme } from '../../../theme';

export interface AuthScaffoldProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  onBack?: () => void;
  eyebrow?: string;
}

/**
 * Shared shell for every auth screen: ambient wash, soft gold bloom,
 * generous rhythm, and a keyboard-aware scroll body.
 */
export function AuthScaffold({
  title,
  subtitle,
  children,
  footer,
  onBack,
  eyebrow,
}: AuthScaffoldProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <LinearGradient
        colors={theme.gradients.ambient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
      <AmbientGlow
        color={theme.colors.accent}
        size={height * 0.72}
        intensity={0.2}
        style={{ top: -height * 0.2, alignSelf: 'center' }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: spacing.xxl,
            paddingTop: insets.top + spacing.md,
            paddingBottom: insets.bottom + spacing.giant,
            flexGrow: 1,
          }}
        >
          {onBack ? (
            <View style={{ marginBottom: spacing.xxl }}>
              <IconButton name="chevron-back" onPress={onBack} accessibilityLabel="Go back" />
            </View>
          ) : (
            <View style={{ height: spacing.xl }} />
          )}

          {eyebrow ? (
            <Text variant="micro" tone="accent" style={{ marginBottom: spacing.md }}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="display">{title}</Text>
          {subtitle ? (
            <Text variant="body" tone="secondary" style={{ marginTop: spacing.sm, maxWidth: 320 }}>
              {subtitle}
            </Text>
          ) : null}

          <View style={{ marginTop: spacing.xxxl, gap: spacing.lg }}>{children}</View>

          <View style={{ flex: 1 }} />
          {footer ? <View style={{ marginTop: spacing.xxl }}>{footer}</View> : null}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
