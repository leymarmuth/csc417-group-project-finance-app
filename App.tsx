/**
 * AURUM — Personal Finance & Wealth Tracker
 * ---------------------------------------------------------------------------
 * CSC 417 · GROUP PROJECT
 *
 * A complete Expo / React Native application: onboarding, authentication, five
 * tabs, CRUD across transactions, categories, accounts, budgets and goals,
 * animated data visualisation, offline-first persistence and light/dark
 * theming. See README.md and docs/PROJECT.md for the full submission write-up.
 */
import { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
  Manrope_700Bold,
  Manrope_800ExtraBold,
} from '@expo-google-fonts/manrope';
import {
  InstrumentSerif_400Regular,
  InstrumentSerif_400Regular_Italic,
} from '@expo-google-fonts/instrument-serif';
import { ThemeProvider, useTheme } from './src/theme';
import { RootNavigator } from './src/navigation/RootNavigator';
import { Launcher } from './src/components/system/Launcher';
import { Toaster } from './src/components/ui/Toaster';
import { useSettingsStore } from './src/store/useSettingsStore';
import { useLedgerStore } from './src/store/useLedgerStore';
import { useAuthStore } from './src/store/useAuthStore';

void SplashScreen.preventAutoHideAsync();

/**
 * Boot sequence:
 *  1. Fonts load behind the native splash (no FOIT, no layout jump).
 *  2. Settings, ledger and session hydrate in parallel under the Aurum launcher.
 *  3. Navigation mounts only when everything is resident.
 */
export default function App() {
  const [fontsLoaded, fontError] = useFonts({
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
    Manrope_700Bold,
    Manrope_800ExtraBold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });

  const hydrateSettings = useSettingsStore((state) => state.hydrate);
  const hydrateLedger = useLedgerStore((state) => state.hydrate);
  const bootstrap = useAuthStore((state) => state.bootstrap);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    void SplashScreen.hideAsync();
    let alive = true;
    void (async () => {
      await Promise.all([hydrateSettings(), hydrateLedger(), bootstrap()]);
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [bootstrap, fontError, fontsLoaded, hydrateLedger, hydrateSettings]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <ThemeProvider>
          <Shell ready={ready} />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

function Shell({ ready }: { ready: boolean }) {
  const theme = useTheme();
  return (
    <>
      <StatusBar style={theme.scheme === 'dark' ? 'light' : 'dark'} animated />
      {ready ? <RootNavigator /> : <Launcher />}
      <Toaster />
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
