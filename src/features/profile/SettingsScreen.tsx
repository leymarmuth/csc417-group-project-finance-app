import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { ConfirmSheet } from '../../components/ui/ConfirmSheet';
import { ListRow } from '../../components/ui/ListRow';
import { ScreenHeader } from '../../components/ui/ScreenHeader';
import { ProjectSheet } from './components/ProjectSheet';
import { SectionHeader } from '../../components/ui/SectionHeader';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Sheet } from '../../components/ui/Sheet';
import { Switch } from '../../components/ui/Switch';
import { Text } from '../../components/ui/Text';
import { useAuthStore } from '../../store/useAuthStore';
import { useLedgerStore, flushLedgerPersistence } from '../../store/useLedgerStore';
import { useSettingsStore, type ThemeMode } from '../../store/useSettingsStore';
import { toast } from '../../store/useToastStore';
import { CURRENCY_META } from '../../lib/format';
import { PROJECT } from '../../constants/project';
import { haptics } from '../../lib/haptics';
import { radius, spacing, useTheme } from '../../theme';
import type { RootScreenProps } from '../../navigation/types';
import type { CurrencyCode } from '../../types/models';

const CURRENCIES = Object.keys(CURRENCY_META) as CurrencyCode[];

export function SettingsScreen({ navigation }: RootScreenProps<'Settings'>) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const settings = useSettingsStore();
  const signOut = useAuthStore((state) => state.signOut);
  const resetToSeed = useLedgerStore((state) => state.resetToSeed);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSignOut, setConfirmSignOut] = useState(false);
  const [projectOpen, setProjectOpen] = useState(false);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScreenHeader title="Settings" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: spacing.xl,
          paddingBottom: insets.bottom + 120,
        }}
      >
        <Animated.View entering={FadeInDown.duration(320)} style={{ marginTop: spacing.md }}>
          <SectionHeader title="Appearance" />
          <Card>
            <Text variant="label" style={{ marginBottom: spacing.md }}>
              Theme
            </Text>
            <SegmentedControl
              value={settings.themeMode}
              onChange={(mode) => {
                haptics.select();
                settings.update('themeMode', mode as ThemeMode);
              }}
              options={[
                { value: 'system', label: 'Auto' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
            <Text variant="caption" tone="tertiary" style={{ marginTop: spacing.md }}>
              Aurum’s ink-and-gold palette adapts to your device setting.
            </Text>
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(70).duration(320)}
          style={{ marginTop: spacing.xxl }}
        >
          <SectionHeader title="Money" />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              icon="cash-outline"
              title="Currency"
              value={`${CURRENCY_META[settings.currency].symbol} ${settings.currency}`}
              onPress={() => setCurrencyOpen(true)}
              chevron
            />
            <Divider />
            <ListRow
              icon="eye-off-outline"
              title="Hide balances"
              subtitle="Mask amounts across the app"
              right={
                <Switch
                  value={settings.hideBalances}
                  onChange={(value) => settings.update('hideBalances', value)}
                />
              }
            />
            <Divider />
            <ListRow
              icon="fitness-outline"
              title="Haptics"
              subtitle="Tactile feedback on actions"
              right={
                <Switch
                  value={settings.hapticsEnabled}
                  onChange={(value) => settings.update('hapticsEnabled', value)}
                />
              }
            />
            <Divider />
            <ListRow
              icon="mail-outline"
              title="Weekly digest"
              subtitle="A Sunday recap of your week"
              right={
                <Switch
                  value={settings.weeklyDigest}
                  onChange={(value) => settings.update('weeklyDigest', value)}
                />
              }
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(140).duration(320)}
          style={{ marginTop: spacing.xxl }}
        >
          <SectionHeader title="Security" />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              icon="lock-closed-outline"
              title="Change password"
              onPress={() => navigation.navigate('ChangePassword')}
              chevron
            />
            <Divider />
            <ListRow
              icon="finger-print-outline"
              title="Biometric unlock"
              subtitle="Requires a native build"
              value="Coming soon"
              valueTone="primary"
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(210).duration(320)}
          style={{ marginTop: spacing.xxl }}
        >
          <SectionHeader title="Data" />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              icon="refresh-outline"
              title="Reset demo data"
              subtitle="Restore the seeded ledger"
              onPress={() => setConfirmReset(true)}
              chevron
            />
            <Divider />
            <ListRow
              icon="cloud-done-outline"
              title="Sync"
              subtitle="Everything is stored on this device"
              value="Offline"
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(240).duration(320)}
          style={{ marginTop: spacing.xxl }}
        >
          <SectionHeader title="Course project" />
          <Card padded={false} style={{ paddingHorizontal: spacing.lg }}>
            <ListRow
              icon="school-outline"
              title="About this project"
              subtitle={`${PROJECT.institution} · ${PROJECT.courseCode}`}
              onPress={() => setProjectOpen(true)}
              chevron
            />
            <Divider />
            <ListRow
              icon="school-outline"
              title="Course unit"
              value={PROJECT.courseCode}
              onPress={() => setProjectOpen(true)}
            />
            <Divider />
            <ListRow
              icon="code-slash-outline"
              title="Tech stack"
              subtitle="React Native · Expo · TypeScript"
              onPress={() => setProjectOpen(true)}
              chevron
            />
          </Card>
        </Animated.View>

        <Animated.View
          entering={FadeInDown.delay(280).duration(320)}
          style={{ marginTop: spacing.xxl, gap: spacing.md }}
        >
          <Button
            label="Sign out"
            variant="secondary"
            icon="log-out-outline"
            onPress={() => setConfirmSignOut(true)}
          />
          <Text variant="caption" tone="tertiary" align="center">
            Aurum 1.0.0 · {PROJECT.courseCode} {PROJECT.submissionType} · {PROJECT.institution}
          </Text>
        </Animated.View>
      </ScrollView>

      <ProjectSheet visible={projectOpen} onClose={() => setProjectOpen(false)} />

      <Sheet
        visible={currencyOpen}
        onClose={() => setCurrencyOpen(false)}
        title="Currency"
        description="Applies to display only — your data is untouched."
      >
        <View style={{ gap: spacing.sm }}>
          {CURRENCIES.map((code) => {
            const selected = settings.currency === code;
            return (
              <Pressable
                key={code}
                onPress={() => {
                  haptics.select();
                  settings.update('currency', code);
                  setCurrencyOpen(false);
                  toast.success(`Currency set to ${code}`);
                }}
                style={[
                  styles.currencyRow,
                  {
                    borderColor: selected ? theme.colors.accent : theme.colors.hairline,
                    backgroundColor: selected
                      ? theme.colors.accentSoft
                      : theme.colors.surfaceSunken,
                  },
                ]}
              >
                <Text variant="bodyStrong" style={{ width: 44 }}>
                  {CURRENCY_META[code].symbol}
                </Text>
                <Text variant="label" style={{ flex: 1 }}>
                  {code}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={18} color={theme.colors.accent} />
                ) : null}
              </Pressable>
            );
          })}
        </View>
      </Sheet>

      <ProjectSheet visible={projectOpen} onClose={() => setProjectOpen(false)} />

      <ConfirmSheet
        visible={confirmReset}
        title="Reset demo data?"
        description="This wipes local changes and reinstalls the sample three-month ledger."
        confirmLabel="Reset data"
        destructive
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          void resetToSeed().then(() => {
            haptics.success();
            toast.success('Demo ledger restored');
            navigation.goBack();
          });
        }}
      />

      <ConfirmSheet
        visible={confirmSignOut}
        title="Sign out of Aurum?"
        description="Your ledger stays on this device and will be here when you return."
        confirmLabel="Sign out"
        onClose={() => setConfirmSignOut(false)}
        onConfirm={() => {
          void flushLedgerPersistence().then(() => signOut());
        }}
      />
    </View>
  );
}

function Divider() {
  const theme = useTheme();
  return (
    <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: theme.colors.hairline }} />
  );
}

const styles = StyleSheet.create({
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth * 2,
  },
});
