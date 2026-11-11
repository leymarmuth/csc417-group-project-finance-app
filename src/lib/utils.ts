import { useEffect, useState } from 'react';

/** Collision-resistant id without pulling in a native dependency. */
export function uid(prefix = 'id'): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now().toString(36)}${rand}`;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function groupBy<T, K extends string>(items: T[], keyOf: (item: T) => K) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = keyOf(item);
    (acc[key] ||= []).push(item);
    return acc;
  }, {});
}

export function sum<T>(items: T[], valueOf: (item: T) => number): number {
  return items.reduce((total, item) => total + valueOf(item), 0);
}

/**
 * Debounce a value — used to keep search inputs from re-filtering on every keystroke
 * while still feeling instant.
 */
export function useDebouncedValue<T>(value: T, delay = 180): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export const noop = () => {};

/** Turn a hex colour into rgba with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
