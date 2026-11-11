import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Text } from './Text';
import { initials } from '../../lib/format';
import { fonts, useTheme } from '../../theme';

export function Avatar({
  name,
  size = 44,
  color,
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  const theme = useTheme();
  const seed = color ?? theme.colors.accent;
  return (
    <LinearGradient
      colors={[seed, seed + '66']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.base, { width: size, height: size, borderRadius: size / 2 }]}
    >
      <View style={styles.center}>
        <Text
          style={{
            fontFamily: fonts.bold,
            fontSize: size * 0.36,
            color: theme.scheme === 'dark' ? '#0B0D12' : '#1A1405',
          }}
        >
          {initials(name)}
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
