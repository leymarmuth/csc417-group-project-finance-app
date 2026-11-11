import type { CurrencyCode } from '../types/models';

const MINOR = 100;

export const CURRENCY_META: Record<CurrencyCode, { symbol: string; locale: string }> = {
  USD: { symbol: '$', locale: 'en-US' },
  EUR: { symbol: '€', locale: 'de-DE' },
  GBP: { symbol: '£', locale: 'en-GB' },
  KES: { symbol: 'KSh', locale: 'en-KE' },
  NGN: { symbol: '₦', locale: 'en-NG' },
  ZAR: { symbol: 'R', locale: 'en-ZA' },
  INR: { symbol: '₹', locale: 'en-IN' },
  AED: { symbol: 'AED', locale: 'en-AE' },
};

export interface MoneyOptions {
  currency?: CurrencyCode;
  /** Hide the fractional part (for large hero numbers). */
  compactCents?: boolean;
  signed?: boolean;
}

/** Money lives in minor units everywhere in the app. */
export function formatMoney(
  minorUnits: number,
  { currency = 'KES', compactCents = false, signed = false }: MoneyOptions = {},
): string {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.USD;
  const value = Math.abs(minorUnits) / MINOR;
  const digits = compactCents ? 0 : 2;
  let formatted: string;
  try {
    formatted = new Intl.NumberFormat(meta.locale, {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value);
  } catch {
    formatted = value.toFixed(digits);
  }
  const sign = signed ? (minorUnits < 0 ? '−' : '+') : minorUnits < 0 ? '−' : '';
  // Multi-letter symbols (KSh, AED) read badly jammed against the number.
  const gap = meta.symbol.length > 1 ? ' ' : '';
  return `${sign}${meta.symbol}${gap}${formatted}`;
}

/** Split into major/minor strings for editorial typography (big dollars, small cents). */
export function splitMoney(minorUnits: number, currency: CurrencyCode = 'KES') {
  const meta = CURRENCY_META[currency] ?? CURRENCY_META.USD;
  const abs = Math.abs(minorUnits) / MINOR;
  const [whole, cents = '00'] = abs.toFixed(2).split('.');
  const grouped = (() => {
    try {
      return new Intl.NumberFormat(meta.locale, { maximumFractionDigits: 0 }).format(Number(whole));
    } catch {
      return whole;
    }
  })();
  return { symbol: meta.symbol, whole: grouped, cents, negative: minorUnits < 0 };
}

/** Parse a human-typed amount ("1,240.50") into minor units. */
export function parseAmount(input: string): number | null {
  const cleaned = input.replace(/[^0-9.,-]/g, '').replace(/,/g, '');
  if (!cleaned) return null;
  const value = Number(cleaned);
  if (!Number.isFinite(value)) return null;
  return Math.round(value * MINOR);
}

/** 12,400 -> "12.4k" for chart axes. */
export function formatCompact(value: number): string {
  const abs = Math.abs(value);
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(value / 1_000).toFixed(abs >= 10_000 ? 0 : 1)}k`;
  return `${Math.round(value)}`;
}

export function formatPercent(value: number, digits = 0): string {
  return `${(value * 100).toFixed(digits)}%`;
}

export function initials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}
