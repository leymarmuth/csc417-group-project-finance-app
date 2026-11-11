import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Two storage tiers:
 *  - `secure`  → expo-secure-store (Keychain / Keystore). Auth tokens only.
 *  - `kv`      → AsyncStorage. Cached, non-sensitive app data.
 * Every read is defensive: a corrupt payload must never brick the app.
 */
const isWeb = Platform.OS === 'web';

export const secure = {
  async get(key: string): Promise<string | null> {
    try {
      if (isWeb) return localStorage.getItem(key);
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  async set(key: string, value: string): Promise<void> {
    try {
      if (isWeb) localStorage.setItem(key, value);
      else await SecureStore.setItemAsync(key, value);
    } catch {
      /* Secure storage is best-effort; the session simply won't persist. */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      if (isWeb) localStorage.removeItem(key);
      else await SecureStore.deleteItemAsync(key);
    } catch {
      /* noop */
    }
  },
};

export const kv = {
  async getJSON<T>(key: string, fallback: T): Promise<T> {
    try {
      const raw = await AsyncStorage.getItem(key);
      if (!raw) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },
  async setJSON<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* noop */
    }
  },
  async remove(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {
      /* noop */
    }
  },
};

export const STORAGE_KEYS = {
  session: 'aurum.session',
  ledger: 'aurum.ledger.v1',
  settings: 'aurum.settings.v1',
  onboarding: 'aurum.onboarding.seen',
} as const;
