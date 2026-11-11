import type { Session, User } from '../types/models';
import { sleep, uid } from '../lib/utils';
import { secure, STORAGE_KEYS } from './storage';

/**
 * Mock auth backend.
 *
 * Shaped exactly like a real HTTP client: async, latency, typed failures with
 * machine-readable codes. Swapping this file for `fetch()` calls requires no
 * changes anywhere else in the app.
 */

export type AuthErrorCode =
  'invalid_credentials' | 'email_taken' | 'not_found' | 'network' | 'unknown';

export class AuthError extends Error {
  constructor(
    public code: AuthErrorCode,
    message: string,
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

interface StoredCredential {
  user: User;
  /** Demo only — a real backend never stores this locally. */
  passwordHash: string;
}

const CREDENTIALS_KEY = 'aurum.demo.credentials';

/** Deterministic, non-cryptographic hash — clearly labelled as demo-only. */
function hash(input: string): string {
  let h = 5381;
  for (let i = 0; i < input.length; i += 1) {
    h = (h * 33) ^ input.charCodeAt(i);
  }
  return (h >>> 0).toString(16);
}

async function readCredentials(): Promise<StoredCredential[]> {
  const raw = await secure.get(CREDENTIALS_KEY);
  if (!raw) {
    const demo = await seedDemoAccount();
    return demo;
  }
  try {
    return JSON.parse(raw) as StoredCredential[];
  } catch {
    return seedDemoAccount();
  }
}

async function writeCredentials(list: StoredCredential[]) {
  await secure.set(CREDENTIALS_KEY, JSON.stringify(list));
}

const DEMO_EMAIL = 'brian@aurum.app';
const DEMO_PASSWORD = 'Aurum2026!';

export const DEMO_CREDENTIALS = { email: DEMO_EMAIL, password: DEMO_PASSWORD };

async function seedDemoAccount(): Promise<StoredCredential[]> {
  const list: StoredCredential[] = [
    {
      user: {
        id: 'user_demo',
        name: 'Brian Kiptoo',
        email: DEMO_EMAIL,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 214).toISOString(),
      },
      passwordHash: hash(DEMO_PASSWORD),
    },
  ];
  await writeCredentials(list);
  return list;
}

function buildSession(user: User): Session {
  return {
    token: `aurum_${uid('tok')}`,
    user,
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
  };
}

const latency = () => sleep(420 + Math.random() * 420);

export const authService = {
  async signIn(email: string, password: string, remember = true): Promise<Session> {
    await latency();
    const list = await readCredentials();
    const record = list.find((c) => c.user.email.toLowerCase() === email.trim().toLowerCase());
    if (!record)
      throw new AuthError('invalid_credentials', 'We could not find an account with that email.');
    if (record.passwordHash !== hash(password)) {
      throw new AuthError('invalid_credentials', 'That password does not match our records.');
    }
    const session = buildSession(record.user);
    if (remember) await secure.set(STORAGE_KEYS.session, JSON.stringify(session));
    return session;
  },

  async signUp(name: string, email: string, password: string): Promise<Session> {
    await latency();
    const list = await readCredentials();
    const normalised = email.trim().toLowerCase();
    if (list.some((c) => c.user.email.toLowerCase() === normalised)) {
      throw new AuthError('email_taken', 'An account with that email already exists.');
    }
    const user: User = {
      id: uid('user'),
      name: name.trim(),
      email: normalised,
      createdAt: new Date().toISOString(),
    };
    const next = [...list, { user, passwordHash: hash(password) }];
    await writeCredentials(next);
    const session = buildSession(user);
    await secure.set(STORAGE_KEYS.session, JSON.stringify(session));
    return session;
  },

  async restore(): Promise<Session | null> {
    const raw = await secure.get(STORAGE_KEYS.session);
    if (!raw) return null;
    try {
      const session = JSON.parse(raw) as Session;
      if (new Date(session.expiresAt).getTime() < Date.now()) {
        await secure.remove(STORAGE_KEYS.session);
        return null;
      }
      return session;
    } catch {
      return null;
    }
  },

  async signOut(): Promise<void> {
    await sleep(140);
    await secure.remove(STORAGE_KEYS.session);
  },

  /** Always resolves — we never reveal whether an address is registered. */
  async requestPasswordReset(email: string): Promise<void> {
    await latency();
    void email;
  },

  async changePassword(
    currentPassword: string,
    nextPassword: string,
    email: string,
  ): Promise<void> {
    await latency();
    const list = await readCredentials();
    const index = list.findIndex((c) => c.user.email.toLowerCase() === email.toLowerCase());
    if (index === -1) throw new AuthError('not_found', 'Account not found.');
    const record = list[index];
    if (record.passwordHash !== hash(currentPassword)) {
      throw new AuthError('invalid_credentials', 'Your current password is incorrect.');
    }
    const next = [...list];
    next[index] = { ...record, passwordHash: hash(nextPassword) };
    await writeCredentials(next);
  },
};
