import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { Input } from '../../components/ui/Input';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { Switch } from '../../components/ui/Switch';
import { Text } from '../../components/ui/Text';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import { parseAmount } from '../../lib/format';
import { haptics } from '../../lib/haptics';
import { useForm } from '../../lib/useForm';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';
import type { AccountKind } from '../../types/models';

const KINDS: { value: AccountKind; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'checking', label: 'Bank', icon: 'wallet-outline' },
  { value: 'savings', label: 'Sacco', icon: 'shield-checkmark-outline' },
  { value: 'card', label: 'Card', icon: 'card-outline' },
  { value: 'cash', label: 'M-Pesa', icon: 'cash-outline' },
  { value: 'investment', label: 'Fund', icon: 'trending-up-outline' },
];

const COLORS = ['#E9C88B', '#6FE3B0', '#8AB0FF', '#C0A6FF', '#FF9C9C', '#F0A868', '#9FE3E3'];

interface FormValues {
  name: string;
  institution: string;
  kind: AccountKind;
  balance: string;
  color: string;
  archived: boolean;
}

export function AccountEditorScreen({ route, navigation }: RootScreenProps<'AccountEditor'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const id = route.params?.id;
  const accounts = useLedgerStore((state) => state.accounts);
  const createAccount = useLedgerStore((state) => state.createAccount);
  const updateAccount = useLedgerStore((state) => state.updateAccount);
  const deleteAccount = useLedgerStore((state) => state.deleteAccount);
  const currency = useSettingsStore((state) => state.currency);

  const existing = useMemo(() => accounts.find((account) => account.id === id), [accounts, id]);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const form = useForm<FormValues>({
    initialValues: {
      name: existing?.name ?? '',
      institution: existing?.institution ?? '',
      kind: existing?.kind ?? 'checking',
      balance: existing ? (existing.balance / 100).toFixed(2) : '',
      color: existing?.color ?? COLORS[0],
      archived: existing?.archived ?? false,
    },
    validate: (values) => {
      const errors: Partial<Record<keyof FormValues, string>> = {};
      if (!values.name.trim()) errors.name = 'Name this account';
      if (parseAmount(values.balance) === null) errors.balance = 'Enter a starting balance';
      return errors;
    },
  });

  const handleSave = async () => {
    if (saving) return;
    const balance = parseAmount(form.values.balance);
    if (balance === null) return;
    setSaving(true);
    try {
      const payload = {
        name: form.values.name.trim(),
        institution: form.values.institution.trim() || 'Manual account',
        kind: form.values.kind,
        balance,
        currency,
        color: form.values.color,
        archived: form.values.archived,
      };
      if (existing) {
        await updateAccount(existing.id, payload);
        toast.success('Account updated');
      } else {
        await createAccount(payload);
        toast.success('Account added');
      }
      haptics.success();
      navigation.goBack();
    } catch (error) {
      haptics.error();
      toast.error(error instanceof Error ? error.message : 'Could not save this account.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.colors.background }]}>
      <ScreenHeader title={existing ? 'Edit account' : 'New account'} />

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 150,
        }}
      >
        <Animated.View entering={FadeInDown.duration(340)} style={{ gap: spacing.md }}>
          <Input
            label="Account name"
            placeholder="Everyday"
            icon="pricetag-outline"
            value={form.values.name}
            onChangeText={(text) => form.setValue('name', text)}
            onBlur={() => form.blur('name')}
            error={form.visibleError('name')}
          />
          <Input
            label="Institution"
            placeholder="Equity Bank Kenya"
            icon="business-outline"
            value={form.values.institution}
            onChangeText={(text) => form.setValue('institution', text)}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).duration(340)}>
          <Text variant="micro" tone="tertiary" style={styles.label}>
            Type
          </Text>
          <View style={styles.kindGrid}>
            {KINDS.map((kind) => {
              const selected = form.values.kind === kind.value;
              return (
                <Pressable
                  key={kind.value}
                  onPress={() => {
                    haptics.select();
                    form.setValue('kind', kind.value);
                  }}
                  style={[
                    styles.kindCell,
                    {
                      borderColor: selected ? form.values.color : theme.colors.hairline,
                      backgroundColor: selected
                        ? `${form.values.color}1F`
                        : theme.colors.surfaceSunken,
                    },
                  ]}
                >
                  <Ionicons
                    name={kind.icon}
                    size={17}
                    color={selected ? form.values.color : theme.colors.textSecondary}
                  />
                  <Text variant="caption" tone={selected ? 'primary' : 'secondary'}>
                    {kind.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140).duration(340)}
          style={{ marginTop: spacing.xl }}
        >
          <Input
            label="Current balance"
            placeholder="0.00"
            icon="cash-outline"
            keyboardType="decimal-pad"
            value={form.values.balance}
            onChangeText={(text) => form.setValue('balance', text)}
            onBlur={() => form.blur('balance')}
            error={form.visibleError('balance')}
            hint="Use a negative number for credit balances."
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(340)}>
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
            entering={FadeInDown.delay(250).duration(340)}
            style={[styles.archiveRow, { borderColor: theme.colors.hairline }]}
          >
            <View style={{ flex: 1 }}>
              <Text variant="label">Archive account</Text>
              <Text variant="caption" tone="tertiary">
                Keeps history but hides it from your balances.
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
          label={existing ? 'Save account' : 'Add account'}
          onPress={() => void form.submit(handleSave)()}
          loading={saving}
        />
        {existing ? (
          <Button label="Delete account" variant="ghost" onPress={() => setConfirmDelete(true)} />
        ) : null}
      </View>

      <ConfirmSheet
        visible={confirmDelete}
        title="Delete this account?"
        description="Accounts with transactions cannot be deleted — move them first."
        confirmLabel="Delete account"
        destructive
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          if (!existing) return;
          void deleteAccount(existing.id)
            .then(() => {
              haptics.warning();
              toast.success('Account deleted');
              navigation.goBack();
            })
            .catch((error: Error) => {
              haptics.error();
              toast.error(error.message);
            });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  label: { marginTop: spacing.xxl, marginBottom: spacing.md },
  kindGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  kindCell: {
    width: '31%',
    alignItems: 'center',
    gap: 6,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
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
