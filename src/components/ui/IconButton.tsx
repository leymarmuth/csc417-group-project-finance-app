import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableScale } from './PressableScale';
import { useTheme } from '../../theme';

export interface IconButtonProps {
  name: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  size?: number;
  /** Diameter of the tappable circle. */
  diameter?: number;
  tint?: string;
  background?: string;
  bordered?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel: string;
}

export function IconButton({
  name,
  onPress,
  size = 18,
  diameter = 42,
  tint,
  background,
  bordered = true,
  style,
  accessibilityLabel,
}: IconButtonProps) {
  const theme = useTheme();
  return (
    <PressableScale
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      activeScale={0.9}
      style={[
        styles.base,
        {
          width: diameter,
          height: diameter,
          borderRadius: diameter / 2,
          backgroundColor: background ?? theme.colors.surface,
          borderWidth: bordered ? StyleSheet.hairlineWidth * 2 : 0,
          borderColor: theme.colors.hairline,
        },
        style,
      ]}
    >
      <View pointerEvents="none">
        <Ionicons name={name} size={size} color={tint ?? theme.colors.text} />
      </View>
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
