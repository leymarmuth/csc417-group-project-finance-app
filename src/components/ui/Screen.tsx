import { type ReactNode } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../theme';

export interface ScreenProps {
  children: ReactNode;
  scroll?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  style?: StyleProp<ViewStyle>;
  /** Extra bottom padding so content clears the floating tab bar. */
  bottomInset?: number;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  ambient?: boolean;
}

export function Screen({
  children,
  scroll = true,
  contentContainerStyle,
  style,
  bottomInset = 0,
  refreshControl,
  ambient = true,
}: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }, style]}>
      {ambient ? (
        <LinearGradient
          colors={theme.gradients.ambient as unknown as [string, string, ...string[]]}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
          contentContainerStyle={[
            { paddingBottom: insets.bottom + bottomInset + 32 },
            contentContainerStyle,
          ]}
        >
          {children}
        </ScrollView>
      ) : (
        <View
          style={[{ flex: 1, paddingBottom: insets.bottom + bottomInset }, contentContainerStyle]}
        >
          {children}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
