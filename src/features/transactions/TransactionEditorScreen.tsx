import { useEffect, useMemo, useState } from 'react';
import { Platform, ScrollView, StyleSheet, TextInput, View, type TextStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';
import { Button } from '../../components/ui/Button';
import { Chip } from '../../components/ui/Chip';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Text } from '../../components/ui/Text';
import { CategoryPicker } from './components/CategoryPicker';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import { CURRENCY_META, formatMoney, parseAmount } from '../../lib/format';
import { formatDateLabel } from '../../lib/date';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { fonts, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';
import type { TransactionKind } from '../../types/models';

interface FormValues {
  amount: string;
  kind: TransactionKind;
  merchant: string;
  note: string;
  categoryId: string;
  accountId: string;
  date: string;
}

const startOfToday = () => {
  const date = new Date();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
};

export function TransactionEditorScreen({
  route,
  navigation,
}: RootScreenProps<'TransactionEditor'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const editingId = route.params?.id;

  const transactions = useLedgerStore((state) => state.transactions);
  const categories = useLedgerStore((state) => state.categories);
  const accounts = useLedgerStore((state) => state.accounts);
  const createTransaction = useLedgerStore((state) => state.createTransaction);
  const updateTransaction = useLedgerStore((state) => state.updateTransaction);
  const deleteTransaction = useLedgerStore((state) => state.deleteTransaction);
  const currency = useSettingsStore((state) => state.currency);

  const existing = useMemo(
    () => transactions.find((transaction) => transaction.id === editingId),
    [editingId, transactions],
  );
  const isEditing = Boolean(existing);

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      amount: existing ? (existing.amount / 100).toFixed(2) : '',
      kind: existing?.kind ?? route.params?.kind ?? 'expense',
      merchant: existing?.merchant ?? '',
      note: existing?.note ?? '',
      categoryId: existing?.categoryId ?? '',
      accountId: existing?.accountId ?? accounts[0]?.id ?? '',
      date: existing?.date ?? startOfToday(),
    },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (parseAmount(values.amount) === null) errors.amount = 'Enter an amount';
      if (!values.categoryId) errors.categoryId = 'Pick a category';
      if (!values.accountId) errors.accountId = 'Pick an account';
      if (values.merchant.trim().length > 60) errors.merchant = 'Keep it under 60 characters';
      return errors;
    },
  });

  const visibleCategories = useMemo(
    () => categories.filter((category) => category.kind === form.values.kind),
    [categories, form.values.kind],
  );

  /** Keep the selected category consistent with direction. */
  useEffect(() => {
    const stillValid = visibleCategories.some((c) => c.id === form.values.categoryId);
    if (!stillValid) {
      form.setValue('categoryId', visibleCategories[0]?.id ?? '');
    }
  }, [form, visibleCategories]);

  /** Accounts can arrive slightly after the first render. */
  useEffect(() => {
    if (!form.values.accountId && accounts[0]) form.setValue('accountId', accounts[0].id);
  }, [accounts, form]);

  const selectedCategory = categories.find((category) => category.id === form.values.categoryId);
  const accent = form.values.kind === 'income' ? theme.colors.positive : theme.colors.accent;

  const dateOptions = useMemo(() => {
    const base = Array.from({ length: 7 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - index);
      return date;
    });
    if (existing) {
      const existingDate = new Date(existing.date);
      if (!base.some((date) => date.toDateString() === existingDate.toDateString())) {
        base.push(existingDate);
      }
    }
    return base;
  }, [existing]);

  const handleSave = async () => {
    const minor = parseAmount(form.values.amount);
    if (minor === null || saving) return;
    setSaving(true);
    try {
      const payload = {
        amount: minor,
        kind: form.values.kind,
        categoryId: form.values.categoryId,
        accountId: form.values.accountId,
        merchant: form.values.merchant.trim() || selectedCategory?.name || 'Transaction',
        note: form.values.note.trim(),
        date: form.values.date,
      };
      if (existing) {
        await updateTransaction(existing.id, payload);
        haptics.success();
        toast.success('Transaction updated');
      } else {
        await createTransaction(payload);
        haptics.success();
        toast.success('Transaction recorded', {
          description: formatMoney(minor, { currency }),
        });
      }
      navigation.goBack();
    } catch (error) {
      haptics.error();
      toast.error(error instanceof Error ? error.message : 'Could not save that transaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader
        title={isEditing ? 'Edit transaction' : 'New transaction'}
        right={
          isEditing ? (
            <Button
              label="Delete"
              variant="ghost"
              size="sm"
              fullWidth={false}
              onPress={() => setConfirmDelete(true)}
            />
          ) : undefined
        }
      />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 140,
        }}
      >
        <Animated.View entering={FadeInDown.duration(360)} style={styles.amountBlock}>
          <View style={{ alignSelf: 'stretch' }}>
            <SegmentedControl
              value={form.values.kind}
              onChange={(kind) => {
                form.setValue('kind', kind);
                haptics.select();
              }}
              options={[
                { value: 'expense', label: 'Expense' },
                { value: 'income', label: 'Income' },
              ]}
            />
          </View>

          <View style={styles.amountRow}>
            <Text style={[styles.symbol, { color: accent }]}>{CURRENCY_META[currency].symbol}</Text>
            <TextInput
              value={form.values.amount}
              onChangeText={(text) => form.setValue('amount', text)}
              placeholder="0.00"
              placeholderTextColor={theme.colors.textTertiary}
              keyboardType="decimal-pad"
              autoFocus={!isEditing}
              selectionColor={accent}
              style={[
                styles.amountInput,
                { color: form.values.amount ? accent : theme.colors.text },
                Platform.OS === 'web' ? (styles.webReset as TextStyle) : null,
              ]}
            />
          </View>
          {form.visibleError('amount') ? (
            <Text variant="caption" tone="negative" align="center">
              {form.visibleError('amount')}
            </Text>
          ) : (
            <Text variant="caption" tone="tertiary" align="center">
              {selectedCategory
                ? `${selectedCategory.name} · ${form.values.kind}`
                : 'Tap a category below'}
            </Text>
          )}
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(360)}>
          <Text variant="micro" tone="tertiary" style={styles.blockLabel}>
            Category
          </Text>
          <CategoryPicker
            categories={visibleCategories}
            selectedId={form.values.categoryId}
            onSelect={(category) => form.setValue('categoryId', category.id)}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(140).duration(360)}>
          <Text variant="micro" tone="tertiary" style={styles.blockLabel}>
            Details
          </Text>
          <View style={{ gap: spacing.md }}>
            <Input
              label="Merchant"
              placeholder="Where did it happen?"
              icon="storefront-outline"
              value={form.values.merchant}
              onChangeText={(text) => form.setValue('merchant', text)}
              onBlur={() => form.blur('merchant')}
              error={form.visibleError('merchant')}
              returnKeyType="next"
            />
            <Input
              label="Note"
              placeholder="Optional context"
              icon="create-outline"
              value={form.values.note}
              onChangeText={(text) => form.setValue('note', text)}
              returnKeyType="done"
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(360)}>
          <Text variant="micro" tone="tertiary" style={styles.blockLabel}>
            Account
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {accounts.map((account) => (
              <Chip
                key={account.id}
                label={account.name}
                color={account.color}
                selected={form.values.accountId === account.id}
                onPress={() => form.setValue('accountId', account.id)}
                icon="wallet-outline"
              />
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(260).duration(360)}>
          <Text variant="micro" tone="tertiary" style={styles.blockLabel}>
            Date
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: spacing.sm }}
          >
            {dateOptions.map((date) => {
              const iso = date.toISOString();
              const selected = new Date(form.values.date).toDateString() === date.toDateString();
              return (
                <Chip
                  key={iso}
                  label={formatDateLabel(iso)}
                  selected={selected}
                  onPress={() => form.setValue('date', iso)}
                />
              );
            })}
          </ScrollView>
        </Animated.View>

        {isEditing ? (
          <Animated.View entering={FadeIn.delay(300)} style={styles.metaRow}>
            <Ionicons name="time-outline" size={13} color={theme.colors.textTertiary} />
            <Text variant="caption" tone="tertiary">
              Created {new Date(existing!.createdAt).toLocaleString()}
            </Text>
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
          label={isEditing ? 'Save changes' : 'Record transaction'}
          onPress={() => void form.submit(handleSave)()}
          loading={saving}
          disabled={!form.values.amount}
          icon={isEditing ? 'checkmark' : 'add'}
        />
      </View>

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this transaction?"
        description="The amount will be returned to its account balance."
        confirmLabel="Delete"
        destructive
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          const snapshot = existing;
          void deleteTransaction(existing.id).then(() => {
            haptics.warning();
            toast.show('Transaction deleted', {
              description: snapshot.merchant,
              action: {
                label: 'Undo',
                onPress: () => void useLedgerStore.getState().restoreTransaction(snapshot),
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
  amountBlock: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xl },
  amountRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  symbol: {
    fontFamily: fonts.semibold,
    fontSize: 26,
    marginRight: 2,
    marginTop: 8,
    opacity: 0.8,
  },
  amountInput: {
    fontFamily: fonts.bold,
    fontSize: 54,
    letterSpacing: -1.6,
    textAlign: 'center',
    minWidth: 120,
    maxWidth: 300,
    padding: 0,
  },
  blockLabel: { marginTop: spacing.xl, marginBottom: spacing.md },
  webReset: { outlineStyle: 'none' } as unknown as TextStyle,
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.xl,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
