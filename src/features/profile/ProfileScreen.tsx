import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ListRow } from '../../components/ui/ListRow';
import { Screen } from '../../components/ui/Screen';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { Text } from '../../components/ui/Text';
import { MoneyDisplay } from '../../components/finance/MoneyDisplay';
import { useAuthStore } from '../../store/useAuthStore';
import { flushLedgerPersistence, useLedgerStore } from '../../store/useLedgerStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { PROJECT } from '../../constants/project';
import { ProjectSheet } from './components/ProjectSheet';
import { toast } from '../../store/useToastStore';
import { totalBalance } from '../../store/selectors';
import { haptics } from '../../lib/haptics';
import { spacing, useTheme } from '../../theme';
import type { TabScreenProps } from '../../navigation/types';

export function ProfileScreen({ navigation }: TabScreenProps<'Profile'>) {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const accounts = useLedgerStore((state) => state.accounts);
  const transactions = useLedgerStore((state) => state.transactions);
  const goals = useLedgerStore((state) => state.goals);
  const categories = useLedgerStore((state) => state.categories);
  const currency = useSettingsStore((state) => state.currency);
  const hideBalances = useSettingsStore((state) => state.hideBalances);
  const [projectOpen, setProjectOpen] = useState(false);

  const netWorth = useMemo(() => totalBalance(accounts), [accounts]);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })
    : '';

  return (
    <Screen scroll contentContainerStyle={{ paddingBottom: 150 }} bottomInset={insets.bottom}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
        <Avatar name={user?.name ?? 'Aurum'} size={76} />
        <Text variant="heading" style={{ marginTop: spacing.md }}>
          {user?.name ?? 'Aurum member'}
        </Text>
        <Text variant="caption" tone="tertiary">
          {user?.email ?? 'you@aurum.app'}
        </Text>
        <Text variant="micro" tone="tertiary" style={{ marginTop: spacing.sm }}>
          Member since {memberSince}
        </Text>
      </View>

      <Animated.View entering={FadeInDown.delay(80).springify().damping(20)} style={styles.section}>
        <Card gradient>
          <View style={styles.cardRow}>
            <View>
              <Text variant="micro" tone="secondary">
                Net worth
              </Text>
              <MoneyDisplay
                amount={netWorth}
                currency={currency}
                size="display"
                masked={hideBalances}
                style={{ marginTop: spacing.xs }}
              />
            </View>
            <View style={styles.statBlock}>
              <Text variant="caption" tone="tertiary">
                {transactions.length} entries
              </Text>
              <Text variant="caption" tone="tertiary">
                {goals.length} goals
              </Text>
              <Text variant="caption" tone="tertiary">
                {categories.length} categories
              </Text>
            </View>
          </View>
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(140).springify().damping(20)}
        style={styles.section}
      >
        <SectionHeader title="Your ledger" />
        <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
          <ListRow
            icon="wallet-outline"
            title="Accounts"
            subtitle={`${accounts.filter((a) => !a.archived).length} active`}
            onPress={() => navigation.navigate('Accounts')}
            chevron
          />
          <Divider />
          <ListRow
            icon="pricetags-outline"
            title="Categories"
            subtitle={`${categories.length} in use`}
            onPress={() => navigation.navigate('Categories')}
            chevron
          />
          <Divider />
          <ListRow
            icon="flag-outline"
            title="Goals"
            subtitle={`${goals.filter((g) => !g.archived).length} in motion`}
            onPress={() => navigation.navigate('Goals')}
            chevron
          />
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(200).springify().damping(20)}
        style={styles.section}
      >
        <SectionHeader title="Preferences" />
        <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
          <ListRow
            icon="settings-outline"
            title="Settings"
            subtitle="Appearance, currency, privacy"
            onPress={() => navigation.navigate('Settings')}
            chevron
          />
          <Divider />
          <ListRow
            icon="lock-closed-outline"
            title="Security"
            subtitle="Change your password"
            onPress={() => navigation.navigate('ChangePassword')}
            chevron
          />
          <Divider />
          <ListRow
            icon="school-outline"
            title="About this project"
            subtitle={`${PROJECT.institution} · ${PROJECT.courseCode}`}
            onPress={() => {
              haptics.tap();
              setProjectOpen(true);
            }}
            chevron
          />
          <Divider />
          <ListRow
            icon="help-circle-outline"
            title="Support"
            subtitle="Aurum is a demo experience"
            onPress={() => {
              haptics.tap();
              toast.show('Reach us at hello@aurum.app', {
                description: 'We read everything.',
              });
            }}
            chevron
          />
        </Card>
      </Animated.View>

      <Animated.View
        entering={FadeInDown.delay(260).springify().damping(20)}
        style={[styles.section, { gap: spacing.md }]}
      >
        <Button
          label="Sign out"
          variant="secondary"
          icon="log-out-outline"
          onPress={() => {
            void flushLedgerPersistence().then(() => signOut());
          }}
        />
        <Text variant="caption" tone="tertiary" align="center">
          Aurum 1.0.0 · {PROJECT.courseCode} {PROJECT.submissionType} · {PROJECT.institution}
        </Text>
      </Animated.View>

      <ProjectSheet visible={projectOpen} onClose={() => setProjectOpen(false)} />
    </Screen>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.hairline }} />
  );
}

const styles = StyleSheet.create({
  header: { alignItems: 'center', paddingHorizontal: spacing.xl },
  section: { paddingHorizontal: spacing.xl, marginTop: spacing.xxl },
  cardRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  statBlock: { alignItems: 'flex-end', gap: 2 },
});

export { Ionicons };
