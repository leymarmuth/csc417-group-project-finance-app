import React, { createContext, useContext, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../store/useSettingsStore';
import { themes, type ColorScheme, type Theme } from './tokens';

const ThemeContext = createContext<Theme>(themes.dark);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useSettingsStore((state) => state.themeMode);
  const systemScheme = useColorScheme();

  const scheme: ColorScheme = mode === 'system' ? (systemScheme ?? 'dark') : mode;
  const theme = themes[scheme];

  /** Memoised so consumers only re-render when the palette truly changes. */
  const value = useMemo(() => theme, [scheme]); // eslint-disable-line react-hooks/exhaustive-deps
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);
export const useScheme = (): ColorScheme => useContext(ThemeContext).scheme;

export { themes, palette, spacing, radius, fontSize, fonts, motion } from './tokens';
export type { Theme, ColorScheme } from './tokens';
