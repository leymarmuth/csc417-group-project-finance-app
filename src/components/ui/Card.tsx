import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from './PressableScale';
import { radius, spacing, useTheme } from '../../theme';

export interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  /** Padded, hairline-bordered surface (the default). */
  padded?: boolean;
  /** Adds the shared card shadow. */
  elevated?: boolean;
  gradient?: boolean;
  tint?: string;
}

export function Card({
  children,
  style,
  onPress,
  padded = true,
  elevated = false,
  gradient = false,
  tint,
}: CardProps) {
  const theme = useTheme();

  const base: StyleProp<ViewStyle> = [
    {
      borderRadius: radius.xl,
      borderWidth: StyleSheet.hairlineWidth * 2,
      borderColor: theme.colors.hairline,
      backgroundColor: tint ?? theme.colors.surface,
      overflow: 'hidden',
    },
    padded ? { padding: spacing.lg } : null,
    elevated ? theme.elevation.card : null,
    style,
  ];

  if (gradient) {
    return (
      <View style={[base, { backgroundColor: 'transparent' }]}>
        <LinearGradient
          colors={theme.gradients.hero as unknown as [string, string, ...string[]]}
          start={{ x: 0.1, y: 0 }}
          end={{ x: 0.9, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: radius.xl }]}
        />
        {children}
      </View>
    );
  }

  if (onPress) {
    return (
      <PressableScale onPress={onPress} style={base}>
        {children}
      </PressableScale>
    );
  }

  return <View style={base}>{children}</View>;
}
