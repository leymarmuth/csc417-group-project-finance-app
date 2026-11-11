import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { withAlpha } from '../../lib/utils';
import { useTheme } from '../../theme';

export function CategoryIcon({
  icon,
  color,
  size = 42,
  radius,
  filled = false,
}: {
  icon: string;
  color: string;
  size?: number;
  radius?: number;
  filled?: boolean;
}) {
  const theme = useTheme();
  return (
    <View
      style={[
        styles.base,
        {
          width: size,
          height: size,
          borderRadius: radius ?? size * 0.34,
          backgroundColor: filled ? color : withAlpha(color, theme.scheme === 'dark' ? 0.14 : 0.1),
          borderWidth: StyleSheet.hairlineWidth * 2,
          borderColor: filled ? color : withAlpha(color, 0.22),
        },
      ]}
    >
      <Ionicons
        name={icon as keyof typeof Ionicons.glyphMap}
        size={size * 0.44}
        color={filled ? (theme.scheme === 'dark' ? '#0B0D12' : '#FFFFFF') : color}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
