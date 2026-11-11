import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { CategoryIcon } from '../../components/finance/CategoryIcon';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { EmptyState } from '../../components/ui/EmptyState';
import { IconButton } from '../../components/ui/IconButton';
import { Input } from '../../components/ui/Input';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Sheet } from '../../components/ui/Sheet';
import { Text } from '../../components/ui/Text';
import { useLedgerStore } from '../../store/useLedgerStore';
import { toast } from '../../store/useToastStore';
import { formatMoney } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { useSettingsStore } from '../../store/useSettingsStore';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';
import type { Category, TransactionKind } from '../../types/models';

const ICONS = [
  'cart-outline',
  'restaurant-outline',
  'car-outline',
  'home-outline',
  'flash-outline',
  'fitness-outline',
  'bag-handle-outline',
  'film-outline',
  'airplane-outline',
  'cafe-outline',
  'repeat-outline',
  'briefcase-outline',
  'laptop-outline',
  'trending-up-outline',
  'gift-outline',
  'paw-outline',
  'school-outline',
  'medical-outline',
];

const COLORS = [
  '#7FD3A8',
  '#F0A868',
  '#8AB0FF',
  '#C0A6FF',
  '#FFD37A',
  '#FF9C9C',
  '#F3C8E0',
  '#9FE3E3',
  '#A6C8FF',
  '#D9B48F',
];

export function CategoriesScreen({ navigation }: RootScreenProps<'Categories'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [kind, setKind] = useState<TransactionKind>('expense');
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS[0]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const categories = useLedgerStore((state) => state.categories);
  const transactions = useLedgerStore((state) => state.transactions);
  const budgets = useLedgerStore((state) => state.budgets);
  const createCategory = useLedgerStore((state) => state.createCategory);
  const updateCategory = useLedgerStore((state) => state.updateCategory);
  const deleteCategory = useLedgerStore((state) => state.deleteCategory);
  const currency = useSettingsStore((state) => state.currency);

  const usage = useMemo(() => {
    const totals = new Map<string, { count: number; amount: number }>();
    for (const tx of transactions) {
      const entry = totals.get(tx.categoryId) ?? { count: 0, amount: 0 };
      entry.count += 1;
      entry.amount += tx.amount;
      totals.set(tx.categoryId, entry);
    }
    return totals;
  }, [transactions]);

  const visible = useMemo(
    () => categories.filter((category) => category.kind === kind),
    [categories, kind],
  );

  const openCreate = () => {
    setEditing(null);
    setName('');
    setIcon(ICONS[0]);
    setColor(COLORS[0]);
    setError(null);
    setSheetOpen(true);
  };

  const openEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setIcon(category.icon);
    setColor(category.color);
    setError(null);
    setSheetOpen(true);
  };

  const save = async () => {
    if (!name.trim()) {
      setError('Give it a name.');
      haptics.warning();
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await updateCategory(editing.id, { name: name.trim(), icon, color });
        toast.success('Category updated');
      } else {
        await createCategory({ name: name.trim(), icon, color, kind });
        toast.success('Category created');
      }
      haptics.success();
      setSheetOpen(false);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save.');
      haptics.error();
    } finally {
      setSaving(false);
    }
  };

  const deleteSelected = () => {
    if (!editing) return;
    void deleteCategory(editing.id)
      .then(() => {
        haptics.warning();
        toast.success('Category deleted');
        setSheetOpen(false);
      })
      .catch((deleteError: Error) => {
        haptics.error();
        toast.error(deleteError.message);
        setSheetOpen(false);
      });
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        scroll
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        bottomInset={insets.bottom}
      >
        <ScreenHeader
          title="Categories"
          right={<IconButton name="add" onPress={openCreate} accessibilityLabel="New category" />}
        />

        <View style={{ paddingHorizontal: spacing.xl }}>
          <SegmentedControl
            value={kind}
            onChange={setKind}
            options={[
              { value: 'expense', label: 'Expenses' },
              { value: 'income', label: 'Income' },
            ]}
          />
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xl, gap: spacing.sm }}>
          {visible.length === 0 ? (
            <EmptyState
              icon="pricetags-outline"
              title="No categories"
              description="Create one to start organising your money."
              actionLabel="New category"
              onAction={openCreate}
            />
          ) : (
            visible.map((category, index) => {
              const stat = usage.get(category.id);
              const hasBudget = budgets.some((budget) => budget.categoryId === category.id);
              return (
                <Animated.View
                  key={category.id}
                  entering={FadeInDown.delay(index * 45)
                    .springify()
                    .damping(20)}
                  layout={Layout.springify().damping(22)}
                >
                  <Pressable
                    onPress={() => openEdit(category)}
                    style={[
                      styles.row,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
                    ]}
                  >
                    <CategoryIcon icon={category.icon} color={category.color} />
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="label">{category.name}</Text>
                      <Text variant="caption" tone="tertiary">
                        {stat
                          ? `${stat.count} entries · ${formatMoney(stat.amount, { currency, compactCents: true })}`
                          : 'Unused'}
                        {hasBudget ? ' · budgeted' : ''}
                      </Text>
                    </View>
                    <Ionicons name="chevron-forward" size={14} color={theme.colors.textTertiary} />
                  </Pressable>
                </Animated.View>
              );
            })
          )}
        </View>
      </Screen>

      <Sheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={editing ? 'Edit category' : 'New category'}
        description={
          editing
            ? `${usage.get(editing.id)?.count ?? 0} transactions use this category.`
            : `It will appear under ${kind}.`
        }
        footer={
          <View style={{ gap: spacing.sm }}>
            <Button
              label={editing ? 'Save category' : 'Create category'}
              onPress={() => void save()}
              loading={saving}
            />
            {editing ? (
              <Button
                label="Delete category"
                variant="danger"
                onPress={() => setConfirmDelete(true)}
              />
            ) : null}
          </View>
        }
      >
        <View style={{ gap: spacing.xl }}>
          <View style={styles.previewRow}>
            <CategoryIcon icon={icon} color={color} size={52} radius={18} filled />
            <View style={{ flex: 1 }}>
              <Input
                placeholder="Category name"
                value={name}
                onChangeText={setName}
                error={error ?? undefined}
                maxLength={26}
              />
            </View>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text variant="micro" tone="tertiary">
              Icon
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: spacing.sm }}
            >
              {ICONS.map((option) => {
                const selected = option === icon;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      haptics.select();
                      setIcon(option);
                    }}
                    style={[
                      styles.iconCell,
                      {
                        borderColor: selected ? color : theme.colors.hairline,
                        backgroundColor: selected ? `${color}1F` : theme.colors.surfaceSunken,
                      },
                    ]}
                  >
                    <Ionicons
                      name={option as keyof typeof Ionicons.glyphMap}
                      size={18}
                      color={selected ? color : theme.colors.textSecondary}
                    />
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          <View style={{ gap: spacing.md }}>
            <Text variant="micro" tone="tertiary">
              Colour
            </Text>
            <View style={styles.colorRow}>
              {COLORS.map((option) => {
                const selected = option === color;
                return (
                  <Pressable
                    key={option}
                    onPress={() => {
                      haptics.select();
                      setColor(option);
                    }}
                    style={[
                      styles.swatch,
                      {
                        backgroundColor: option,
                        borderColor: selected ? theme.colors.text : 'transparent',
                      },
                    ]}
                  >
                    {selected ? <Ionicons name="checkmark" size={13} color="#0B0D12" /> : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      </Sheet>

      <ConfirmSheet
        visible={confirmDelete}
        title={`Delete ${editing?.name ?? 'category'}?`}
        description="Categories with transactions or budgets cannot be removed."
        confirmLabel="Delete"
        destructive
        onClose={() => setConfirmDelete(false)}
        onConfirm={deleteSelected}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  previewRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCell: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
