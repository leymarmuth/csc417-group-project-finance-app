import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Switch } from '../../components/ui/Switch';
import { Text } from '../../components/ui/Text';
import { CategoryIcon } from '../../components/finance/CategoryIcon';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import { formatMoney, parseAmount } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';

const ICONS = [
  'airplane-outline',
  'home-outline',
  'shield-checkmark-outline',
  'car-sport-outline',
  'school-outline',
  'heart-outline',
  'gift-outline',
  'business-outline',
  'laptop-outline',
  'paw-outline',
  'musical-notes-outline',
  'bicycle-outline',
];

const COLORS = [
  '#E9C88B',
  '#6FE3B0',
  '#8AB0FF',
  '#C0A6FF',
  '#FF9C9C',
  '#F0A868',
  '#9FE3E3',
  '#F3C8E0',
];

interface FormValues {
  name: string;
  target: string;
  saved: string;
  deadline: string | null;
  icon: string;
  color: string;
  archived: boolean;
}

export function GoalEditorScreen({ route, navigation }: RootScreenProps<'GoalEditor'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id;
  const goals = useLedgerStore((state) => state.goals);
  const createGoal = useLedgerStore((state) => state.createGoal);
  const updateGoal = useLedgerStore((state) => state.updateGoal);
  const deleteGoal = useLedgerStore((state) => state.deleteGoal);
  const currency = useSettingsStore((state) => state.currency);

  const existing = useMemo(() => goals.find((goal) => goal.id === id), [goals, id]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: existing?.name ?? '',
      target: existing ? (existing.target / 100).toFixed(0) : '',
      saved: existing ? (existing.saved / 100).toFixed(0) : '0',
      deadline: existing?.deadline ?? null,
      icon: existing?.icon ?? ICONS[0],
      color: existing?.color ?? COLORS[0],
      archived: existing?.archived ?? false,
    },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (!values.name.trim()) errors.name = 'Give your goal a name';
      const target = parseAmount(values.target);
      if (target === null || target <= 0) errors.target = 'Set a target above zero';
      const saved = parseAmount(values.saved);
      if (saved === null || saved < 0) errors.saved = 'Enter what you have so far';
      return errors;
    },
  });

  const deadlineOptions = useMemo(() => {
    const now = new Date();
    const make = (months: number) => {
      const date = new Date(now.getFullYear(), now.getMonth() + months, 1);
      return date.toISOString();
    };
    return [
      { label: 'No deadline', value: null as string | null },
      { label: '3 months', value: make(3) },
      { label: '6 months', value: make(6) },
      { label: '1 year', value: make(12) },
      { label: '2 years', value: make(24) },
    ];
  }, []);

  const targetMinor = parseAmount(form.values.target) ?? 0;
  const savedMinor = parseAmount(form.values.saved) ?? 0;
  const progress = targetMinor > 0 ? Math.min(savedMinor / targetMinor, 1) : 0;

  const handleSave = async () => {
    if (saving) return;
    setSaving(true);
    try {
      const payload = {
        name: form.values.name.trim(),
        target: targetMinor,
        saved: savedMinor,
        deadline: form.values.deadline,
        icon: form.values.icon,
        color: form.values.color,
        archived: form.values.archived,
      };
      if (existing) {
        await updateGoal(existing.id, payload);
        toast.success('Goal updated');
      } else {
        await createGoal(payload);
        toast.success('Goal created', { description: 'Small steps, compounding.' });
      }
      haptics.success();
      navigation.goBack();
    } catch (error) {
      haptics.error();
      toast.error(error instanceof Error ? error.message : 'Could not save your goal.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={existing ? 'Edit goal' : 'New goal'} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 150,
        }}
      >
        <Animated.View entering={FadeInDown.duration(340)} style={styles.preview}>
          <CategoryIcon
            icon={form.values.icon}
            color={form.values.color}
            size={64}
            radius={22}
            filled
          />
          <Text variant="heading" align="center" numberOfLines={2}>
            {form.values.name || 'Your next goal'}
          </Text>
          <Text variant="caption" tone="tertiary">
            {formatMoney(savedMinor, { currency })} of {formatMoney(targetMinor, { currency })} ·{' '}
            {Math.round(progress * 100)}%
          </Text>
          <View style={[styles.track, { backgroundColor: theme.colors.surfaceSunken }]}>
            <View
              style={{
                width: `${Math.max(progress, 0.02) * 100}%`,
                height: '100%',
                borderRadius: 4,
                backgroundColor: form.values.color,
              }}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(70).duration(340)} style={{ gap: spacing.md }}>
          <Input
            label="Goal name"
            placeholder="e.g. Japan, spring"
            icon="flag-outline"
            value={form.values.name}
            onChangeText={(text) => form.setValue('name', text)}
            onBlur={() => form.blur('name')}
            error={form.visibleError('name')}
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Input
                label="Target"
                placeholder="0"
                keyboardType="decimal-pad"
                value={form.values.target}
                onChangeText={(text) => form.setValue('target', text)}
                onBlur={() => form.blur('target')}
                error={form.visibleError('target')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Input
                label="Saved so far"
                placeholder="0"
                keyboardType="decimal-pad"
                value={form.values.saved}
                onChangeText={(text) => form.setValue('saved', text)}
                onBlur={() => form.blur('saved')}
                error={form.visibleError('saved')}
              />
            </View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(130).duration(340)}>
          <Text variant="micro" tone="tertiary" style={styles.label}>
            Deadline
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {deadlineOptions.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                selected={
                  option.value === form.values.deadline ||
                  (option.value !== null &&
                    form.values.deadline !== null &&
                    new Date(option.value).toDateString() ===
                      new Date(form.values.deadline).toDateString())
                }
                onPress={() => form.setValue('deadline', option.value)}
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180).duration(340)}>
          <Text variant="micro" tone="tertiary" style={styles.label}>
            Icon
          </Text>
          <View style={styles.iconGrid}>
            {ICONS.map((icon) => {
              const selected = form.values.icon === icon;
              return (
                <Pressable
                  key={icon}
                  onPress={() => {
                    haptics.select();
                    form.setValue('icon', icon);
                  }}
                  style={[
                    styles.iconCell,
                    {
                      borderColor: selected ? form.values.color : theme.colors.hairline,
                      backgroundColor: selected
                        ? `${form.values.color}1F`
                        : theme.colors.surfaceSunken,
                    },
                  ]}
                >
                  <Ionicons
                    name={icon as keyof typeof Ionicons.glyphMap}
                    size={19}
                    color={selected ? form.values.color : theme.colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(230).duration(340)}>
          <Text variant="micro" tone="tertiary" style={styles.label}>
            Colour
          </Text>
          <View style={styles.colorRow}>
            {COLORS.map((color) => {
              const selected = form.values.color === color;
              return (
                <Pressable
                  key={color}
                  onPress={() => {
                    haptics.select();
                    form.setValue('color', color);
                  }}
                  style={[
                    styles.swatch,
                    {
                      backgroundColor: color,
                      borderColor: selected ? theme.colors.text : 'transparent',
                    },
                  ]}
                >
                  {selected ? <Ionicons name="checkmark" size={14} color="#0B0D12" /> : null}
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        {existing ? (
          <Animated.View
            entering={FadeInDown.delay(280).duration(340)}
            style={[styles.archiveRow, { borderColor: theme.colors.hairline }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="label">Archive goal</Text>
              <Text variant="caption" tone="tertiary">
                Hide it from the active list without losing progress.
              </Text>
            </View>
            <Switch
              value={form.values.archived}
              onChange={(value) => form.setValue('archived', value)}
            />
          </Animated.View>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing.lg,
            backgroundColor: theme.colors.background,
            borderTopColor: theme.colors.hairline,
          },
        ]}
      >
        <Button
          label={existing ? 'Save goal' : 'Create goal'}
          onPress={() => void form.submit(handleSave)()}
          loading={saving}
        />
        {existing ? (
          <Button label="Delete goal" variant="ghost" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </View>

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this goal?"
        description="This removes the goal and its progress. It cannot be undone."
        confirmLabel="Delete goal"
        destructive
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          void deleteGoal(existing.id).then(() => {
            haptics.warning();
            toast.show('Goal deleted', {
              action: {
                label: 'Undo',
                onPress: () => void createGoal({ ...existing }),
              },
            });
            navigation.goBack();
          });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  preview: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.xl },
  track: {
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
    alignSelf: 'stretch',
    marginTop: spacing.sm,
  },
  label: { marginTop: spacing.xxl, marginBottom: spacing.md },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  iconCell: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  swatch: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  archiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xxl,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
