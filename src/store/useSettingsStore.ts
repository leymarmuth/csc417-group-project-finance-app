import { create } from 'zustand';
import { kv, STORAGE_KEYS } from '../services/storage';
import type { CurrencyCode } from '../types/models';

export type ThemeMode = 'system' | 'light' | 'dark';

export interface SettingsValues {
  themeMode: ThemeMode;
  currency: CurrencyCode;
  hapticsEnabled: boolean;
  hideBalances: boolean;
  weeklyDigest: boolean;
}

interface SettingsState extends SettingsValues {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  update: <K extends keyof SettingsValues>(key: K, value: SettingsValues[K]) => void;
}

const DEFAULTS: SettingsValues = {
  themeMode: 'dark',
  currency: 'KES',
  hapticsEnabled: true,
  hideBalances: false,
  weeklyDigest: true,
};

const pick = (state: SettingsState): SettingsValues => ({
  themeMode: state.themeMode,
  currency: state.currency,
  hapticsEnabled: state.hapticsEnabled,
  hideBalances: state.hideBalances,
  weeklyDigest: state.weeklyDigest,
});

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...DEFAULTS,
  hydrated: false,
  hydrate: async () => {
    const stored = await kv.getJSON<Partial<SettingsValues>>(STORAGE_KEYS.settings, {});
    set({ ...DEFAULTS, ...stored, hydrated: true });
  },
  update: (key, value) => {
    set({ [key]: value } as Pick<SettingsState, typeof key>);
    void kv.setJSON<SettingsValues>(STORAGE_KEYS.settings, pick(get()));
  },
}));

export const useSetting = <K extends keyof SettingsValues>(key: K): SettingsValues[K] =>
  useSettingsStore((state) => state[key]);
