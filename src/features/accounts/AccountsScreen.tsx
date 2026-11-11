import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown, Layout } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Card } from '../../components/ui/Card';
import { IconButton } from '../../components/ui/IconButton';
import { PressableScale } from '../../components/ui/PressableScale';
import { Screen } from '../../components/ui/Screen';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Text } from '../../components/ui/Text';
import { MoneyDisplay } from '../../components/finance/MoneyDisplay';
import { useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { sortTransactionsDesc, totalBalance } from '../../store/selectors';
import { formatMoney } from '../../lib/format';
import { relativeTime } from '../../lib/date';
import { withAlpha } from '../../lib/utils';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';
import type { Account } from '../../types/models';

const kindMeta: Record<Account['kind'], { label: string; icon: keyof typeof Ionicons.glyphMap }> = {
  checking: { label: 'Bank', icon: 'wallet-outline' },
  savings: { label: 'Sacco', icon: 'shield-checkmark-outline' },
  card: { label: 'Credit card', icon: 'card-outline' },
  cash: { label: 'Mobile / Cash', icon: 'cash-outline' },
  investment: { label: 'Money market', icon: 'trending-up-outline' },
};

export function AccountsScreen({ navigation }: RootScreenProps<'Accounts'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const accounts = useLedgerStore((state) => state.accounts);
  const transactions = useLedgerStore((state) => state.transactions);
  const currency = useSettingsStore((state) => state.currency);

  const active = useMemo(() => accounts.filter((account) => !account.archived), [accounts]);
  const archived = useMemo(() => accounts.filter((account) => account.archived), [accounts]);
  const total = useMemo(() => totalBalance(accounts), [accounts]);

  const lastTouched = (accountId: string) => {
    const match = sortTransactionsDesc(transactions).find((tx) => tx.accountId === accountId);
    return match ? relativeTime(match.date) : 'No activity yet';
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen
        scroll
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        bottomInset={insets.bottom}
      >
        <ScreenHeader
          title="Accounts"
          right={
            <IconButton
              name="add"
              onPress={() => navigation.navigate('AccountEditor')}
              accessibilityLabel="Add account"
            />
          }
        />

        <View style={{ paddingHorizontal: spacing.xl }}>
          <Card gradient>
            <Text variant="micro" tone="secondary">
              Net across accounts
            </Text>
            <MoneyDisplay
              amount={total}
              currency={currency}
              size="display"
              style={{ marginTop: spacing.sm }}
            />
            <Text variant="caption" tone="tertiary" style={{ marginTop: 4 }}>
              {active.length} active · {archived.length} archived
            </Text>
          </Card>
        </View>

        <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
          <SectionHeader title="Active" />
          <View style={{ gap: spacing.md }}>
            {active.map((account, index) => (
              <Animated.View
                key={account.id}
                entering={FadeInDown.delay(index * 60)
                  .springify()
                  .damping(20)}
                layout={Layout.springify().damping(22)}
              >
                <PressableScale
                  onPress={() => navigation.navigate('AccountEditor', { id: account.id })}
                  haptic={false}
                  activeScale={0.99}
                >
                  <View
                    style={[
                      styles.row,
                      { backgroundColor: theme.colors.surface, borderColor: theme.colors.hairline },
                    ]}
                  >
                    <View
                      style={[styles.icon, { backgroundColor: withAlpha(account.color, 0.16) }]}
                    >
                      <Ionicons
                        name={kindMeta[account.kind].icon}
                        size={18}
                        color={account.color}
                      />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text variant="label">{account.name}</Text>
                      <Text variant="caption" tone="tertiary">
                        {account.institution} · {kindMeta[account.kind].label}
                      </Text>
                      <Text variant="caption" tone="tertiary" style={{ opacity: 0.7 }}>
                        {lastTouched(account.id)}
                      </Text>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text
                        variant="bodyStrong"
                        tabular
                        style={{
                          color: account.balance < 0 ? theme.colors.negative : theme.colors.text,
                        }}
                      >
                        {formatMoney(account.balance, { currency })}
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={13}
                        color={theme.colors.textTertiary}
                      />
                    </View>
                  </View>
                </PressableScale>
              </Animated.View>
            ))}
          </View>
        </View>

        {archived.length > 0 ? (
          <View style={{ paddingHorizontal: spacing.xl, marginTop: spacing.xxl }}>
            <SectionHeader title="Archived" />
            <View style={{ gap: spacing.sm }}>
              {archived.map((account) => (
                <PressableScale
                  key={account.id}
                  onPress={() => navigation.navigate('AccountEditor', { id: account.id })}
                  haptic={false}
                  style={[
                    styles.row,
                    {
                      backgroundColor: theme.colors.surfaceSunken,
                      borderColor: theme.colors.hairline,
                      opacity: 0.7,
                    },
                  ]}
                >
                  <View style={[styles.icon, { backgroundColor: withAlpha(account.color, 0.1) }]}>
                    <Ionicons name={kindMeta[account.kind].icon} size={18} color={account.color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text variant="label">{account.name}</Text>
                    <Text variant="caption" tone="tertiary">
                      Archived
                    </Text>
                  </View>
                  <Text variant="label" tabular tone="secondary">
                    {formatMoney(account.balance, { currency })}
                  </Text>
                </PressableScale>
              ))}
            </View>
          </View>
        ) : null}
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
