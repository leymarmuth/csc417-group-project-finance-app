import type { MonthKey } from '../types/models';

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);

export function addMonths(d: Date, delta: number): Date {
  const next = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  return next;
}

export function monthKey(d: Date): MonthKey {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function monthKeyOf(iso: string): MonthKey {
  return monthKey(new Date(iso));
}

export function monthLabel(key: MonthKey): string {
  const [year, month] = key.split('-').map(Number);
  return `${MONTHS[(month ?? 1) - 1]} ${year}`;
}

export function shortMonth(key: MonthKey): string {
  const [, month] = key.split('-').map(Number);
  return MONTHS[(month ?? 1) - 1].slice(0, 3);
}

export function monthRange(key: MonthKey): { from: Date; to: Date } {
  const [year, month] = key.split('-').map(Number);
  const from = new Date(year, (month ?? 1) - 1, 1);
  const to = new Date(year, month ?? 1, 1);
  return { from, to };
}

export function daysInMonth(key: MonthKey): number {
  const [year, month] = key.split('-').map(Number);
  return new Date(year, month ?? 1, 0).getDate();
}

export function toISODate(d: Date): string {
  return d.toISOString();
}

export function formatDateLabel(iso: string): string {
  const d = new Date(iso);
  const today = startOfDay(new Date());
  const target = startOfDay(d);
  const diffDays = Math.round((today.getTime() - target.getTime()) / 86_400_000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays > 1 && diffDays < 7) return DAYS[d.getDay()];
  return `${d.getDate()} ${MONTHS[d.getMonth()].slice(0, 3)}`;
}

export function formatFullDate(iso: string): string {
  const d = new Date(iso);
  return `${DAYS[d.getDay()]}, ${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatDayHeading(iso: string): string {
  return formatDateLabel(iso);
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.round(diff / 60_000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDateLabel(iso);
}

export { MONTHS, DAYS };
