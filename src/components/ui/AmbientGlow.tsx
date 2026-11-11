import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { withAlpha } from '../../lib/utils';

/**
 * Soft radial bloom. A real gradient — not a translucent circle — so the edge
 * is invisible at any size, in either theme.
 */
export function AmbientGlow({
  color,
  size = 320,
  intensity = 0.22,
  style,
}: {
  color: string;
  size?: number;
  intensity?: number;
  style?: StyleProp<ViewStyle>;
}) {
  const radius = size / 2;
  return (
    <View pointerEvents="none" style={[styles.root, { width: size, height: size }, style]}>
      <Svg width={size} height={size}>
        <Defs>
          <RadialGradient id="ambient" cx="50%" cy="50%" r="50%">
            <Stop offset="0" stopColor={color} stopOpacity={intensity} />
            <Stop offset="0.45" stopColor={color} stopOpacity={intensity * 0.45} />
            <Stop offset="1" stopColor={withAlpha(color, 0)} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={radius} cy={radius} r={radius} fill="url(#ambient)" />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { position: 'absolute' },
});
