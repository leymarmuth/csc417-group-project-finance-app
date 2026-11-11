import { ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '../../../components/ui/PressableScale';
import { Text } from '../../../components/ui/Text';
import { formatMoney } from '../../../lib/format';
import { withAlpha } from '../../../lib/utils';
import { radius, spacing, useTheme } from '../../../theme';
import type { Account, CurrencyCode } from '../../../types/models';

const kindIcon: Record<Account['kind'], keyof typeof Ionicons.glyphMap> = {
  checking: 'wallet-outline',
  savings: 'shield-checkmark-outline',
  card: 'card-outline',
  cash: 'cash-outline',
  investment: 'trending-up-outline',
};

const accountKindLabel: Record<Account['kind'], string> = {
  checking: 'Bank',
  savings: 'Sacco',
  card: 'Card',
  cash: 'Mobile',
  investment: 'Fund',
};

export function AccountStrip({
  accounts,
  currency,
  masked,
  onPressAccount,
  onAdd,
}: {
  accounts: Account[];
  currency: CurrencyCode;
  masked: boolean;
  onPressAccount: (account: Account) => void;
  onAdd: () => void;
}) {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      snapToInterval={172}
      decelerationRate="fast"
    >
      {accounts
        .filter((account) => !account.archived)
        .map((account) => (
          <PressableScale
            key={account.id}
            onPress={() => onPressAccount(account)}
            activeScale={0.96}
            haptic={false}
          >
            <View
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderColor: theme.colors.hairline,
                },
              ]}
            >
              <LinearGradient
                colors={[withAlpha(account.color, 0.18), 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.cardTop}>
                <View
                  style={[styles.iconWrap, { backgroundColor: withAlpha(account.color, 0.16) }]}
                >
                  <Ionicons name={kindIcon[account.kind]} size={15} color={account.color} />
                </View>
                <Text
                  variant="micro"
                  tone="tertiary"
                  numberOfLines={1}
                  style={{ flex: 1, textAlign: 'right' }}
                >
                  {accountKindLabel[account.kind]}
                </Text>
              </View>
              <Text variant="label" numberOfLines={1} style={{ marginTop: spacing.sm }}>
                {account.name}
              </Text>
              <Text variant="bodyStrong" tabular numberOfLines={1} style={{ marginTop: 2 }}>
                {masked ? '•••• ••' : formatMoney(account.balance, { currency })}
              </Text>
              <Text variant="caption" tone="tertiary" numberOfLines={1} style={{ marginTop: 1 }}>
                {account.institution}
              </Text>
            </View>
          </PressableScale>
        ))}

      <PressableScale onPress={onAdd} activeScale={0.96} haptic={false}>
        <View
          style={[
            styles.card,
            styles.addCard,
            { borderColor: theme.colors.hairlineStrong, backgroundColor: 'transparent' },
          ]}
        >
          <Ionicons name="add" size={20} color={theme.colors.textTertiary} />
          <Text variant="caption" tone="tertiary">
            Add account
          </Text>
        </View>
      </PressableScale>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, paddingRight: spacing.lg },
  card: {
    width: 160,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth * 2,
    overflow: 'hidden',
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 6 },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    width: 116,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderStyle: 'dashed',
  },
});
