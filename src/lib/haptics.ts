import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const enabled = Platform.OS === 'ios' || Platform.OS === 'android';

/**
 * Semantic haptics — call sites describe intent, not vibration patterns.
 * Every call is fire-and-forget so it can never block a UI interaction.
 */
export const haptics = {
  tap() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  },
  press() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  },
  heavy() {
    if (enabled) void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  },
  select() {
    if (enabled) void Haptics.selectionAsync();
  },
  success() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  },
  warning() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  },
  error() {
    if (enabled) void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  },
};
