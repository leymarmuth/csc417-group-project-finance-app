import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '../../components/ui/Card';
import { EmptyState } from '../../components/ui/EmptyState';
import { Fab } from '../../components/ui/Fab';
import { IconButton } from '../../components/ui/IconButton';
import { PressableScale } from '../../components/ui/PressableScale';
import { ProgressRing } from '../../components/ui/ProgressRing';
import { Screen } from '../../components/ui/Screen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Text } from '../../components/ui/Text';
import { CategoryIcon } from '../../components/finance/CategoryIcon';
import { MoneyDisplay } from '../../components/finance/MoneyDisplay';
import { ContributeSheet } from './components/ContributeSheet';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import { goalProgress } from '../../store/selectors';
import { formatMoney, formatPercent } from '../../lib/format';
import { formatDateLabel } from '../../lib/date';
import { haptics } from '../../lib/haptics';
import { radius, spacing, useTheme } from '../../theme';
import type { TabScreenProps } from '../../navigation/types';
import type { Goal } from '../../types/models';

export function GoalsScreen({ navigation }: TabScreenProps<'Goals'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const goals = useLedgerStore((state) => state.goals);
  const contributeToGoal = useLedgerStore((state) => state.contributeToGoal);
  const currency = useSettingsStore((state) => state.currency);
  const [contributeTo, setContributeTo] = useState<Goal | null>(null);
  // Pinned once: keeps render pure and stops countdowns jittering mid-frame.
  const [now] = useState(() => Date.now());

  const active = useMemo(() => goals.filter((goal) => !goal.archived), [goals]);
  const completed = useMemo(
    () => goals.filter((goal) => goal.archived || goal.saved >= goal.target),
    [goals],
  );

  const totalSaved = active.reduce((acc, goal) => acc + goal.saved, 0);
  const totalTarget = active.reduce((acc, goal) => acc + goal.target, 0);
  const overall = totalTarget ? totalSaved / totalTarget : 0;

  const daysTo = (goal: Goal) => {
    if (!goal.deadline) return null;
    const days = Math.ceil((new Date(goal.deadline).getTime() - now) / 86_400_000);
    return days;
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen scroll contentContainerStyle={{ paddingBottom: 160 }} bottomInset={insets.bottom}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
          <View style={{ flex: 1 }}>
            <Text variant="title">Goals</Text>
            <Text variant="caption" tone="tertiary" style={{ marginTop: 2 }}>
              {active.length} in motion · {completed.length} complete
            </Text>
          </View>
          <IconButton
            name="add"
            onPress={() => navigation.navigate('GoalEditor')}
            accessibilityLabel="New goal"
          />
        </View>

        {active.length > 0 ? (
          <View style={styles.section}>
            <Card>
              <View style={styles.summary}>
                <ProgressRing progress={overall} size={84} strokeWidth={8} delay={120}>
                  <Text variant="label" tabular>
                    {formatPercent(overall, 0)}
                  </Text>
                </ProgressRing>
                <View style={{ flex: 1, gap: 4 }}>
                  <Text variant="micro" tone="tertiary">
                    Saved toward goals
                  </Text>
                  <MoneyDisplay amount={totalSaved} currency={currency} size="display" />
                  <Text variant="caption" tone="tertiary">
                    {formatMoney(Math.max(totalTarget - totalSaved, 0), { currency })} to go
                  </Text>
                </View>
              </View>
            </Card>
          </View>
        ) : null}

        <View style={styles.section}>
          <SectionHeader title="Active" />
          {active.length === 0 ? (
            <EmptyState
              icon="flag-outline"
              title="No goals yet"
              description="Name something worth saving for, set a target, and watch it fill."
              actionLabel="Create a goal"
              onAction={() => navigation.navigate('GoalEditor')}
            />
          ) : (
            <View style={{ gap: spacing.md }}>
              {active.map((goal, index) => {
                const progress = goalProgress(goal);
                const days = daysTo(goal);
                return (
                  <Animated.View
                    key={goal.id}
                    entering={FadeInDown.delay(index * 70)
                      .springify()
                      .damping(20)}
                    layout={Layout.springify().damping(22)}
                  >
                    <PressableScale
                      onPress={() => navigation.navigate('GoalEditor', { id: goal.id })}
                      haptic={false}
                      activeScale={0.99}
                    >
                      <View
                        style={[
                          styles.goalCard,
                          {
                            backgroundColor: theme.colors.surface,
                            borderColor: theme.colors.hairline,
                          },
                        ]}
                      >
                        <View style={styles.goalTop}>
                          <CategoryIcon icon={goal.icon} color={goal.color} size={42} />
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text variant="bodyStrong" numberOfLines={1}>
                              {goal.name}
                            </Text>
                            <Text variant="caption" tone="tertiary">
                              {formatMoney(goal.saved, { currency })} of{' '}
                              {formatMoney(goal.target, { currency })}
                            </Text>
                          </View>
                          <Text variant="subheading" tabular style={{ color: goal.color }}>
                            {formatPercent(progress, 0)}
                          </Text>
                        </View>

                        <View
                          style={[styles.track, { backgroundColor: theme.colors.surfaceSunken }]}
                        >
                          <Animated.View
                            style={{
                              width: `${Math.max(progress, 0.015) * 100}%`,
                              height: '100%',
                              borderRadius: 4,
                              backgroundColor: goal.color,
                            }}
                          />
                        </View>

                        <View style={styles.goalBottom}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                            <Ionicons
                              name={days === null ? 'infinite-outline' : 'calendar-outline'}
                              size={12}
                              color={theme.colors.textTertiary}
                            />
                            <Text variant="caption" tone="tertiary">
                              {days === null
                                ? 'No deadline'
                                : days < 0
                                  ? 'Past due'
                                  : `${days} days left · ${formatDateLabel(goal.deadline!)}`}
                            </Text>
                          </View>
                          <PressableScale
                            onPress={() => {
                              haptics.tap();
                              setContributeTo(goal);
                            }}
                            activeScale={0.94}
                            style={[
                              styles.addFunds,
                              {
                                backgroundColor: `${goal.color}22`,
                                borderColor: `${goal.color}55`,
                              },
                            ]}
                          >
                            <Ionicons name="add" size={13} color={goal.color} />
                            <Text variant="caption" style={{ color: goal.color }}>
                              Add funds
                            </Text>
                          </PressableScale>
                        </View>
                      </View>
                    </PressableScale>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>

        {completed.length > 0 ? (
          <View style={styles.section}>
            <SectionHeader title="Achieved" />
            <View style={{ gap: spacing.sm }}>
              {completed.map((goal) => (
                <PressableScale
                  key={goal.id}
                  onPress={() => navigation.navigate('GoalEditor', { id: goal.id })}
                  haptic={false}
                  style={[
                    styles.doneRow,
                    { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
                  ]}
                >
                  <View style={[styles.doneIcon, { backgroundColor: theme.colors.positiveSoft }]}>
                    <Ionicons name="checkmark" size={15} color={theme.colors.positive} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{goal.name}</Text>
                    <Text variant="caption" tone="tertiary">
                      {formatMoney(goal.target, { currency })} funded
                    </Text>
                  </View>
                  <Text variant="caption" tone="tertiary">
                    View
                  </Text>
                  <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                </PressableScale>
              ))}
            </View>
          </View>
        ) : null}
      </Screen>

      <Fab
        onPress={() => navigation.navigate('GoalEditor')}
        icon="flag-outline"
        extended
        label="Goal"
      />

      <ContributeSheet
        visible={Boolean(contributeTo)}
        goal={contributeTo}
        currency={currency}
        onClose={() => setContributeTo(null)}
        onContribute={async (amount) => {
          if (!contributeTo) return;
          await contributeToGoal(contributeTo.id, amount);
          toast.success('Goal updated', {
            description: `Added ${formatMoney(amount, { currency })} to ${contributeTo.name}`,
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
  },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.lg },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
  goalCard: {
    padding: spacing.lg,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth * 2,
    gap: spacing.md,
  },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  track: { height: 6, borderRadius: 4, overflow: 'hidden' },
  goalBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  addFunds: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  doneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  doneIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
