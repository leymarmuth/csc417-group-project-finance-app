import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Sheet } from '../../../components/ui/Sheet';
import { Text } from '../../../components/ui/Text';
import { PROJECT, PROJECT_HIGHLIGHTS } from '../../../constants/project';
import { radius, spacing, useTheme } from '../../../theme';

/**
 * "About this project" — the course-facing surface of the app.
 * Everything rendered here comes from `src/constants/project.ts`.
 */
export function ProjectSheet({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const theme = useTheme();

  const meta = [
    { label: 'Institution', value: PROJECT.institution },
    { label: 'Course unit', value: PROJECT.courseCode },
    { label: 'Course title', value: PROJECT.courseTitle },
    { label: 'Project type', value: `${PROJECT.studyLevel} ${PROJECT.submissionType}` },
    { label: 'Academic year', value: PROJECT.academicYear },
    { label: 'Currency', value: 'Kenyan Shilling (KSh)' },
  ];

  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="About this project"
      description={`${PROJECT.institution} · ${PROJECT.courseCode} ${PROJECT.submissionType}`}
    >
      <View style={{ gap: spacing.xxl }}>
        <Animated.View entering={FadeInDown.duration(320)} style={{ gap: spacing.sm }}>
          <Text variant="display" style={{ letterSpacing: -0.6 }}>
            Aurum
          </Text>
          <Text variant="body" tone="secondary">
            {PROJECT.tagline}
          </Text>
          <Text variant="micro" tone="tertiary" style={{ marginTop: spacing.xs }}>
            {PROJECT.title}
          </Text>
        </Animated.View>

        <View
          style={[
            styles.metaCard,
            { borderColor: theme.colors.hairline, backgroundColor: theme.colors.surfaceSunken },
          ]}
        >
          {meta.map((row, index) => (
            <View
              key={row.label}
              style={[
                styles.metaRow,
                index > 0
                  ? {
                      borderTopWidth: StyleSheet.hairlineWidth,
                      borderTopColor: theme.colors.hairline,
                    }
                  : null,
              ]}
            >
              <Text variant="caption" tone="tertiary" numberOfLines={1} style={{ flexShrink: 0 }}>
                {row.label}
              </Text>
              <Text variant="label" numberOfLines={1} style={{ flexShrink: 1, textAlign: 'right' }}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <View style={{ gap: spacing.md }}>
          <Text variant="micro" tone="tertiary">
            What the app delivers
          </Text>
          <View style={styles.chips}>
            {PROJECT_HIGHLIGHTS.map((item) => (
              <View
                key={item}
                style={[
                  styles.chip,
                  { backgroundColor: theme.colors.accentSoft, borderColor: theme.colors.hairline },
                ]}
              >
                <Ionicons name="checkmark-circle" size={12} color={theme.colors.accent} />
                <Text variant="caption" tone="secondary">
                  {item}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="micro" tone="tertiary">
            Built with
          </Text>
          <Text variant="caption" tone="secondary">
            React Native · Expo SDK 58 · TypeScript · Reanimated 4 · Zustand · react-native-svg ·
            React Navigation
          </Text>
        </View>

        <View
          style={[
            styles.footer,
            { borderColor: theme.colors.hairline, backgroundColor: theme.colors.surfaceSunken },
          ]}
        >
          <Ionicons name="school-outline" size={16} color={theme.colors.accent} />
          <Text variant="caption" tone="secondary" style={{ flex: 1 }}>
            Submitted in partial fulfilment of the requirements of {PROJECT.courseCode},{' '}
            {PROJECT.institution} — {PROJECT.location}.
          </Text>
        </View>
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  metaCard: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: spacing.lg,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
