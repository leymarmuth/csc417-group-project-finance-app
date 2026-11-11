import { create } from 'zustand';
import { uid } from '../lib/utils';

export type ToastVariant = 'default' | 'success' | 'error' | 'warning';

export interface ToastAction {
  label: string;
  onPress: () => void;
}

export interface Toast {
  id: string;
  message: string;
  description?: string;
  variant: ToastVariant;
  action?: ToastAction;
  duration: number;
}

interface ToastState {
  toasts: Toast[];
  show: (
    toast: Omit<Toast, 'id' | 'duration' | 'variant'> & {
      variant?: ToastVariant;
      duration?: number;
    },
  ) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  show: ({ variant = 'default', duration = 4200, ...rest }) => {
    const id = uid('toast');
    set((state) => ({
      // Only ever stack two; keep the newest so the screen stays calm.
      toasts: [...state.toasts.slice(-1), { id, variant, duration, ...rest }],
    }));
    return id;
  },
  dismiss: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  clear: () => set({ toasts: [] }),
}));

/** Imperative helper so non-React code (stores, services) can raise a toast. */
export const toast = {
  show: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) =>
    useToastStore.getState().show({ message, ...options }),
  success: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) =>
    useToastStore.getState().show({ message, variant: 'success', ...options }),
  error: (message: string, options?: Partial<Omit<Toast, 'id' | 'message'>>) =>
    useToastStore.getState().show({ message, variant: 'error', ...options }),
  dismiss: (id: string) => useToastStore.getState().dismiss(id),
};
