import { create } from 'zustand';
import { AuthError, authService } from '../services/auth.service';
import type { Session, User } from '../types/models';

export type AuthStatus = 'booting' | 'signedOut' | 'signedIn';

interface AuthState {
  status: AuthStatus;
  user: User | null;
  pending: boolean;
  error: string | null;
  bootstrap: () => Promise<void>;
  signIn: (email: string, password: string, remember?: boolean) => Promise<void>;
  signUp: (name: string, email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  requestReset: (email: string) => Promise<void>;
  changePassword: (current: string, next: string, email: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'booting',
  user: null,
  pending: false,
  error: null,

  bootstrap: async () => {
    try {
      const session: Session | null = await authService.restore();
      set({ status: session ? 'signedIn' : 'signedOut', user: session?.user ?? null });
    } catch {
      set({ status: 'signedOut', user: null });
    }
  },

  signIn: async (email, password, remember = true) => {
    set({ pending: true, error: null });
    try {
      const session = await authService.signIn(email, password, remember);
      set({ status: 'signedIn', user: session.user, pending: false });
    } catch (error) {
      set({
        pending: false,
        error:
          error instanceof AuthError ? error.message : 'Something went wrong. Please try again.',
      });
      throw error;
    }
  },

  signUp: async (name, email, password) => {
    set({ pending: true, error: null });
    try {
      const session = await authService.signUp(name, email, password);
      set({ status: 'signedIn', user: session.user, pending: false });
    } catch (error) {
      set({
        pending: false,
        error: error instanceof AuthError ? error.message : 'Could not create your account.',
      });
      throw error;
    }
  },

  signOut: async () => {
    set({ pending: true });
    await authService.signOut();
    set({ status: 'signedOut', user: null, pending: false, error: null });
  },

  requestReset: async (email) => {
    set({ pending: true, error: null });
    try {
      await authService.requestPasswordReset(email);
    } finally {
      set({ pending: false });
    }
  },

  changePassword: async (current, next, email) => {
    set({ pending: true, error: null });
    try {
      await authService.changePassword(current, next, email);
    } catch (error) {
      set({
        pending: false,
        error: error instanceof AuthError ? error.message : 'Could not update your password.',
      });
      throw error;
    }
    set({ pending: false });
  },

  clearError: () => {
    if (get().error) set({ error: null });
  },
}));
